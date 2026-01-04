import { useState, useCallback } from "react";

export type AgentType = "PLANNER" | "CRITIC" | "MEMORY" | "HEALTH" | "OPPORTUNITY" | "STUDY";

export interface AgentResponse {
  agent: AgentType;
  name: string;
  emoji: string;
  response: string;
}

export interface VetoResult {
  triggered: boolean;
  reason: string;
  message: string;
  severity: "critical" | "warning";
  allowOverride: boolean;
  recoveryActions: string[];
}

export interface CouncilResult {
  agentResponses: AgentResponse[];
  synthesis: string;
  timestamp: string;
  vetoActive?: boolean;
  veto?: VetoResult;
}

export interface AcademicContext {
  upcomingDeadlines: any[];
  thisWeekClasses: any[];
  activeCourses: number;
}

export interface CouncilContext {
  projects?: any[];
  incomeStreams?: any[];
  weeklyCapacity?: any;
  todayMinutes?: number;
  recentMood?: number;
  recentEnergy?: number;
  recentSessions?: any[];
  academicContext?: AcademicContext;
}

export const AGENT_INFO: Record<AgentType, { name: string; emoji: string; description: string; color: string }> = {
  PLANNER: {
    name: "Planner",
    emoji: "📋",
    description: "Creates actionable, time-boxed plans",
    color: "#3B82F6" // Blue
  },
  CRITIC: {
    name: "Critic",
    emoji: "🔍",
    description: "Identifies risks and guardrails",
    color: "#EF4444" // Red
  },
  MEMORY: {
    name: "Memory",
    emoji: "🧠",
    description: "Connects patterns from the past",
    color: "#8B5CF6" // Purple
  },
  HEALTH: {
    name: "Health",
    emoji: "💚",
    description: "Monitors wellbeing and sustainability",
    color: "#10B981" // Green
  },
  OPPORTUNITY: {
    name: "Opportunity",
    emoji: "🎯",
    description: "Spots growth opportunities",
    color: "#F59E0B" // Amber
  },
  STUDY: {
    name: "Study",
    emoji: "📚",
    description: "Optimizes learning and academic progress",
    color: "#EC4899" // Pink
  }
};

export function useAgentCouncil() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<"idle" | "agents" | "synthesis">("idle");
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([]);
  const [synthesis, setSynthesis] = useState<string>("");
  const [vetoResult, setVetoResult] = useState<VetoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const conveneCouncil = useCallback(
    async (
      message: string,
      context: CouncilContext,
      selectedAgents?: AgentType[],
      forceOverride?: boolean
    ): Promise<CouncilResult | null> => {
      setIsProcessing(true);
      setCurrentPhase("agents");
      setAgentResponses([]);
      setSynthesis("");
      setVetoResult(null);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agent-council`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              message,
              context,
              selectedAgents: selectedAgents || Object.keys(AGENT_INFO),
              forceOverride,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment.");
          }
          if (response.status === 402) {
            throw new Error("AI credits exhausted. Please add more credits.");
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Council deliberation failed");
        }

        const result = await response.json();

        // Handle VETO response
        if (result.vetoActive && result.veto) {
          setVetoResult(result.veto);
          setCurrentPhase("idle");
          setIsProcessing(false);
          return {
            agentResponses: [],
            synthesis: "",
            timestamp: result.timestamp,
            vetoActive: true,
            veto: result.veto,
          };
        }

        setAgentResponses(result.agentResponses || []);
        setCurrentPhase("synthesis");
        
        // Small delay for visual effect before showing synthesis
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setSynthesis(result.synthesis || "");
        setCurrentPhase("idle");

        return {
          agentResponses: result.agentResponses,
          synthesis: result.synthesis,
          timestamp: result.timestamp,
          vetoActive: false,
          veto: null,
        };
      } catch (err) {
        console.error("Agent Council error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        return null;
      } finally {
        setIsProcessing(false);
        setCurrentPhase("idle");
      }
    },
    []
  );

  const reset = useCallback(() => {
    setIsProcessing(false);
    setCurrentPhase("idle");
    setAgentResponses([]);
    setSynthesis("");
    setVetoResult(null);
    setError(null);
  }, []);

  return {
    conveneCouncil,
    reset,
    isProcessing,
    currentPhase,
    agentResponses,
    synthesis,
    vetoResult,
    error,
  };
}
