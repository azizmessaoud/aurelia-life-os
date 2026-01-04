import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Brain, 
  Dumbbell, 
  Sparkles, 
  Flame,
  Plus,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useLatestHealthScore, useHealthAverages } from "@/hooks/useHealthScores";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const dimensions = [
  { key: "emotional", label: "Emotional", icon: Heart, color: "text-chart-1" },
  { key: "mental", label: "Mental", icon: Brain, color: "text-chart-2" },
  { key: "physical", label: "Physical", icon: Dumbbell, color: "text-chart-3" },
  { key: "spiritual", label: "Spiritual", icon: Sparkles, color: "text-chart-4" },
  { key: "hormonal", label: "Hormonal", icon: Flame, color: "text-chart-5" },
] as const;

function getScoreColor(score: number): string {
  if (score <= 3) return "text-destructive";
  if (score <= 5) return "text-warning";
  if (score <= 7) return "text-muted-foreground";
  return "text-success";
}

function getOverallLabel(score: number): string {
  if (score <= 3) return "Critical";
  if (score <= 5) return "Needs Attention";
  if (score <= 7) return "Balanced";
  return "Thriving";
}

interface HealthScoreCardProps {
  onLogHealth?: () => void;
}

export function HealthScoreCard({ onLogHealth }: HealthScoreCardProps) {
  const { data: latestScore, isLoading } = useLatestHealthScore();
  const { data: averages } = useHealthAverages(7);

  if (isLoading) {
    return (
      <Card className="gradient-card animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">5D Health Score</CardTitle>
        </CardHeader>
        <CardContent className="h-48" />
      </Card>
    );
  }

  if (!latestScore) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-semibold mb-1">No Health Data Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Log your first 5D health check to start tracking holistic wellness
          </p>
          {onLogHealth && (
            <Button onClick={onLogHealth} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Log Health Score
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const trend = averages && latestScore.overall > averages.overall 
    ? "up" 
    : averages && latestScore.overall < averages.overall 
    ? "down" 
    : null;

  return (
    <Card className="gradient-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" />
            5D Health Score
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("text-xs", getScoreColor(latestScore.overall))}
          >
            {getOverallLabel(latestScore.overall)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 text-center">
            <div className={cn(
              "text-4xl font-bold",
              getScoreColor(latestScore.overall)
            )}>
              {latestScore.overall}
            </div>
            <div className="text-xs text-muted-foreground">/10</div>
          </div>
          <div className="flex-1 space-y-1">
            <Progress 
              value={latestScore.overall * 10} 
              className="h-3"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Logged {format(new Date(latestScore.calculated_at), "MMM d, h:mm a")}
              </span>
              {trend && (
                <span className={cn(
                  "flex items-center gap-1",
                  trend === "up" ? "text-success" : "text-destructive"
                )}>
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  vs avg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Individual Dimensions */}
        <div className="grid grid-cols-5 gap-2">
          {dimensions.map(({ key, label, icon: Icon, color }) => {
            const value = latestScore[key as keyof typeof latestScore] as number;
            return (
              <div key={key} className="text-center">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full mx-auto mb-1",
                  "bg-muted/50"
                )}>
                  <Icon className={cn("h-4 w-4", color)} />
                </div>
                <div className={cn(
                  "text-lg font-semibold",
                  getScoreColor(value)
                )}>
                  {value}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        {latestScore.notes && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
            "{latestScore.notes}"
          </p>
        )}

        {/* Action */}
        {onLogHealth && (
          <Button 
            onClick={onLogHealth} 
            variant="outline" 
            size="sm" 
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Update Health Score
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
