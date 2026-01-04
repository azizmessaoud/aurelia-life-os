import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  useAgentCouncil, 
  AGENT_INFO, 
  AgentType, 
  AgentResponse,
  CouncilContext 
} from "@/hooks/useAgentCouncil";
import { 
  Send, 
  Users, 
  Loader2, 
  Sparkles, 
  RotateCcw,
  ClipboardList,
  Search,
  Brain,
  Heart,
  Target,
  GraduationCap
} from "lucide-react";
import { cn } from "@/lib/utils";

const AGENT_ICONS: Record<AgentType, React.ElementType> = {
  PLANNER: ClipboardList,
  CRITIC: Search,
  MEMORY: Brain,
  HEALTH: Heart,
  OPPORTUNITY: Target,
  STUDY: GraduationCap,
};

interface AgentCardProps {
  agent: AgentResponse;
  isLoading?: boolean;
}

function AgentCard({ agent, isLoading }: AgentCardProps) {
  const info = AGENT_INFO[agent.agent];
  const Icon = AGENT_ICONS[agent.agent];

  return (
    <Card 
      className="transition-all duration-300 hover:shadow-md"
      style={{ borderLeftColor: info.color, borderLeftWidth: 3 }}
    >
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center gap-2">
          <div 
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${info.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: info.color }} />
          </div>
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {agent.emoji} {agent.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{agent.response}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface AgentCouncilViewProps {
  context: CouncilContext;
  className?: string;
}

export function AgentCouncilView({ context, className }: AgentCouncilViewProps) {
  const {
    conveneCouncil,
    reset,
    isProcessing,
    currentPhase,
    agentResponses,
    synthesis,
    error,
  } = useAgentCouncil();

  const [input, setInput] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>(
    Object.keys(AGENT_INFO) as AgentType[]
  );

  const toggleAgent = (agent: AgentType) => {
    setSelectedAgents(prev =>
      prev.includes(agent)
        ? prev.filter(a => a !== agent)
        : [...prev, agent]
    );
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing || selectedAgents.length === 0) return;
    await conveneCouncil(input.trim(), context, selectedAgents);
  };

  const handleReset = () => {
    reset();
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Users className="h-7 w-7 text-primary" />
            Agent Council
          </h2>
          <p className="text-muted-foreground text-sm">
            Multi-agent reasoning for complex decisions
          </p>
        </div>
        {(agentResponses.length > 0 || synthesis) && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            New Question
          </Button>
        )}
      </div>

      {/* Agent Selection */}
      {!isProcessing && agentResponses.length === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Select Agents</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {(Object.keys(AGENT_INFO) as AgentType[]).map((agent) => {
                const info = AGENT_INFO[agent];
                const isSelected = selectedAgents.includes(agent);
                return (
                  <label
                    key={agent}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleAgent(agent)}
                    />
                    <span className="text-lg">{info.emoji}</span>
                    <span className="text-sm font-medium">{info.name}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input */}
      {!isProcessing && agentResponses.length === 0 && (
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a complex question that benefits from multiple perspectives..."
            className="min-h-[100px] pr-14"
          />
          <Button
            size="icon"
            className="absolute right-3 bottom-3"
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing || selectedAgents.length === 0}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && currentPhase === "agents" && (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Council is deliberating...</p>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedAgents.length} agents analyzing your question
          </p>
        </div>
      )}

      {/* Agent Responses Grid */}
      {agentResponses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Agent Perspectives
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentResponses.map((agent) => (
              <AgentCard key={agent.agent} agent={agent} />
            ))}
          </div>
        </div>
      )}

      {/* Synthesis */}
      {(synthesis || currentPhase === "synthesis") && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              Council Synthesis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPhase === "synthesis" && !synthesis ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {synthesis.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return (
                      <h4 key={i} className="font-semibold mt-3 mb-1 text-foreground">
                        {line.replace(/\*\*/g, '')}
                      </h4>
                    );
                  }
                  if (line.match(/^\d+\./)) {
                    return (
                      <p key={i} className="my-1 pl-4 text-foreground">
                        {line}
                      </p>
                    );
                  }
                  if (line.trim()) {
                    return <p key={i} className="my-2 text-foreground">{line}</p>;
                  }
                  return null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-4">
            <p className="text-destructive text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset} 
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Context Summary */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">📂 {context.projects?.length || 0} projects</Badge>
        <Badge variant="outline">💰 {context.incomeStreams?.length || 0} streams</Badge>
        <Badge variant="outline">⏱️ {context.todayMinutes || 0}m today</Badge>
        {context.weeklyCapacity && (
          <Badge variant="outline">
            📊 {context.weeklyCapacity.actual_hours}/{context.weeklyCapacity.planned_hours}h week
          </Badge>
        )}
        {context.academicContext && (
          <Badge variant="outline">
            📚 {context.academicContext.upcomingDeadlines?.length || 0} deadlines
          </Badge>
        )}
      </div>
    </div>
  );
}
