import { AppLayout } from "@/components/layout/AppLayout";
import { useGoals, GOAL_AREAS, GPS_STATUSES } from "@/hooks/useGoals";
import { useWeeklyStats, useTodaysLog, useWeekLogs } from "@/hooks/useDailyLogs";
import { useActiveProjects } from "@/hooks/useProjects";
import { DailyLogWidget } from "@/components/goals/DailyLogWidget";
import { GoalCard } from "@/components/goals/GoalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Compass, 
  Target, 
  TrendingUp, 
  Code2, 
  Dumbbell, 
  DollarSign,
  CheckSquare,
  Timer,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, startOfWeek, addDays } from "date-fns";

export default function GPSCommandCenter() {
  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const { data: projects = [] } = useActiveProjects();
  const { data: weekLogs = [] } = useWeekLogs();
  const weeklyStats = useWeeklyStats();

  // GPS Status breakdown
  const statusCounts = GPS_STATUSES.reduce((acc, status) => {
    acc[status.value] = goals.filter(g => g.gps_status === status.value).length;
    return acc;
  }, {} as Record<string, number>);

  // Top priority goals
  const topGoals = goals
    .filter(g => g.gps_status !== "not_defined")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);

  // Calculate overall goal progress
  const goalsWithMetrics = goals.filter(g => g.target_value && g.target_value > 0);
  const overallProgress = goalsWithMetrics.length > 0
    ? Math.round(
        goalsWithMetrics.reduce((sum, g) => {
          const progress = ((g.current_value || 0) / (g.target_value || 1)) * 100;
          return sum + Math.min(100, progress);
        }, 0) / goalsWithMetrics.length
      )
    : 0;

  // Week days for mini-calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    const dateStr = format(date, "yyyy-MM-dd");
    const log = weekLogs.find(l => l.log_date === dateStr);
    return {
      date,
      dateStr,
      dayName: format(date, "EEE"),
      dayNum: format(date, "d"),
      isToday: dateStr === format(new Date(), "yyyy-MM-dd"),
      hasLog: !!log,
      log,
    };
  });

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Compass className="h-7 w-7 text-primary" />
              Life GPS Command Center
            </h1>
            <p className="text-muted-foreground text-sm">
              Goals → Plans → Systems
            </p>
          </div>
          <Link to="/goals">
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Manage Goals
            </Button>
          </Link>
        </div>

        {/* GPS Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {GPS_STATUSES.map((status) => (
            <Card key={status.value} className="relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 w-1 h-full"
                style={{ backgroundColor: status.color }}
              />
              <CardContent className="pt-4 pb-3 pl-5">
                <p className="text-2xl font-bold">{statusCounts[status.value]}</p>
                <p className="text-xs text-muted-foreground">{status.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Daily Log + Week View */}
          <div className="lg:col-span-1 space-y-4">
            <DailyLogWidget />

            {/* Week At A Glance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Week At A Glance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <div 
                      key={day.dateStr}
                      className={`text-center p-1.5 rounded-lg transition-colors ${
                        day.isToday 
                          ? "bg-primary/10 border border-primary/30" 
                          : day.hasLog 
                            ? "bg-muted" 
                            : "bg-muted/30"
                      }`}
                    >
                      <p className="text-[10px] text-muted-foreground">{day.dayName}</p>
                      <p className={`text-sm font-medium ${day.isToday ? "text-primary" : ""}`}>
                        {day.dayNum}
                      </p>
                      {day.hasLog && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mx-auto mt-0.5" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Week Totals */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Code2 className="h-3 w-3" />
                    </div>
                    <p className="font-semibold">{weeklyStats.totalHoursCoded}h</p>
                    <p className="text-[10px] text-muted-foreground">Coded</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                    </div>
                    <p className="font-semibold">{Math.round(weeklyStats.totalDeepWorkMinutes / 60)}h</p>
                    <p className="text-[10px] text-muted-foreground">Deep Work</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                    </div>
                    <p className="font-semibold">€{weeklyStats.totalRevenue}</p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Middle column - Priority Goals */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Priority Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {goalsLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : topGoals.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active goals yet</p>
                    <Link to="/goals">
                      <Button variant="link" size="sm">Create your first goal</Button>
                    </Link>
                  </div>
                ) : (
                  topGoals.map((goal) => (
                    <Link key={goal.id} to="/goals">
                      <GoalCard goal={goal} showActions={false} />
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>Overall Goal Progress</span>
                  <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={overallProgress} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on {goalsWithMetrics.length} goals with metrics
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Major Moves (Projects) */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Major Moves (Projects)
                  </span>
                  <Badge variant="secondary">{projects.length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {projects.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No active projects</p>
                    <Link to="/projects">
                      <Button variant="link" size="sm">Add a project</Button>
                    </Link>
                  </div>
                ) : (
                  projects.slice(0, 5).map((project) => (
                    <div 
                      key={project.id}
                      className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={project.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {project.progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {projects.length > 5 && (
                  <Link to="/projects" className="block">
                    <Button variant="ghost" size="sm" className="w-full">
                      View all {projects.length} projects
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <Dumbbell className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                  <p className="text-xl font-bold">{weeklyStats.totalWorkouts}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <CheckSquare className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-xl font-bold">{weeklyStats.totalTasks}</p>
                  <p className="text-xs text-muted-foreground">Tasks Done</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
