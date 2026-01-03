import { useState, useEffect } from "react";
import { Timer, Play, Square, Check, Clock, Zap, Headphones, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActiveSession, useStartSession, useEndSession, useDeepWorkSessions, useTodaysDeepWorkMinutes, useWeeklyDeepWorkMinutes } from "@/hooks/useDeepWork";
import { useActiveProjects } from "@/hooks/useProjects";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, differenceInSeconds } from "date-fns";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function ActiveTimer() {
  const { data: session } = useActiveSession();
  const endSession = useEndSession();
  const [elapsed, setElapsed] = useState(0);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [focusQuality, setFocusQuality] = useState(7);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (session) {
      const updateElapsed = () => {
        const secs = differenceInSeconds(new Date(), new Date(session.start_time));
        setElapsed(secs);
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (!session) return null;

  const handleEnd = async () => {
    await endSession.mutateAsync({
      id: session.id,
      focusQuality,
      notes: notes || undefined,
    });
    setShowEndDialog(false);
    setFocusQuality(7);
    setNotes("");
  };

  return (
    <>
      <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-accent/5 glow-primary">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Deep Work Active</span>
          </div>
          
          <div className="text-6xl font-mono font-bold mb-4 gradient-text">
            {formatTime(elapsed)}
          </div>
          
          <p className="text-muted-foreground mb-6">
            {session.projects?.title || "No project selected"}
          </p>
          
          <Button 
            size="lg" 
            variant="destructive" 
            onClick={() => setShowEndDialog(true)}
            className="gap-2"
          >
            <Square className="h-5 w-5" />
            End Session
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Deep Work Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <p className="text-2xl font-mono font-bold text-center mb-2">
                {formatTime(elapsed)}
              </p>
              <p className="text-center text-muted-foreground">Total time focused</p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center justify-between">
                <span>Focus Quality</span>
                <span className="text-2xl">{focusQuality}/10</span>
              </label>
              <Slider
                value={[focusQuality]}
                onValueChange={([v]) => setFocusQuality(v)}
                min={1}
                max={10}
                step={1}
                className="mt-3"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Distracted</span>
                <span>Laser Focus</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you accomplish? Any blockers?"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEndDialog(false)}>
                Keep Going
              </Button>
              <Button className="flex-1" onClick={handleEnd} disabled={endSession.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Complete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StartSession() {
  const startSession = useStartSession();
  const { data: projects = [] } = useActiveProjects();
  const [selectedProject, setSelectedProject] = useState<string>("none");

  const handleStart = () => {
    startSession.mutate(selectedProject === "none" ? undefined : selectedProject);
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-8 text-center">
        <Timer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Start Deep Work Session</h3>
        <p className="text-muted-foreground mb-6">Pick a project and get into flow</p>

        <div className="max-w-xs mx-auto space-y-4">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button 
            size="lg" 
            className="w-full gap-2 glow-primary" 
            onClick={handleStart}
            disabled={startSession.isPending}
          >
            <Play className="h-5 w-5" />
            Start Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionHistory() {
  const { data: sessions = [] } = useDeepWorkSessions();

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No sessions yet. Start your first deep work session!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.slice(0, 10).map((session) => (
          <div 
            key={session.id} 
            className={cn(
              "flex items-center justify-between p-3 rounded-lg bg-muted/50",
              !session.end_time && "border border-primary/30"
            )}
          >
            <div>
              <p className="font-medium text-sm">
                {session.projects?.title || "No project"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(session.start_time), "MMM d, h:mm a")}
              </p>
            </div>
            <div className="text-right">
              {session.duration_minutes ? (
                <>
                  <p className="font-mono font-medium">{session.duration_minutes}m</p>
                  {session.focus_quality && (
                    <Badge variant="outline" className="text-xs">
                      {session.focus_quality}/10
                    </Badge>
                  )}
                </>
              ) : (
                <Badge variant="default" className="animate-pulse">Active</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DeepWorkPage() {
  const { data: activeSession } = useActiveSession();
  const { data: todayMinutes = 0 } = useTodaysDeepWorkMinutes();
  const { data: weeklyMinutes = 0 } = useWeeklyDeepWorkMinutes();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Timer className="h-8 w-8 text-primary" />
            Deep Work
          </h1>
          <p className="text-muted-foreground">
            Track your focused work sessions
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-success/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.floor(weeklyMinutes / 60)}h {weeklyMinutes % 60}m</p>
                  <p className="text-sm text-muted-foreground">This Week</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Brain.fm Player */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-primary" />
                Brain.fm Focus Music
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => window.open('https://my.brain.fm', '_blank')}
              >
                Open Full App
                <ExternalLink className="h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src="https://my.brain.fm"
              className="w-full h-[400px] rounded-b-lg border-0"
              allow="autoplay; encrypted-media"
              title="Brain.fm"
            />
          </CardContent>
        </Card>

        {/* Active Session or Start */}
        {activeSession ? <ActiveTimer /> : <StartSession />}

        {/* History */}
        <SessionHistory />
      </div>
    </AppLayout>
  );
}
