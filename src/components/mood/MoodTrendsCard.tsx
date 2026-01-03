import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAverageEnergy, useLatestMoodLog, useMoodTrends } from "@/hooks/useMoodLogs";
import { Battery, TrendingUp, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip 
} from "recharts";

function getEnergyColor(value: number): string {
  if (value <= 4) return "text-destructive";
  if (value >= 7) return "text-success";
  return "text-warning";
}

function getEnergyBgColor(value: number): string {
  if (value <= 4) return "bg-destructive/10";
  if (value >= 7) return "bg-success/10";
  return "bg-warning/10";
}

export function MoodTrendsCard() {
  const { data: avgEnergy } = useAverageEnergy(7);
  const { data: latestLog } = useLatestMoodLog();
  const { data: trends } = useMoodTrends(7);

  // Format data for chart
  const chartData = trends?.map((day) => ({
    name: new Date(day.date).toLocaleDateString("en-US", { weekday: "short" }),
    energy: day.energy,
    mood: day.mood,
    stress: day.stress,
  })) || [];

  const hasData = chartData.length > 0;

  return (
    <Card className="gradient-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-success" />
            Energy Trends
          </div>
          {avgEnergy !== null && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", getEnergyColor(avgEnergy))}
            >
              {avgEnergy}/10 avg
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Latest Log Summary */}
        {latestLog && (
          <div className={cn(
            "flex items-center justify-between p-2 rounded-lg",
            getEnergyBgColor(latestLog.energy_level)
          )}>
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-2 w-2 rounded-full",
                latestLog.energy_level <= 4 ? "bg-destructive" :
                latestLog.energy_level >= 7 ? "bg-success" : "bg-warning"
              )} />
              <span className="text-sm font-medium">
                Energy: {latestLog.energy_level} | Mood: {latestLog.mood} | Stress: {latestLog.stress}
              </span>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(latestLog.logged_at), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Mini Trend Chart */}
        {hasData ? (
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[0, 10]} 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ 
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                    fontSize: "12px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="energy" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Energy"
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Mood"
                />
                <Line 
                  type="monotone" 
                  dataKey="stress" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Stress"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 opacity-50" />
              Log moods to see trends
            </div>
          </div>
        )}

        {/* Legend */}
        {hasData && (
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-success" />
              Energy
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Mood
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              Stress
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
