import { Goal, GOAL_AREAS, GPS_STATUSES } from "@/hooks/useGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface GoalCardProps {
  goal: Goal;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

export function GoalCard({ goal, onEdit, onDelete, onClick, showActions = true }: GoalCardProps) {
  const area = GOAL_AREAS.find((a) => a.value === goal.area);
  const status = GPS_STATUSES.find((s) => s.value === goal.gps_status);
  const progress = goal.target_value && goal.current_value
    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    : 0;

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md group",
        onClick && "cursor-pointer hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{area?.emoji || "🎯"}</span>
            <div>
              <CardTitle className="text-base font-semibold line-clamp-1">
                {goal.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {goal.timeframe}
                </Badge>
                {status && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${status.color}20`,
                      color: status.color,
                      borderColor: status.color
                    }}
                  >
                    {status.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-3">
        {goal.metric_name && goal.target_value && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{goal.metric_name}</span>
              <span className="font-medium">
                {goal.current_value || 0} / {goal.target_value}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {goal.why_driver && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            <span className="font-medium">Why: </span>{goal.why_driver}
          </p>
        )}
        
        {goal.deadline && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}</span>
            {onClick && <ChevronRight className="h-4 w-4" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
