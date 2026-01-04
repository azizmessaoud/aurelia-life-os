import { useState } from "react";
import { 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Target, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Save
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCurrentWeekCapacity, useUpsertWeeklyCapacity, getWeekStartDate } from "@/hooks/useWeeklyCapacity";
import { useGoals, useUpdateGoal } from "@/hooks/useGoals";
import { useWeeklyStats } from "@/hooks/useDailyLogs";
import { format, addDays, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const REVIEW_STEPS = [
  { id: "welcome", title: "Start Review", icon: BookOpen },
  { id: "reflection", title: "Weekly Reflection", icon: TrendingUp },
  { id: "goals", title: "Goal Progress", icon: Target },
  { id: "planning", title: "Next Week", icon: Calendar },
  { id: "complete", title: "Complete", icon: Check },
];

export default function WeeklyReviewPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const weekStart = getWeekStartDate();
  const { data: currentWeek } = useCurrentWeekCapacity();
  const { data: goals = [] } = useGoals();
  const weeklyStats = useWeeklyStats();
  const upsertCapacity = useUpsertWeeklyCapacity();
  const updateGoal = useUpdateGoal();

  // Form state
  const [reflection, setReflection] = useState({
    what_worked: currentWeek?.what_worked || "",
    what_failed: currentWeek?.what_failed || "",
    actual_hours: currentWeek?.actual_hours || 0,
    planned_hours: currentWeek?.planned_hours || 20,
    revenue_this_week: currentWeek?.revenue_this_week || 0,
    notes: currentWeek?.notes || "",
    energy_rating: 5,
    focus_rating: 5,
    wins: "",
    challenges: "",
    learnings: "",
  });

  const [goalUpdates, setGoalUpdates] = useState<Record<string, number>>({});
  const [nextWeekPlan, setNextWeekPlan] = useState({
    planned_hours: 20,
    top_priority: "",
    must_avoid: "",
    energy_strategy: "",
  });

  const weekEnd = format(addDays(new Date(weekStart), 6), "MMM d");
  const weekStartFormatted = format(new Date(weekStart), "MMM d, yyyy");

  const progress = ((currentStep + 1) / REVIEW_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < REVIEW_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveReview = async () => {
    // Save weekly capacity
    await upsertCapacity.mutateAsync({
      week_start: weekStart,
      planned_hours: reflection.planned_hours,
      actual_hours: reflection.actual_hours,
      what_worked: reflection.what_worked,
      what_failed: reflection.what_failed,
      revenue_this_week: reflection.revenue_this_week,
      notes: `${reflection.notes}\n\nWins: ${reflection.wins}\nChallenges: ${reflection.challenges}\nLearnings: ${reflection.learnings}`,
    });

    // Update goal progress
    for (const [goalId, newValue] of Object.entries(goalUpdates)) {
      await updateGoal.mutateAsync({
        id: goalId,
        current_value: newValue,
      });
    }

    // Save next week's plan
    const nextWeekStart = format(addDays(new Date(weekStart), 7), "yyyy-MM-dd");
    await upsertCapacity.mutateAsync({
      week_start: nextWeekStart,
      planned_hours: nextWeekPlan.planned_hours,
      notes: `Priority: ${nextWeekPlan.top_priority}\nAvoid: ${nextWeekPlan.must_avoid}\nEnergy Strategy: ${nextWeekPlan.energy_strategy}`,
    });

    toast.success("Weekly review completed!");
    handleNext();
  };

  const activeGoals = goals.filter(g => g.timeframe === "yearly" || g.timeframe === "monthly");

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Weekly Review
          </h1>
          <p className="text-muted-foreground">
            Week of {weekStartFormatted}
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {REVIEW_STEPS.map((step, i) => (
              <div 
                key={step.id}
                className={cn(
                  "flex items-center gap-1 transition-colors",
                  i <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="min-h-[500px]">
          <CardContent className="p-6">
            {/* Welcome */}
            {currentStep === 0 && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Time for Reflection</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Take 10-15 minutes to review your week. This guided process will help you 
                    celebrate wins, learn from challenges, and plan ahead.
                  </p>
                </div>

                {/* Quick Stats */}
                {weeklyStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">{weeklyStats.totalHoursCoded}h</div>
                      <div className="text-xs text-muted-foreground">Hours Coded</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">{weeklyStats.totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Tasks Done</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">{weeklyStats.totalWorkouts}</div>
                      <div className="text-xs text-muted-foreground">Workouts</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">€{weeklyStats.totalRevenue}</div>
                      <div className="text-xs text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                )}

                <Button size="lg" onClick={handleNext} className="mt-4">
                  Begin Review
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}

            {/* Reflection */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Weekly Reflection</h2>
                  <p className="text-sm text-muted-foreground">Look back at what happened this week</p>
                </div>

                {/* Hours & ADHD Tax */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Planned Hours</label>
                    <Input
                      type="number"
                      value={reflection.planned_hours}
                      onChange={(e) => setReflection({ ...reflection, planned_hours: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Actual Hours</label>
                    <Input
                      type="number"
                      value={reflection.actual_hours}
                      onChange={(e) => setReflection({ ...reflection, actual_hours: parseFloat(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Energy & Focus */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Overall Energy: {reflection.energy_rating}/10
                    </label>
                    <Slider
                      value={[reflection.energy_rating]}
                      onValueChange={([v]) => setReflection({ ...reflection, energy_rating: v })}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Focus Quality: {reflection.focus_rating}/10
                    </label>
                    <Slider
                      value={[reflection.focus_rating]}
                      onValueChange={([v]) => setReflection({ ...reflection, focus_rating: v })}
                      min={1}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>

                {/* Wins */}
                <div>
                  <label className="text-sm font-medium text-green-600 dark:text-green-400">
                    🎉 What were your wins this week?
                  </label>
                  <Textarea
                    value={reflection.wins}
                    onChange={(e) => setReflection({ ...reflection, wins: e.target.value })}
                    placeholder="Completed project milestone, had 3 deep work sessions, exercised 4 times..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* What Worked */}
                <div>
                  <label className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    ✅ What strategies/tactics worked?
                  </label>
                  <Textarea
                    value={reflection.what_worked}
                    onChange={(e) => setReflection({ ...reflection, what_worked: e.target.value })}
                    placeholder="Brain.fm, body doubling, morning deep work blocks, phone in another room..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Challenges */}
                <div>
                  <label className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    ⚠️ What challenges did you face?
                  </label>
                  <Textarea
                    value={reflection.challenges}
                    onChange={(e) => setReflection({ ...reflection, challenges: e.target.value })}
                    placeholder="Got distracted by social media, overplanned, poor sleep on Wednesday..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* What Failed */}
                <div>
                  <label className="text-sm font-medium text-red-600 dark:text-red-400">
                    ❌ What didn't work / should avoid?
                  </label>
                  <Textarea
                    value={reflection.what_failed}
                    onChange={(e) => setReflection({ ...reflection, what_failed: e.target.value })}
                    placeholder="Checking phone first thing, skipping exercise, late night coding..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                {/* Learnings */}
                <div>
                  <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    💡 Key learnings or insights?
                  </label>
                  <Textarea
                    value={reflection.learnings}
                    onChange={(e) => setReflection({ ...reflection, learnings: e.target.value })}
                    placeholder="I work best after exercise, need to limit meetings to afternoons..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Goals */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Goal Progress</h2>
                  <p className="text-sm text-muted-foreground">Update your progress on active goals</p>
                </div>

                {activeGoals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No active goals yet. Create some goals to track!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeGoals.map((goal) => {
                      const currentValue = goalUpdates[goal.id] ?? goal.current_value ?? 0;
                      const targetValue = goal.target_value ?? 100;
                      const progress = targetValue > 0 ? (currentValue / targetValue) * 100 : 0;

                      return (
                        <Card key={goal.id} className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{goal.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{goal.area}</Badge>
                                <Badge variant="secondary">{goal.timeframe}</Badge>
                              </div>
                            </div>
                            <Badge variant={progress >= 100 ? "default" : progress >= 50 ? "secondary" : "outline"}>
                              {Math.round(progress)}%
                            </Badge>
                          </div>

                          {goal.metric_name && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{goal.metric_name}</span>
                                <span className="font-mono">
                                  {currentValue} / {targetValue}
                                </span>
                              </div>
                              <Progress value={Math.min(100, progress)} className="h-2" />
                              <div>
                                <label className="text-xs text-muted-foreground">Update current value:</label>
                                <Input
                                  type="number"
                                  value={currentValue}
                                  onChange={(e) => setGoalUpdates({
                                    ...goalUpdates,
                                    [goal.id]: parseFloat(e.target.value) || 0
                                  })}
                                  className="mt-1 h-8"
                                />
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Planning */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Plan Next Week</h2>
                  <p className="text-sm text-muted-foreground">
                    Week of {format(addDays(new Date(weekStart), 7), "MMM d, yyyy")}
                  </p>
                </div>

                {/* ADHD Tax Insight */}
                {reflection.planned_hours > 0 && (
                  <Card className="p-4 bg-muted/50">
                    <p className="text-sm">
                      <strong>ADHD Tax Insight:</strong> This week you completed {reflection.actual_hours}h 
                      of {reflection.planned_hours}h planned ({Math.round((reflection.actual_hours / reflection.planned_hours) * 100)}%).
                      Consider planning for{" "}
                      <span className="font-bold text-primary">
                        ~{Math.round(reflection.actual_hours * 1.1)}h
                      </span>{" "}
                      next week for a realistic target.
                    </p>
                  </Card>
                )}

                <div>
                  <label className="text-sm font-medium">Planned Hours for Next Week</label>
                  <Input
                    type="number"
                    value={nextWeekPlan.planned_hours}
                    onChange={(e) => setNextWeekPlan({ ...nextWeekPlan, planned_hours: parseFloat(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    🎯 Top Priority / MIT for the Week
                  </label>
                  <Textarea
                    value={nextWeekPlan.top_priority}
                    onChange={(e) => setNextWeekPlan({ ...nextWeekPlan, top_priority: e.target.value })}
                    placeholder="What's the ONE thing that must get done?"
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    🚫 What I Must Avoid
                  </label>
                  <Textarea
                    value={nextWeekPlan.must_avoid}
                    onChange={(e) => setNextWeekPlan({ ...nextWeekPlan, must_avoid: e.target.value })}
                    placeholder="Based on what failed this week..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    ⚡ Energy Strategy
                  </label>
                  <Textarea
                    value={nextWeekPlan.energy_strategy}
                    onChange={(e) => setNextWeekPlan({ ...nextWeekPlan, energy_strategy: e.target.value })}
                    placeholder="How will you protect your energy? Sleep, exercise, breaks..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <Button 
                  onClick={handleSaveReview} 
                  disabled={upsertCapacity.isPending}
                  className="w-full"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Complete Review
                </Button>
              </div>
            )}

            {/* Complete */}
            {currentStep === 4 && (
              <div className="text-center space-y-6 py-8">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-10 w-10 text-green-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Review Complete! 🎉</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Great job taking time to reflect. Your insights and plans have been saved.
                    You're set up for a successful week ahead.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <Button variant="outline" asChild>
                    <a href="/gps">View GPS</a>
                  </Button>
                  <Button asChild>
                    <a href="/goals">View Goals</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        {currentStep > 0 && currentStep < 4 && (
          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {currentStep < 3 && (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
