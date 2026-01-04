import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, unauthorizedResponse, validateString, sanitizeForIlike } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Entity {
  id: string;
  name: string;
  entity_type: string;
  description: string | null;
  frequency: number;
  importance: number;
}

interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: string;
  strength: number;
  notes: string | null;
}

interface GraphContext {
  entities: Entity[];
  relationships: Relationship[];
  paths: string[];
  summary: string;
}

// Extract key concepts from the user's question using LLM
async function extractQueryConcepts(question: string, apiKey: string): Promise<string[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "user",
          content: `Extract the key concepts, entities, or topics from this question that would be relevant to search in a personal knowledge graph about productivity, projects, blockers, emotions, patterns, skills, and habits.

Question: "${question}"

Return ONLY a JSON array of concept strings (lowercase, normalized). Example: ["procrastination", "aws certification", "focus", "overwhelm"]

If no relevant concepts, return empty array: []`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Concept extraction failed:", response.status);
    return [];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() || "[]";
  
  try {
    let jsonStr = content;
    if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    return JSON.parse(jsonStr.trim());
  } catch {
    console.error("Failed to parse concepts:", content);
    return [];
  }
}

// Find entities matching the extracted concepts
async function findMatchingEntities(
  supabase: any,
  concepts: string[]
): Promise<Entity[]> {
  if (concepts.length === 0) return [];

  // Build ILIKE conditions for fuzzy matching
  const matchedEntities: Entity[] = [];
  
  for (const concept of concepts) {
    const sanitized = sanitizeForIlike(concept);
    const { data } = await supabase
      .from("knowledge_entities")
      .select("*")
      .or(`name.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
      .limit(5);
    
    if (data) {
      for (const entity of data) {
        if (!matchedEntities.find(e => e.id === entity.id)) {
          matchedEntities.push(entity);
        }
      }
    }
  }

  return matchedEntities;
}

// N-hop graph traversal to find connected subgraph
async function traverseGraph(
  supabase: any,
  seedEntityIds: string[],
  maxHops: number = 2
): Promise<{ entities: Entity[]; relationships: Relationship[] }> {
  const visitedIds = new Set<string>(seedEntityIds);
  const allRelationships: Relationship[] = [];
  let currentIds = seedEntityIds;

  for (let hop = 0; hop < maxHops; hop++) {
    if (currentIds.length === 0) break;

    // Find all relationships from/to current entities
    const { data: outgoing } = await supabase
      .from("knowledge_relationships")
      .select("*")
      .in("source_id", currentIds);

    const { data: incoming } = await supabase
      .from("knowledge_relationships")
      .select("*")
      .in("target_id", currentIds);

    const newIds: string[] = [];
    
    for (const rel of [...(outgoing || []), ...(incoming || [])]) {
      if (!allRelationships.find(r => r.id === rel.id)) {
        allRelationships.push(rel);
      }
      
      // Collect new entity IDs to explore
      if (!visitedIds.has(rel.source_id)) {
        visitedIds.add(rel.source_id);
        newIds.push(rel.source_id);
      }
      if (!visitedIds.has(rel.target_id)) {
        visitedIds.add(rel.target_id);
        newIds.push(rel.target_id);
      }
    }

    currentIds = newIds;
  }

  // Fetch all visited entities
  const { data: entities } = await supabase
    .from("knowledge_entities")
    .select("*")
    .in("id", Array.from(visitedIds));

  return {
    entities: entities || [],
    relationships: allRelationships,
  };
}

// Find specific patterns: blockers, causal chains, etc.
async function findCausalPaths(
  supabase: any,
  targetEntityId: string
): Promise<string[]> {
  const paths: string[] = [];

  // Find what BLOCKS this entity
  const { data: blockers } = await supabase
    .from("knowledge_relationships")
    .select(`
      source_id,
      relationship_type,
      notes,
      source:knowledge_entities!knowledge_relationships_source_id_fkey(name, entity_type)
    `)
    .eq("target_id", targetEntityId)
    .eq("relationship_type", "BLOCKS");

  for (const b of blockers || []) {
    if (b.source) {
      paths.push(`${b.source.name} (${b.source.entity_type}) BLOCKS the target`);
    }
  }

  // Find what TRIGGERS this entity
  const { data: triggers } = await supabase
    .from("knowledge_relationships")
    .select(`
      source_id,
      relationship_type,
      notes,
      source:knowledge_entities!knowledge_relationships_source_id_fkey(name, entity_type)
    `)
    .eq("target_id", targetEntityId)
    .eq("relationship_type", "TRIGGERS");

  for (const t of triggers || []) {
    if (t.source) {
      paths.push(`${t.source.name} (${t.source.entity_type}) TRIGGERS the target`);
    }
  }

  // Find what this entity BLOCKS
  const { data: blocking } = await supabase
    .from("knowledge_relationships")
    .select(`
      target_id,
      relationship_type,
      notes,
      target:knowledge_entities!knowledge_relationships_target_id_fkey(name, entity_type)
    `)
    .eq("source_id", targetEntityId)
    .eq("relationship_type", "BLOCKS");

  for (const b of blocking || []) {
    if (b.target) {
      paths.push(`This entity BLOCKS ${b.target.name} (${b.target.entity_type})`);
    }
  }

  return paths;
}

// Serialize subgraph into context text for LLM
function serializeGraphContext(
  entities: Entity[],
  relationships: Relationship[],
  paths: string[]
): string {
  if (entities.length === 0) {
    return "";
  }

  const entityMap = new Map(entities.map(e => [e.id, e]));
  
  let context = "## KNOWLEDGE GRAPH CONTEXT\n\n";
  
  // Group entities by type
  const byType = entities.reduce((acc, e) => {
    if (!acc[e.entity_type]) acc[e.entity_type] = [];
    acc[e.entity_type].push(e);
    return acc;
  }, {} as Record<string, Entity[]>);

  context += "### Entities from your personal knowledge graph:\n";
  for (const [type, ents] of Object.entries(byType)) {
    context += `\n**${type.toUpperCase()}S:**\n`;
    for (const e of ents) {
      const importance = e.importance >= 7 ? "⭐" : "";
      const freq = e.frequency > 3 ? ` (mentioned ${e.frequency}x)` : "";
      context += `- ${importance}${e.name}${freq}`;
      if (e.description) context += `: ${e.description}`;
      context += "\n";
    }
  }

  // Add relationships
  if (relationships.length > 0) {
    context += "\n### Connections in your graph:\n";
    for (const r of relationships.slice(0, 15)) { // Limit to top 15
      const source = entityMap.get(r.source_id);
      const target = entityMap.get(r.target_id);
      if (source && target) {
        const strength = r.strength >= 7 ? " (strong)" : r.strength <= 3 ? " (weak)" : "";
        context += `- ${source.name} --[${r.relationship_type}${strength}]--> ${target.name}`;
        if (r.notes) context += ` | "${r.notes}"`;
        context += "\n";
      }
    }
  }

  // Add causal paths
  if (paths.length > 0) {
    context += "\n### Causal Analysis:\n";
    for (const p of paths) {
      context += `- ${p}\n`;
    }
  }

  return context;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  const { user, error: authError } = await authenticateRequest(req);
  if (authError || !user) {
    return unauthorizedResponse(authError || "Unauthorized", corsHeaders);
  }

  try {
    const body = await req.json();
    const question = validateString(body.question, 2000);
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing question" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const include_high_importance = body.include_high_importance ?? true;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("GraphRAG query:", question);

    // Step 1: Extract key concepts from the question
    const concepts = await extractQueryConcepts(question, LOVABLE_API_KEY!);
    console.log("Extracted concepts:", concepts);

    // Step 2: Find matching entities in the graph
    const seedEntities = await findMatchingEntities(supabase, concepts);
    console.log("Seed entities found:", seedEntities.length);

    // Step 3: Add high-importance entities (backbone) if requested
    let allSeedIds = seedEntities.map(e => e.id);
    
    if (include_high_importance) {
      const { data: backbone } = await supabase
        .from("knowledge_entities")
        .select("id")
        .gte("importance", 7)
        .order("frequency", { ascending: false })
        .limit(10);
      
      if (backbone) {
        for (const b of backbone) {
          if (!allSeedIds.includes(b.id)) {
            allSeedIds.push(b.id);
          }
        }
      }
    }

    // Step 4: Traverse graph from seed entities (2-hop)
    const { entities, relationships } = await traverseGraph(supabase, allSeedIds, 2);
    console.log("Subgraph:", entities.length, "entities,", relationships.length, "relationships");

    // Step 5: Find causal paths for primary entities
    const paths: string[] = [];
    for (const seedEntity of seedEntities.slice(0, 3)) { // Top 3 matches
      const entityPaths = await findCausalPaths(supabase, seedEntity.id);
      paths.push(...entityPaths);
    }

    // Step 6: Serialize to context
    const contextText = serializeGraphContext(entities, relationships, paths);

    // Step 7: Generate a brief summary of what was found
    let summary = "";
    if (entities.length > 0) {
      summary = `Found ${entities.length} relevant entities and ${relationships.length} connections in your knowledge graph.`;
      if (paths.length > 0) {
        summary += ` Identified ${paths.length} causal patterns.`;
      }
    } else {
      summary = "No matching entities found in knowledge graph.";
    }

    const result: GraphContext = {
      entities,
      relationships,
      paths,
      summary,
    };

    console.log("GraphRAG result:", summary);

    return new Response(JSON.stringify({
      ...result,
      context: contextText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("graphrag-query error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});