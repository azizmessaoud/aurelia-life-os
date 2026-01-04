import { useState, useEffect } from "react";
import { useTodaysLog, useUpsertDailyLog, DailyLog } from "@/hooks/useDailyLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  Calendar, 
  Code2, 
  Dumbbell, 
  CheckSquare, 
  DollarSign, 
  Timer,
  Save
} from "lucide-react";

export function DailyLogWidget() {
  const { data: todaysLog, isLoading } = useTodaysLog();
  const upsertLog = useUpsertDailyLog();

  const [hoursCoded, setHoursCoded] = useState("");
  const [workouts, setWorkouts] = useState("");
  const [tasks, setTasks] = useState("");
  const [revenue, setRevenue] = useState("");
  const [deepWorkMinutes, setDeepWorkMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (todaysLog) {
      setHoursCoded(todaysLog.hours_coded?.toString() || "");
      setWorkouts(todaysLog.workouts_done?.toString() || "");
      setTasks(todaysLog.tasks_completed?.toString() || "");
      setRevenue(todaysLog.revenue_earned?.toString() || "");
      setDeepWorkMinutes(todaysLog.deep_work_minutes?.toString() || "");
      setNotes(todaysLog.notes || "");
    }
  }, [todaysLog]);

  useEffect(() => {
    const hasChanged = 
      hoursCoded !== (todaysLog?.hours_coded?.toString() || "") ||
      workouts !== (todaysLog?.workouts_done?.toString() || "") ||
      tasks !== (todaysLog?.tasks_completed?.toString() || "") ||
      revenue !== (todaysLog?.revenue_earned?.toString() || "") ||
      deepWorkMinutes !== (todaysLog?.deep_work_minutes?.toString() || "") ||
      notes !== (todaysLog?.notes || "");
    setHasChanges(hasChanged);
  }, [hoursCoded, workouts, tasks, revenue, deepWorkMinutes, notes, todaysLog]);

  const handleSave = async () => {
    await upsertLog.mutateAsync({
      log_date: format(new Date(), "yyyy-MM-dd"),
      hours_coded: hoursCoded ? parseFloat(hoursCoded) : 0,
      workouts_done: workouts ? parseInt(workouts) : 0,
      tasks_completed: tasks ? parseInt(tasks) : 0,
      revenue_earned: revenue ? parseFloat(revenue) : 0,
      deep_work_minutes: deepWorkMinutes ? parseInt(deepWorkMinutes) : 0,
      notes: notes || null,
    });
    setHasChanges(false);
  };

  const today = format(new Date(), "EEEE, MMMM d");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Log
          </span>
          <span className="text-xs font-normal text-muted-foreground">{today}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Code2 className="h-3 w-3" /> Hours Coded
            </Label>
            <Input
              type="number"
              step="0.5"
              value={hoursCoded}
              onChange={(e) => setHoursCoded(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Dumbbell className="h-3 w-3" /> Workouts
            </Label>
            <Input
              type="number"
              value={workouts}
              onChange={(e) => setWorkouts(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <CheckSquare className="h-3 w-3" /> Tasks Done
            </Label>
            <Input
              type="number"
              value={tasks}
              onChange={(e) => setTasks(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <DollarSign className="h-3 w-3" /> Revenue (€)
            </Label>
            <Input
              type="number"
              step="0.01"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1.5">
              <Timer className="h-3 w-3" /> Deep Work (min)
            </Label>
            <Input
              type="number"
              value={deepWorkMinutes}
              onChange={(e) => setDeepWorkMinutes(e.target.value)}
              placeholder="0"
              className="h-8"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did today go?"
            rows={2}
            className="resize-none"
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || upsertLog.isPending}
          className="w-full"
          size="sm"
        >
          <Save className="h-4 w-4 mr-2" />
          {upsertLog.isPending ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
        </Button>
      </CardContent>
    </Card>
  );
}
