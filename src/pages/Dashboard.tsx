import { 
  Timer, 
  TrendingUp, 
  DollarSign, 
  FolderKanban,
  Zap,
  Target,
  Clock,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useActiveProjects } from "@/hooks/useProjects";
import { useActiveSession, useTodaysDeepWorkMinutes, useWeeklyDeepWorkMinutes, useStartSession } from "@/hooks/useDeepWork";
import { useCurrentWeekCapacity, useADHDTaxAverage } from "@/hooks/useWeeklyCapacity";
import { useQuickWinOpportunities } from "@/hooks/useOpportunities";
import { useAverageEnergy } from "@/hooks/useMoodLogs";
import { Link } from "react-router-dom";
import { format, differenceInDays, differenceInMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";
import { MoodQuickLog } from "@/components/mood/MoodQuickLog";
import { MoodTrendsCard } from "@/components/mood/MoodTrendsCard";

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  trend,
  className 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}) {
  return (
    <Card className={cn("gradient-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {trend && (
            <Badge variant={trend === "up" ? "default" : trend === "down" ? "destructive" : "secondary"} className="text-xs">
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </Badge>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveSessionBanner() {
  const { data: session } = useActiveSession();
  
  if (!session) return null;
  
  const elapsed = differenceInMinutes(new Date(), new Date(session.start_time));
  
  return (
    <Card className="border-primary/50 bg-primary/5 glow-primary">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
            <div>
              <p className="font-medium">Deep Work Session Active</p>
              <p className="text-sm text-muted-foreground">
                {session.projects?.title || "No project"} • {formatDuration(elapsed)} elapsed
              </p>
            </div>
          </div>
          <Link to="/deep-work">
            <Button variant="outline" size="sm">View Session</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PriorityProject() {
  const { data: projects } = useActiveProjects();
  
  if (!projects || projects.length === 0) {
    return (
      <Card className="gradient-border">
        <CardContent className="p-6 text-center">
          <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">No active projects</p>
          <Link to="/projects">
            <Button variant="outline" size="sm" className="mt-3">Add Project</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const priority = projects[0];
  const daysLeft = priority.deadline 
    ? differenceInDays(new Date(priority.deadline), new Date())
    : null;
  
  const domainColors: Record<string, string> = {
    exam: "bg-chart-5/10 text-chart-5",
    freelance: "bg-chart-3/10 text-chart-3",
    learning: "bg-chart-1/10 text-chart-1",
    health: "bg-chart-2/10 text-chart-2",
    startup: "bg-chart-4/10 text-chart-4",
    personal: "bg-muted text-muted-foreground",
  };

  return (
    <Card className="gradient-border overflow-hidden">
      <div className="absolute inset-0 gradient-primary opacity-50" />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={cn("uppercase text-xs", domainColors[priority.domain])}>
            {priority.domain}
          </Badge>
          {daysLeft !== null && daysLeft <= 3 && (
            <Badge variant="destructive" className="animate-pulse-soft">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {daysLeft} days left
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <h3 className="text-xl font-semibold mb-2">{priority.title}</h3>
        {priority.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{priority.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{priority.progress}%</span>
          </div>
          <Progress value={priority.progress} className="h-2" />
        </div>
        {priority.deadline && (
          <p className="text-xs text-muted-foreground mt-3">
            <Clock className="h-3 w-3 inline mr-1" />
            Due {format(new Date(priority.deadline), "MMM d, yyyy")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function QuickWins() {
  const { data: streams } = useQuickWinOpportunities();

  if (!streams || streams.length === 0) {
    return null;
  }

  const adhdLabels: Record<string, string> = {
    hyperfocus_gold: "🏆 Hyperfocus Gold",
    high: "✨ High",
    medium: "👍 Medium",
    low: "😐 Low",
    hell_no: "🚫 Hell No",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-adhd-gold" />
          Quick Wins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {streams.slice(0, 3).map((stream) => (
          <div key={stream.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
            <div>
              <p className="font-medium text-sm">{stream.name}</p>
              <p className="text-xs text-muted-foreground">
                {adhdLabels[stream.adhd_compatibility]} • {stream.context_switch_minutes}m to start
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              €{stream.realistic_monthly_eur || 0}/mo
            </Badge>
          </div>
        ))}
        <Link to="/income" className="block">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View All Income Streams
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: todayMinutes = 0 } = useTodaysDeepWorkMinutes();
  const { data: weeklyMinutes = 0 } = useWeeklyDeepWorkMinutes();
  const { data: weeklyCapacity } = useCurrentWeekCapacity();
  const { data: adhdTaxAvg } = useADHDTaxAverage();
  const { data: projects = [] } = useActiveProjects();
  const { data: avgEnergy } = useAverageEnergy(7);
  const startSession = useStartSession();

  const adhdTax = weeklyCapacity?.planned_hours && weeklyCapacity.planned_hours > 0
    ? Math.round((1 - weeklyCapacity.actual_hours / weeklyCapacity.planned_hours) * 100)
    : null;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Welcome back, Aziz</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, MMMM d")} • ESPRIT 4th Year • Data Science
            </p>
          </div>
          <Button 
            onClick={() => startSession.mutate(projects[0]?.id)} 
            disabled={startSession.isPending}
            className="glow-primary"
          >
            <Timer className="h-4 w-4 mr-2" />
            Start Deep Work
          </Button>
        </div>

        {/* Active Session Banner */}
        <ActiveSessionBanner />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Timer}
            label="Today's Focus"
            value={formatDuration(todayMinutes)}
            subValue="deep work"
          />
          <StatCard
            icon={Clock}
            label="This Week"
            value={formatDuration(weeklyMinutes)}
            subValue={weeklyCapacity ? `of ${weeklyCapacity.planned_hours}h planned` : "no target set"}
          />
          <StatCard
            icon={TrendingUp}
            label="ADHD Tax"
            value={adhdTax !== null ? `${Math.max(0, adhdTax)}%` : "—"}
            subValue={adhdTaxAvg !== null ? `Avg: ${Math.round(adhdTaxAvg)}%` : "Track more weeks"}
            trend={adhdTax !== null ? (adhdTax > 30 ? "down" : adhdTax < 10 ? "up" : "neutral") : undefined}
          />
          <StatCard
            icon={FolderKanban}
            label="Active Projects"
            value={projects.length}
            subValue="WIP limit: 3"
            trend={projects.length > 3 ? "down" : "up"}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column: Priority + Mood */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Today's Priority
            </h2>
            <PriorityProject />
            
            {/* Mood Quick Log */}
            <MoodQuickLog />
          </div>

          {/* Right Column: Energy Trends + Quick Wins */}
          <div className="space-y-4">
            {/* Energy Trends */}
            <MoodTrendsCard />
            
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              ADHD-Friendly Income
            </h2>
            <QuickWins />
            
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-4 grid grid-cols-2 gap-2">
                <Link to="/chat">
                  <Button variant="outline" className="w-full">
                    💬 Ask AURELIA
                  </Button>
                </Link>
                <Link to="/capacity">
                  <Button variant="outline" className="w-full">
                    📊 Log Capacity
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
