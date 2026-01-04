import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authenticateRequest, unauthorizedResponse, validateString, sanitizeForIlike } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Entity and relationship types matching the knowledge graph
const ENTITY_TYPES = ['project', 'blocker', 'emotion', 'pattern', 'win', 'skill', 'person', 'tool', 'habit'] as const;
const RELATIONSHIP_TYPES = ['BLOCKS', 'TRIGGERS', 'ENABLES', 'REQUIRES', 'CAUSED_BY', 'HELPS_WITH', 'RELATES_TO'] as const;

interface ExtractedEntity {
  entity_type: string;
  name: string;
  description: string;
}

interface ExtractedRelationship {
  source_name: string;
  relationship_type: string;
  target_name: string;
  description: string;
  confidence: number;
}

interface ExtractionResult {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
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
    const user_message = validateString(body.user_message, 10000);
    const assistant_message = validateString(body.assistant_message, 20000);
    
    if (!user_message || !assistant_message) {
      return new Response(
        JSON.stringify({ error: "Invalid or missing messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Combine messages for context
    const conversationText = `User: ${user_message}\n\nAURFELIA: ${assistant_message}`;

    const extractionPrompt = `You are an entity and relationship extractor for a personal productivity knowledge graph for someone with ADHD.

CONVERSATION:
${conversationText}

Extract entities and relationships mentioned or implied in this conversation. Be selective - only extract meaningful, reusable concepts.

ENTITY TYPES (use exactly these):
- project: Work/study projects (AWS Cert, GreenLedger.AI, thesis)
- blocker: Obstacles (procrastination, perfectionism, context switching, overwhelm)
- emotion: Emotional states (overwhelmed, confident, stressed, frustrated, motivated)
- pattern: Recurring behaviors (energy crash, hyperfocus, avoidance, phone rabbit hole)
- win: Achievements (shipped code, landed gig, completed task, passed exam)
- skill: Abilities needed (focus stability, time management, execution reliability)
- person: People mentioned (collaborators, mentors)
- tool: Tools/systems (brain.fm, Pomodoro, calendar blocking)
- habit: Routines (morning routine, deep work blocks)

RELATIONSHIP TYPES (use exactly these):
- BLOCKS: X prevents Y from happening
- TRIGGERS: X causes Y to start
- ENABLES: X makes Y possible
- REQUIRES: X needs Y to work
- CAUSED_BY: X is a result of Y
- HELPS_WITH: X assists with Y
- RELATES_TO: X is connected to Y (general)

RULES:
1. Only extract entities that could be useful for future pattern recognition
2. Skip trivial or one-off mentions
3. Normalize names (e.g., "AWS" and "AWS Cert" should be "AWS Certification")
4. Confidence score 0.0-1.0 (how certain is this relationship?)
5. If nothing meaningful to extract, return empty arrays

Return ONLY valid JSON:
{
  "entities": [
    {"entity_type": "blocker", "name": "Procrastination", "description": "Tendency to delay important tasks"}
  ],
  "relationships": [
    {"source_name": "Procrastination", "relationship_type": "BLOCKS", "target_name": "AWS Certification", "description": "Procrastination is preventing progress on AWS cert", "confidence": 0.8}
  ]
}`;

    console.log("Extracting entities from conversation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: extractionPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent extraction
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ error: "Extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.log("No content in AI response");
      return new Response(JSON.stringify({ entities: [], relationships: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse JSON from response (handle markdown code blocks)
    let extracted: ExtractionResult;
    try {
      let jsonStr = content.trim();
      // Remove markdown code blocks if present
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.slice(7);
      } else if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.slice(0, -3);
      }
      extracted = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse extraction result:", content);
      return new Response(JSON.stringify({ entities: [], relationships: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and store entities
    const storedEntities: Record<string, string> = {}; // name -> id mapping
    
    for (const entity of extracted.entities || []) {
      if (!ENTITY_TYPES.includes(entity.entity_type as any)) {
        console.log(`Skipping invalid entity type: ${entity.entity_type}`);
        continue;
      }

      // Check if entity already exists
      const { data: existing } = await supabase
        .from("knowledge_entities")
        .select("id, frequency")
        .ilike("name", entity.name)
        .single();

      if (existing) {
        // Update frequency and last_mentioned
        await supabase
          .from("knowledge_entities")
          .update({
            frequency: (existing.frequency || 1) + 1,
            last_mentioned: new Date().toISOString(),
            description: entity.description || undefined, // Only update if provided
          })
          .eq("id", existing.id);
        
        storedEntities[entity.name.toLowerCase()] = existing.id;
        console.log(`Updated existing entity: ${entity.name} (freq: ${existing.frequency + 1})`);
      } else {
        // Create new entity
        const { data: newEntity, error } = await supabase
          .from("knowledge_entities")
          .insert({
            entity_type: entity.entity_type,
            name: entity.name,
            description: entity.description,
            frequency: 1,
            importance: 5,
            last_mentioned: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error) {
          console.error("Entity insert error:", error);
        } else if (newEntity) {
          storedEntities[entity.name.toLowerCase()] = newEntity.id;
          console.log(`Created new entity: ${entity.name}`);
        }
      }
    }

    // Store relationships
    let relationshipsCreated = 0;
    for (const rel of extracted.relationships || []) {
      if (!RELATIONSHIP_TYPES.includes(rel.relationship_type as any)) {
        console.log(`Skipping invalid relationship type: ${rel.relationship_type}`);
        continue;
      }

      // Find source and target entity IDs
      let sourceId = storedEntities[rel.source_name.toLowerCase()];
      let targetId = storedEntities[rel.target_name.toLowerCase()];

      // If not in current batch, look up in database
      if (!sourceId) {
        const { data } = await supabase
          .from("knowledge_entities")
          .select("id")
          .ilike("name", rel.source_name)
          .single();
        sourceId = data?.id;
      }

      if (!targetId) {
        const { data } = await supabase
          .from("knowledge_entities")
          .select("id")
          .ilike("name", rel.target_name)
          .single();
        targetId = data?.id;
      }

      if (sourceId && targetId) {
        // Check if relationship already exists
        const { data: existingRel } = await supabase
          .from("knowledge_relationships")
          .select("id, strength")
          .eq("source_id", sourceId)
          .eq("target_id", targetId)
          .eq("relationship_type", rel.relationship_type)
          .single();

        if (existingRel) {
          // Strengthen existing relationship
          await supabase
            .from("knowledge_relationships")
            .update({
              strength: Math.min((existingRel.strength || 5) + 1, 10),
              notes: rel.description,
            })
            .eq("id", existingRel.id);
          console.log(`Strengthened relationship: ${rel.source_name} -[${rel.relationship_type}]-> ${rel.target_name}`);
        } else {
          // Create new relationship
          const { error } = await supabase
            .from("knowledge_relationships")
            .insert({
              source_id: sourceId,
              target_id: targetId,
              relationship_type: rel.relationship_type,
              strength: Math.round(rel.confidence * 10),
              notes: rel.description,
            });

          if (error) {
            console.error("Relationship insert error:", error);
          } else {
            relationshipsCreated++;
            console.log(`Created relationship: ${rel.source_name} -[${rel.relationship_type}]-> ${rel.target_name}`);
          }
        }
      } else {
        console.log(`Skipping relationship - missing entity: ${rel.source_name} -> ${rel.target_name}`);
      }
    }

    const result = {
      entities_processed: extracted.entities?.length || 0,
      relationships_processed: extracted.relationships?.length || 0,
      relationships_created: relationshipsCreated,
    };

    console.log("Extraction complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("extract-entities error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
