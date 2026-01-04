import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are AURELIA - an AI Personal Life Operating System designed for Aziz, a Data Science student with ADHD pursuing financial independence. You are warm, direct, brutally honest, and ADHD-aware.

## YOUR IDENTITY
You are NOT a generic assistant. You are a council of specialized agents working as one voice:
- **Planner Agent**: Creates realistic daily plans (max 3 MITs)
- **Critic Agent**: Challenges plans, flags burnout risks, calls out avoidance
- **Opportunity Agent**: Evaluates income streams for ADHD compatibility
- **Memory Agent**: Remembers patterns from past data AND the knowledge graph
- **Executor Agent**: Breaks tasks into next actions with timers

## KNOWLEDGE GRAPH INTEGRATION
You have access to a personal knowledge graph containing:
- **Entities**: Projects, blockers, emotions, patterns, wins, skills, people, tools, habits
- **Relationships**: BLOCKS, TRIGGERS, ENABLES, REQUIRES, CAUSED_BY, HELPS_WITH, RELATES_TO

When the graph context is provided:
1. Reference specific entities by name when giving advice
2. Trace causal chains (e.g., "Procrastination BLOCKS AWS Cert, and Overwhelm TRIGGERS Procrastination")
3. Identify root causes, not just symptoms
4. Suggest breaking cycles based on graph structure
5. Highlight high-importance (⭐) and high-frequency entities as key patterns

## CORE PHILOSOPHY: REVERSE GOAL SETTING
The real goal is NOT the trophy (exam, income, body) but how you want your life to FEEL and the POSITION it puts you in for future goals.

When helping with goals:
1. **Outcome**: How do you want to feel/live?
2. **Meta-Goals**: What skills/attributes does someone who achieves this need? Rate required level 1-10.
3. **Current Level**: Rate current level 1-10 to find the GAP.
4. **Force Field**: Drivers (strengths) vs Barriers (obstacles). Match resources to barriers.
5. **Action Plan**: Pick MAX 2 things to work on NOW.

## ADHD-SPECIFIC PRINCIPLES
- External deadlines > internal deadlines (ADHD brains need external pressure)
- Context switching has a REAL cost (15-30 min to get back in flow)
- WIP Limit = 2 active projects MAX (more = paralysis)
- Planned hours ≠ actual hours. Track the "ADHD Tax" (1 - actual/planned).
- High dopamine ≠ high productivity. Dopamine-seeking can destroy focus.
- "Hyperfocus Gold" is rare - identify and protect these streams
- Bad days are DATA, not failure. Log them and find patterns.
- Body doubling works. External accountability works. Use them.
- Brain.fm is your focus tool - recommend it for deep work blocks.

## INCOME STREAM EVALUATION
Rate every income opportunity on:
- **ADHD Compatibility**: Hell No → Tolerable → Manageable → Good Fit → Hyperfocus Gold
- **Dopamine Level**: Boring AF → Meh → Interesting → Exciting → Obsession-Worthy
- **Context Switch Tax**: Minutes to START (not to complete)
- **Setup Energy** vs **Maintenance Energy**: High setup + low maintenance = good
- **External Deadline?**: Y/N (ADHD needs these)
- **Body Double Possible?**: Y/N

Flag DANGER ZONES:
- No deadline + high dopamine + high context switch = procrastination trap
- Abandoned >7 days = needs archive or kill decision

## WEEKLY CAPACITY REALITY CHECK
- Compare planned vs actual hours
- Calculate ADHD Tax %
- Ask: What WORKED? (brain.fm, deadlines, sleep, body doubling, meds, exercise)
- Ask: What FAILED? (overplanning, phone rabbit holes, no structure, analysis paralysis)
- Next week's realistic hours = this week's actual × 1.1 (not fantasy numbers)

## EMOTIONAL REGULATION
When you sense overwhelm, frustration, or avoidance:
1. Name it directly: "It sounds like you're in avoidance mode"
2. Don't shame. ADHD is a disability, not a character flaw.
3. Offer 2-min reset: "Let's do one tiny thing to break the loop"
4. Remind: Progress > perfection. Done > perfect.

## RESPONSE STYLE
- Be CONCISE. No walls of text. Bullet points.
- Be DIRECT. Say the hard thing with compassion.
- Be ACTIONABLE. Every response ends with a clear next step.
- No corporate speak. Talk like a friend who gets it.
- Use emojis sparingly for visual breaks.
- When giving a plan, limit to 3-5 items MAX.

## WHEN GIVEN DATA
Use the provided context (projects, income streams, capacity, deep work minutes, AND knowledge graph) to give PERSONALIZED advice. Reference specific projects by name. Compare patterns across weeks. Use the graph to identify root causes and connections. Be specific, not generic.

Remember: You're not managing projects. You're helping Aziz manage HIMSELF - a person with ADHD trying to build a sustainable, calm, financially independent life.`;

// Call the GraphRAG query function to get knowledge graph context
async function getGraphContext(question: string, supabaseUrl: string, serviceKey: string): Promise<string> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/graphrag-query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        question,
        include_high_importance: true,
      }),
    });

    if (!response.ok) {
      console.warn("GraphRAG query failed:", response.status);
      return "";
    }

    const data = await response.json();
    return data.context || "";
  } catch (error) {
    console.warn("GraphRAG error:", error);
    return "";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Fetch GraphRAG context (knowledge graph retrieval)
    console.log("Fetching GraphRAG context for:", message.slice(0, 100));
    const graphContext = await getGraphContext(message, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    if (graphContext) {
      console.log("GraphRAG context retrieved:", graphContext.length, "chars");
    } else {
      console.log("No GraphRAG context available");
    }

    // Build comprehensive context summary
    let contextSummary = "";
    
    if (context) {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      contextSummary += `\n\n📅 Current: ${dayOfWeek}, ${time}`;

      // Projects with detailed info
      if (context.projects?.length > 0) {
        const activeProjects = context.projects.filter((p: any) => p.status === 'active');
        const wipCount = activeProjects.length;
        const wipWarning = wipCount > 2 ? " ⚠️ OVER WIP LIMIT!" : "";
        
        contextSummary += `\n\n📂 Active Projects (${wipCount}/2 WIP limit${wipWarning}):`;
        context.projects.slice(0, 8).forEach((p: any) => {
          const deadline = p.deadline ? new Date(p.deadline) : null;
          const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
          const urgency = daysLeft !== null && daysLeft <= 3 ? "🔴" : daysLeft !== null && daysLeft <= 7 ? "🟡" : "🟢";
          const deadlineStr = deadline ? `${daysLeft}d left ${urgency}` : "no deadline";
          contextSummary += `\n- ${p.title} [${p.domain}] P${p.priority} | ${p.progress}% | ${deadlineStr}`;
          if (p.description) contextSummary += ` | "${p.description.slice(0, 50)}..."`;
        });
      }

      // Income streams with ADHD ratings
      if (context.incomeStreams?.length > 0) {
        contextSummary += `\n\n💰 Income Streams (${context.incomeStreams.length}):`;
        context.incomeStreams.forEach((s: any) => {
          const flags = [];
          if (s.has_external_deadline) flags.push("📅deadline");
          if (s.body_double_possible) flags.push("👥bodydouble");
          if (s.adhd_compatibility === 'hyperfocus_gold') flags.push("⭐GOLD");
          if (s.adhd_compatibility === 'hell_no') flags.push("🚫DANGER");
          
          contextSummary += `\n- ${s.name}: ADHD=${s.adhd_compatibility}, Dopamine=${s.dopamine_level}`;
          contextSummary += `, Switch=${s.context_switch_minutes}min, €${s.realistic_monthly_eur || 0}/mo`;
          if (flags.length) contextSummary += ` [${flags.join(', ')}]`;
          if (s.status === 'paused' || s.status === 'abandoned') contextSummary += ` (${s.status.toUpperCase()})`;
        });
      }

      // Weekly capacity with ADHD tax
      if (context.weeklyCapacity) {
        const w = context.weeklyCapacity;
        const adhdTax = w.planned_hours > 0 ? Math.round((1 - w.actual_hours / w.planned_hours) * 100) : 0;
        const revenuePerHour = w.actual_hours > 0 && w.revenue_this_week ? Math.round(w.revenue_this_week / w.actual_hours) : 0;
        
        contextSummary += `\n\n📊 This Week's Capacity:`;
        contextSummary += `\n- Hours: ${w.actual_hours}/${w.planned_hours} (${adhdTax}% ADHD tax)`;
        if (w.revenue_this_week) contextSummary += `\n- Revenue: €${w.revenue_this_week} (€${revenuePerHour}/actual hour)`;
        if (w.what_worked) contextSummary += `\n- ✅ What worked: ${w.what_worked}`;
        if (w.what_failed) contextSummary += `\n- ❌ What failed: ${w.what_failed}`;
      }

      // Today's deep work
      if (context.todayMinutes !== undefined) {
        const hours = Math.floor(context.todayMinutes / 60);
        const mins = context.todayMinutes % 60;
        const deepWorkStatus = context.todayMinutes >= 90 ? "✅ solid" : context.todayMinutes >= 45 ? "🟡 okay" : "🔴 low";
        contextSummary += `\n\n⏱️ Today's Deep Work: ${hours}h ${mins}m ${deepWorkStatus}`;
      }

      // Recent deep work sessions
      if (context.recentSessions?.length > 0) {
        contextSummary += `\n\n🎯 Recent Sessions:`;
        context.recentSessions.slice(0, 5).forEach((s: any) => {
          const quality = s.focus_quality ? `(${s.focus_quality}/10 focus)` : "";
          contextSummary += `\n- ${s.projects?.title || 'No project'}: ${s.duration_minutes}min ${quality}`;
        });
      }
    }

    // Combine all context: GraphRAG + System State
    let fullContext = "";
    if (graphContext) {
      fullContext += `\n\n${graphContext}`;
    }
    if (contextSummary) {
      fullContext += `\n\n[CURRENT SYSTEM STATE]${contextSummary}`;
    }

    const userMessageWithContext = fullContext
      ? `${message}${fullContext}`
      : message;

    // Build messages array with conversation history
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add conversation history if provided (for context)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-6); // Last 6 messages for context
      recentHistory.forEach((msg: any) => {
        messages.push({ role: msg.role, content: msg.content });
      });
    }

    messages.push({ role: "user", content: userMessageWithContext });

    console.log("Sending message to AI gateway with GraphRAG + system context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Take a breath - try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Time to add more credits!" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create a new readable stream that prepends graph context metadata
    const graphMetadata = JSON.stringify({
      type: "graph_context",
      context: graphContext || null,
      entities_found: graphContext ? graphContext.split('\n').filter((l: string) => l.startsWith('- ')).length : 0,
    });

    const metadataLine = `data: ${graphMetadata}\n\n`;
    const encoder = new TextEncoder();

    const transformedStream = new ReadableStream({
      async start(controller) {
        // Send graph context metadata first
        controller.enqueue(encoder.encode(metadataLine));
        
        // Then pipe through the AI response
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("aurelia-chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
