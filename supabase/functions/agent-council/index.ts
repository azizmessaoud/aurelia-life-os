import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// VETO Thresholds - Critical limits that trigger intervention
const VETO_THRESHOLDS = {
  CRITICAL_ENERGY: 3,           // Energy below 3/10 triggers critical VETO
  EXAM_WARNING_DAYS: 3,         // Exam within 3 days triggers VETO
  WIP_LIMIT: 2,                 // Max 2 active projects
  OVERWORK_DAILY_HOURS: 6,      // Max 6 hours/day average
};

interface VetoResult {
  triggered: boolean;
  reason: string;
  message: string;
  severity: "critical" | "warning";
  allowOverride: boolean;
  recoveryActions: string[];
}

// Helper to calculate days until a date
function daysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Check VETO rules before agent deliberation
function checkVetoRules(context: any, userMessage: string): VetoResult | null {
  const results: VetoResult[] = [];

  // 1. Critical Energy Check
  if (context.recentEnergy && context.recentEnergy < VETO_THRESHOLDS.CRITICAL_ENERGY) {
    results.push({
      triggered: true,
      reason: "CRITICAL_ENERGY",
      message: `Your energy is at ${context.recentEnergy}/10 — critically low. Recovery is required before any new commitments.`,
      severity: "critical",
      allowOverride: false,
      recoveryActions: [
        "Log a recovery day in your calendar",
        "Get at least 8 hours of sleep tonight",
        "Postpone non-essential decisions by 24 hours",
        "Do one small thing that brings you joy"
      ]
    });
  }

  // 2. Imminent Exam Check
  const upcomingDeadlines = context.academicContext?.upcomingDeadlines || [];
  const imminentExams = upcomingDeadlines.filter(
    (d: any) => d.is_exam && daysUntil(d.due_date) <= VETO_THRESHOLDS.EXAM_WARNING_DAYS
  );
  
  if (imminentExams.length > 0) {
    const exam = imminentExams[0];
    const days = daysUntil(exam.due_date);
    results.push({
      triggered: true,
      reason: "EXAM_IMMINENT",
      message: `${exam.title} is in ${days} day${days !== 1 ? 's' : ''}. Study-only mode activated.`,
      severity: "critical",
      allowOverride: false,
      recoveryActions: [
        `Focus all available time on ${exam.title} preparation`,
        "Postpone all project work until after the exam",
        "Use Pomodoro technique for focused study sessions",
        "Review course materials and practice problems"
      ]
    });
  }

  // 3. WIP Limit Check (only for new project requests)
  const activeProjects = context.projects?.filter((p: any) => p.status === 'active') || [];
  if (activeProjects.length >= VETO_THRESHOLDS.WIP_LIMIT) {
    const isNewProjectRequest = /start|new|begin|launch|create.*project|add.*project/i.test(userMessage);
    if (isNewProjectRequest) {
      results.push({
        triggered: true,
        reason: "WIP_LIMIT_REACHED",
        message: `WIP limit reached (${activeProjects.length}/${VETO_THRESHOLDS.WIP_LIMIT} active projects). Archive or complete one before starting another.`,
        severity: "warning",
        allowOverride: true,
        recoveryActions: [
          "Review current projects and identify one to archive",
          "Complete the project closest to done",
          "Defer new project idea to your backlog",
          "Consider if this urgency is real or ADHD-driven"
        ]
      });
    }
  }

  // 4. Overwork Check
  if (context.weeklyCapacity?.actual_hours) {
    const avgDailyHours = context.weeklyCapacity.actual_hours / 7;
    if (avgDailyHours > VETO_THRESHOLDS.OVERWORK_DAILY_HOURS) {
      results.push({
        triggered: true,
        reason: "OVERWORK_DETECTED",
        message: `Averaging ${avgDailyHours.toFixed(1)} hours/day this week (limit: ${VETO_THRESHOLDS.OVERWORK_DAILY_HOURS}h). Reduce load to prevent burnout.`,
        severity: "warning",
        allowOverride: true,
        recoveryActions: [
          "Cancel or postpone one commitment today",
          "Schedule a half-day off this week",
          "Set a hard stop time for work today",
          "Identify what's driving the overwork"
        ]
      });
    }
  }

  // Return the highest severity VETO (critical > warning)
  const criticalVeto = results.find(r => r.severity === "critical");
  if (criticalVeto) return criticalVeto;
  
  const warningVeto = results.find(r => r.severity === "warning");
  if (warningVeto) return warningVeto;

  return null;
}

// Agent definitions with specialized roles
const AGENTS = {
  PLANNER: {
    name: "Planner",
    emoji: "📋",
    systemPrompt: `You are the PLANNER agent in an ADHD-aware life coaching council. Your role is to:
- Create actionable, time-boxed plans
- Break down overwhelming tasks into 15-25 minute chunks
- Suggest the optimal order of tasks based on energy patterns
- Propose MIT (Most Important Tasks) for the day
- Consider context-switching costs

Respond with a concise analysis (2-3 sentences) and 1-2 specific recommendations.
Format: Start with your key insight, then actionable steps.`
  },
  CRITIC: {
    name: "Critic",
    emoji: "🔍",
    systemPrompt: `You are the CRITIC agent in an ADHD-aware life coaching council. Your role is to:
- Identify potential obstacles and risks in plans
- Spot over-commitment and unrealistic expectations
- Flag perfectionism traps and analysis paralysis risks
- Challenge assumptions that might lead to burnout
- Check WIP limits and cognitive load

Respond with a concise analysis (2-3 sentences) highlighting concerns and guardrails.
Format: Start with the main risk/concern, then protective recommendations.`
  },
  MEMORY: {
    name: "Memory",
    emoji: "🧠",
    systemPrompt: `You are the MEMORY agent in an ADHD-aware life coaching council. Your role is to:
- Recall relevant past patterns and what worked before
- Connect current situation to historical data
- Identify recurring blockers or triggers
- Reference past successes as motivation
- Track progress over time

Respond with a concise analysis (2-3 sentences) connecting past to present.
Format: Start with relevant historical pattern, then how it applies now.`
  },
  HEALTH: {
    name: "Health",
    emoji: "💚",
    systemPrompt: `You are the HEALTH agent in an ADHD-aware life coaching council. Your role is to:
- Monitor energy levels and burnout indicators
- Suggest recovery and self-care when needed
- Balance productivity with sustainability
- Watch for ADHD-specific health patterns (hyperfocus crashes, sleep)
- Advocate for breaks and physical wellness

Respond with a concise analysis (2-3 sentences) on wellbeing.
Format: Start with health observation, then sustainable recommendations.`
  },
  OPPORTUNITY: {
    name: "Opportunity",
    emoji: "🎯",
    systemPrompt: `You are the OPPORTUNITY agent in an ADHD-aware life coaching council. Your role is to:
- Identify growth opportunities and quick wins
- Spot dopamine-friendly tasks that can build momentum
- Suggest strategic pivots when current approach isn't working
- Find synergies between projects and goals
- Recommend high-impact, low-effort actions

Respond with a concise analysis (2-3 sentences) on opportunities.
Format: Start with the opportunity, then how to capture it.`
  },
  STUDY: {
    name: "Study",
    emoji: "📚",
    systemPrompt: `You are the STUDY agent in an ADHD-aware life coaching council. Your role is to:
- Optimize learning sessions for ADHD brains (spaced repetition, active recall)
- Track academic progress and upcoming deadlines
- Suggest study techniques: Feynman, Pomodoro, active recall
- Flag exam deadlines and suggest study sprints
- Balance deep conceptual learning vs practical application
- Connect coursework to real-world projects

Context: User is a 4th-year Data Science student.

Respond with a concise analysis (2-3 sentences) on academic/learning strategy.
Format: Start with academic priority, then actionable study recommendations.`
  }
};

// Orchestrator that synthesizes agent responses
const ORCHESTRATOR_PROMPT = `You are the ORCHESTRATOR of an ADHD-aware AI life coaching council. 
You've just received perspectives from 6 specialized agents:
- PLANNER: Creates actionable plans
- CRITIC: Identifies risks and guardrails
- MEMORY: Connects patterns from the past
- HEALTH: Monitors wellbeing and sustainability
- OPPORTUNITY: Spots growth opportunities
- STUDY: Optimizes academic learning and deadlines

Your job is to SYNTHESIZE their insights into a cohesive, actionable recommendation for the user.

Guidelines:
- Weigh all perspectives, but prioritize Health if burnout risk is high
- Give extra weight to STUDY agent when academic deadlines are imminent
- Create a balanced response that acknowledges tradeoffs
- Be direct and conversational, not clinical
- Include 1-3 concrete next steps
- If agents disagree, acknowledge the tension and recommend a balanced path
- Keep the final synthesis to 3-5 sentences max, followed by action items

Format your response as:
**Council Recommendation:**
[2-3 sentence synthesis of key insights]

**Action Items:**
1. [Most important action]
2. [Second action if applicable]
3. [Third action if applicable]`;

async function callAgent(
  agentKey: string,
  agent: typeof AGENTS[keyof typeof AGENTS],
  userMessage: string,
  context: any,
  apiKey: string
): Promise<{ agent: string; name: string; emoji: string; response: string }> {
  const academicContext = context.academicContext ? `
ACADEMIC CONTEXT:
- Upcoming deadlines: ${context.academicContext.upcomingDeadlines?.length || 0} assignments due soon
- Classes this week: ${context.academicContext.thisWeekClasses?.length || 0} scheduled sessions
- Active courses: ${context.academicContext.activeCourses || 0}
${context.academicContext.upcomingDeadlines?.slice(0, 3).map((d: any) => `  • ${d.title} (due ${d.due_date})`).join('\n') || ''}
` : '';

  const contextSummary = `
Current context:
- Projects: ${context.projects?.length || 0} active
- Income streams: ${context.incomeStreams?.length || 0}
- Today's deep work: ${context.todayMinutes || 0} minutes
- This week: ${context.weeklyCapacity?.actual_hours || 0}/${context.weeklyCapacity?.planned_hours || 0} hours
${context.recentMood ? `- Recent mood: ${context.recentMood}/10` : ''}
${context.recentEnergy ? `- Recent energy: ${context.recentEnergy}/10` : ''}
${academicContext}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: agent.systemPrompt + contextSummary },
        { role: "user", content: userMessage }
      ],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    console.error(`Agent ${agentKey} failed:`, response.status);
    return {
      agent: agentKey,
      name: agent.name,
      emoji: agent.emoji,
      response: "Unable to contribute at this time."
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "No response generated.";

  return {
    agent: agentKey,
    name: agent.name,
    emoji: agent.emoji,
    response: content.trim()
  };
}

async function synthesizeResponses(
  userMessage: string,
  agentResponses: any[],
  apiKey: string
): Promise<string> {
  const agentSummary = agentResponses.map(r => 
    `**${r.emoji} ${r.name}:** ${r.response}`
  ).join("\n\n");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: ORCHESTRATOR_PROMPT },
        { 
          role: "user", 
          content: `User's question: "${userMessage}"

Agent perspectives:
${agentSummary}

Please synthesize these into a cohesive recommendation.`
        }
      ],
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error("Orchestrator synthesis failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Unable to synthesize recommendations.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context, selectedAgents, forceOverride } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    console.log("Agent Council convened for:", message.substring(0, 50));

    // Check VETO rules FIRST (before calling any agents)
    const vetoResult = checkVetoRules(context || {}, message);
    
    if (vetoResult && vetoResult.triggered && !forceOverride) {
      console.log("VETO triggered:", vetoResult.reason, "- Severity:", vetoResult.severity);
      
      return new Response(
        JSON.stringify({
          success: true,
          vetoActive: true,
          veto: vetoResult,
          agentResponses: [],
          synthesis: null,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (forceOverride && vetoResult) {
      console.log("VETO override requested for:", vetoResult.reason);
    }

    // Determine which agents to use (default: all)
    const agentsToUse = selectedAgents?.length > 0 
      ? selectedAgents 
      : Object.keys(AGENTS);

    // Phase 1: Call all agents in parallel
    const agentPromises = agentsToUse.map((agentKey: string) => {
      const agent = AGENTS[agentKey as keyof typeof AGENTS];
      if (!agent) return null;
      return callAgent(agentKey, agent, message, context || {}, LOVABLE_API_KEY);
    }).filter(Boolean);

    const agentResponses = await Promise.all(agentPromises);
    
    console.log("All agents responded, synthesizing...");

    // Phase 2: Orchestrator synthesizes responses
    const synthesis = await synthesizeResponses(message, agentResponses, LOVABLE_API_KEY);

    console.log("Council deliberation complete");

    return new Response(
      JSON.stringify({
        success: true,
        vetoActive: false,
        veto: null,
        agentResponses,
        synthesis,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Agent Council error:", err);
    
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    if (errorMessage.includes("429")) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (errorMessage.includes("402")) {
      return new Response(
        JSON.stringify({ error: "Payment required. Please add credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: errorMessage || "Council deliberation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
