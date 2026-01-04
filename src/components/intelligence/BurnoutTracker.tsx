import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame,
  Shield,
  TrendingUp
} from "lucide-react";
import { 
  useBurnoutRiskScore, 
  useActiveBurnoutIndicators,
  useResolveBurnoutIndicator 
} from "@/hooks/useBurnoutIndicators";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

function getRiskColor(level: string): string {
  switch (level) {
    case "low": return "text-success";
    case "moderate": return "text-warning";
    case "elevated": return "text-orange-500";
    case "critical": return "text-destructive";
    default: return "text-muted-foreground";
  }
}

function getRiskBgColor(level: string): string {
  switch (level) {
    case "low": return "bg-success/10";
    case "moderate": return "bg-warning/10";
    case "elevated": return "bg-orange-500/10";
    case "critical": return "bg-destructive/10";
    default: return "bg-muted";
  }
}

function getSeverityLabel(severity: number): string {
  switch (severity) {
    case 1: return "Minor";
    case 2: return "Moderate";
    case 3: return "Significant";
    case 4: return "Severe";
    case 5: return "Critical";
    default: return "Unknown";
  }
}

function getSeverityColor(severity: number): string {
  if (severity <= 2) return "text-warning";
  if (severity <= 3) return "text-orange-500";
  return "text-destructive";
}

export function BurnoutTracker() {
  const { data: riskScore, isLoading: loadingRisk } = useBurnoutRiskScore();
  const { data: indicators = [], isLoading: loadingIndicators } = useActiveBurnoutIndicators();
  const resolveIndicator = useResolveBurnoutIndicator();

  if (loadingRisk || loadingIndicators) {
    return (
      <Card className="gradient-card animate-pulse">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Burnout Trajectory</CardTitle>
        </CardHeader>
        <CardContent className="h-32" />
      </Card>
    );
  }

  const score = riskScore?.score ?? 0;
  const level = riskScore?.level ?? "low";

  return (
    <Card className={cn("gradient-border", level === "critical" && "border-destructive/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-4 w-4 text-destructive" />
            Burnout Trajectory
          </CardTitle>
          <Badge 
            variant="outline" 
            className={cn("text-xs uppercase", getRiskColor(level))}
          >
            {level} Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk Score</span>
            <span className={cn("text-2xl font-bold", getRiskColor(level))}>
              {score}%
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={score} 
              className={cn("h-3", getRiskBgColor(level))}
            />
            <div className="absolute inset-0 flex">
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4 border-r border-background/50" />
              <div className="w-1/4" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Low</span>
            <span>Moderate</span>
            <span>Elevated</span>
            <span>Critical</span>
          </div>
        </div>

        {/* Active Indicators */}
        {indicators.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Active Warning Signs ({indicators.length})
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {indicators.map((indicator) => (
                <div 
                  key={indicator.id}
                  className="flex items-start justify-between p-2 rounded-lg bg-muted/50 text-sm"
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <AlertTriangle className={cn(
                      "h-4 w-4 mt-0.5 flex-shrink-0",
                      getSeverityColor(indicator.severity)
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {indicator.indicator_type.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {indicator.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {getSeverityLabel(indicator.severity)} • {format(new Date(indicator.detected_at), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 ml-2 flex-shrink-0"
                    onClick={() => resolveIndicator.mutate(indicator.id)}
                    disabled={resolveIndicator.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10">
            <Shield className="h-5 w-5 text-success" />
            <div>
              <p className="font-medium text-success text-sm">All Clear</p>
              <p className="text-xs text-muted-foreground">
                No active burnout indicators detected
              </p>
            </div>
          </div>
        )}

        {/* Data Source Info */}
        <p className="text-[10px] text-muted-foreground text-center">
          Based on {riskScore?.indicatorCount || 0} indicators + {riskScore?.moodDataPoints || 0} mood logs
        </p>
      </CardContent>
    </Card>
  );
}
