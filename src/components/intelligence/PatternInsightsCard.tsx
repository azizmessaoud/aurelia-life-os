import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Zap,
  AlertTriangle,
  Heart,
  Brain,
  RefreshCw
} from "lucide-react";
import { useActivePatternInsights, useMarkInsightActedUpon } from "@/hooks/usePatternInsights";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const patternIcons: Record<string, any> = {
  energy_decline: TrendingDown,
  sustained_stress: AlertTriangle,
  low_mood_energy: Heart,
  deep_work_gap: Brain,
  deep_work_strength: TrendingUp,
  exercise_mood_boost: Zap,
  negative_trigger: AlertTriangle,
  positive_trigger: Zap,
  health_imbalance: Heart,
};

const patternColors: Record<string, string> = {
  energy_decline: "text-orange-500",
  sustained_stress: "text-destructive",
  low_mood_energy: "text-destructive",
  deep_work_gap: "text-warning",
  deep_work_strength: "text-success",
  exercise_mood_boost: "text-success",
  negative_trigger: "text-orange-500",
  positive_trigger: "text-success",
  health_imbalance: "text-warning",
};

interface PatternInsightsCardProps {
  limit?: number;
}

export function PatternInsightsCard({ limit = 5 }: PatternInsightsCardProps) {
  const { data: insights = [], isLoading, refetch } = useActivePatternInsights();
  const markActedUpon = useMarkInsightActedUpon();
  const [isRunning, setIsRunning] = useState(false);

  const runPatternDetection = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("detect-patterns");
      if (error) throw error;
      
      toast.success(`Detected ${data.patterns_detected} patterns`, {
        description: data.burnout_indicators_created > 0 
          ? `${data.burnout_indicators_created} burnout indicators added`
          : undefined,
      });
      refetch();
    } catch (err: any) {
      toast.error("Pattern detection failed", {
        description: err.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const displayedInsights = insights.slice(0, limit);
  const hasMore = insights.length > limit;

  if (isLoading) {
    return (
      <Card className="gradient-card animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pattern Insights</CardTitle>
        </CardHeader>
        <CardContent className="h-48" />
      </Card>
    );
  }

  return (
    <Card className="gradient-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            Pattern Insights
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            onClick={runPatternDetection}
            disabled={isRunning}
          >
            <RefreshCw className={cn("h-4 w-4", isRunning && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayedInsights.length > 0 ? (
          <>
            {displayedInsights.map((insight) => {
              const Icon = patternIcons[insight.pattern_type] || Lightbulb;
              const color = patternColors[insight.pattern_type] || "text-primary";
              
              return (
                <div 
                  key={insight.id}
                  className="p-3 rounded-lg bg-muted/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", color)} />
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{insight.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-[10px] flex-shrink-0"
                    >
                      {Math.round(insight.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  {insight.is_actionable && (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => markActedUpon.mutate(insight.id)}
                        disabled={markActedUpon.isPending}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Mark Addressed
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {hasMore && (
              <p className="text-xs text-center text-muted-foreground">
                +{insights.length - limit} more insights
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              No active pattern insights
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={runPatternDetection}
              disabled={isRunning}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isRunning && "animate-spin")} />
              Run Pattern Detection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
