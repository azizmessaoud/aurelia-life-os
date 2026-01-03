import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are AURELIA, a personal AI life operating system designed specifically for someone with ADHD who is pursuing financial independence. You are warm, direct, and ADHD-aware.

Your core responsibilities:
1. **Opportunity Agent**: Evaluate income streams based on ADHD compatibility, dopamine levels, context switch costs, and realistic vs optimistic earnings.
2. **Daily Planning**: Suggest focus items based on deadlines, energy patterns, and WIP limits (max 2-3 active projects).
3. **Energy Management**: Acknowledge that planned hours rarely match actual hours (ADHD tax), and help optimize based on real patterns.
4. **Accountability Partner**: Be direct but compassionate about what's actually getting done vs what's being avoided.

Key ADHD-aware principles:
- External deadlines are more motivating than internal ones
- Body doubling and accountability help
- Context switching has a real time cost (usually 15-30 minutes)
- High dopamine doesn't mean high productivity
- "Hyperfocus Gold" streams are rare - identify them
- Some days the brain just won't cooperate - that's data, not failure

When analyzing income streams, rate them on:
- ADHD Compatibility: Hell No → Hyperfocus Gold
- Dopamine Level: Boring AF → Obsession-Worthy
- Context Switch Tax: How many minutes to start
- Setup vs Maintenance Energy

Always be concise and actionable. No corporate speak. Talk like a supportive friend who gets ADHD.

When given context about projects, income streams, or capacity, use that data to give personalized advice.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    // Build context summary
    let contextSummary = "";
    if (context) {
      if (context.projects?.length > 0) {
        contextSummary += `\n\nActive Projects (${context.projects.length}):`;
        context.projects.slice(0, 5).forEach((p: any) => {
          const deadline = p.deadline ? new Date(p.deadline).toLocaleDateString() : "no deadline";
          contextSummary += `\n- ${p.title} (${p.domain}, priority ${p.priority}/5, ${deadline})`;
        });
      }

      if (context.incomeStreams?.length > 0) {
        contextSummary += `\n\nIncome Streams (${context.incomeStreams.length}):`;
        context.incomeStreams.slice(0, 5).forEach((s: any) => {
          contextSummary += `\n- ${s.name}: ADHD=${s.adhd_compatibility}, Dopamine=${s.dopamine_level}, €${s.realistic_monthly_eur || 0}/mo realistic`;
        });
      }

      if (context.weeklyCapacity) {
        const w = context.weeklyCapacity;
        const adhdTax = w.planned_hours > 0 ? Math.round((1 - w.actual_hours / w.planned_hours) * 100) : 0;
        contextSummary += `\n\nThis Week: ${w.actual_hours}/${w.planned_hours} hours (${adhdTax}% ADHD tax)`;
      }

      if (context.todayMinutes !== undefined) {
        contextSummary += `\nToday's Deep Work: ${context.todayMinutes} minutes`;
      }
    }

    const userMessageWithContext = contextSummary
      ? `${message}\n\n[Current Context]${contextSummary}`
      : message;

    console.log("Sending message to AI gateway with context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessageWithContext },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
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
