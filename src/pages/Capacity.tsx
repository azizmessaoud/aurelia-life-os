import { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Calendar, Save, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentWeekCapacity, useWeeklyCapacityHistory, useUpsertWeeklyCapacity, useADHDTaxAverage, getWeekStartDate } from "@/hooks/useWeeklyCapacity";
import { AppLayout } from "@/components/layout/AppLayout";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

function WeeklyForm() {
  const weekStart = getWeekStartDate();
  const { data: currentWeek } = useCurrentWeekCapacity();
  const upsert = useUpsertWeeklyCapacity();

  const [formData, setFormData] = useState({
    planned_hours: currentWeek?.planned_hours || 20,
    actual_hours: currentWeek?.actual_hours || 0,
    what_worked: currentWeek?.what_worked || "",
    what_failed: currentWeek?.what_failed || "",
    revenue_this_week: currentWeek?.revenue_this_week || 0,
    notes: currentWeek?.notes || "",
  });

  // Update form when data loads
  useState(() => {
    if (currentWeek) {
      setFormData({
        planned_hours: currentWeek.planned_hours,
        actual_hours: currentWeek.actual_hours,
        what_worked: currentWeek.what_worked || "",
        what_failed: currentWeek.what_failed || "",
        revenue_this_week: currentWeek.revenue_this_week || 0,
        notes: currentWeek.notes || "",
      });
    }
  });

  const adhdTax = formData.planned_hours > 0 
    ? Math.round((1 - formData.actual_hours / formData.planned_hours) * 100)
    : 0;

  const handleSave = () => {
    upsert.mutate({
      week_start: weekStart,
      ...formData,
    });
  };

  const weekEnd = format(addDays(new Date(weekStart), 6), "MMM d");
  const weekStartFormatted = format(new Date(weekStart), "MMM d");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Week of {weekStartFormatted} - {weekEnd}
          </CardTitle>
          <Badge variant={adhdTax > 30 ? "destructive" : adhdTax > 15 ? "outline" : "default"}>
            {adhdTax > 0 ? `${adhdTax}% ADHD Tax` : "On Track!"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Planned Hours</label>
            <Input
              type="number"
              value={formData.planned_hours}
              onChange={(e) => setFormData({ ...formData, planned_hours: parseFloat(e.target.value) || 0 })}
              className="mt-1"
              min={0}
              step={0.5}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Actual Hours</label>
            <Input
              type="number"
              value={formData.actual_hours}
              onChange={(e) => setFormData({ ...formData, actual_hours: parseFloat(e.target.value) || 0 })}
              className="mt-1"
              min={0}
              step={0.5}
            />
          </div>
        </div>

        {/* ADHD Tax Visual */}
        <div className="p-4 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">ADHD Tax Calculation</span>
            <span className={cn(
              "text-2xl font-bold",
              adhdTax > 30 ? "text-destructive" : adhdTax > 15 ? "text-warning" : "text-success"
            )}>
              {adhdTax}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                adhdTax > 30 ? "bg-destructive" : adhdTax > 15 ? "bg-warning" : "bg-success"
              )}
              style={{ width: `${Math.min(100, 100 - adhdTax)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {formData.actual_hours} of {formData.planned_hours} hours completed
          </p>
        </div>

        {/* What Worked / Failed */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-success flex items-center gap-1">
              ✅ What Worked
            </label>
            <Textarea
              value={formData.what_worked}
              onChange={(e) => setFormData({ ...formData, what_worked: e.target.value })}
              placeholder="brain.fm, body doubling, morning sessions..."
              className="mt-1"
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-destructive flex items-center gap-1">
              ❌ What Failed
            </label>
            <Textarea
              value={formData.what_failed}
              onChange={(e) => setFormData({ ...formData, what_failed: e.target.value })}
              placeholder="overplanning, phone rabbit holes, poor sleep..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

        {/* Revenue */}
        <div>
          <label className="text-sm font-medium">Revenue This Week (€)</label>
          <Input
            type="number"
            value={formData.revenue_this_week}
            onChange={(e) => setFormData({ ...formData, revenue_this_week: parseFloat(e.target.value) || 0 })}
            className="mt-1"
            min={0}
            step={10}
          />
          {formData.actual_hours > 0 && formData.revenue_this_week > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              €{(formData.revenue_this_week / formData.actual_hours).toFixed(2)}/hour effective rate
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any other observations about this week..."
            className="mt-1"
            rows={2}
          />
        </div>

        <Button onClick={handleSave} disabled={upsert.isPending} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Week
        </Button>
      </CardContent>
    </Card>
  );
}

function HistoryChart() {
  const { data: history = [] } = useWeeklyCapacityHistory();
  const { data: avgTax } = useADHDTaxAverage();

  if (history.length === 0) {
    return null;
  }

  // Simple bar chart representation
  const maxHours = Math.max(...history.map(w => Math.max(w.planned_hours, w.actual_hours)), 1);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Weekly History
          </CardTitle>
          {avgTax !== null && (
            <Badge variant="outline">
              Avg ADHD Tax: {Math.round(avgTax)}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.slice(0, 8).reverse().map((week) => {
            const tax = week.planned_hours > 0 
              ? Math.round((1 - week.actual_hours / week.planned_hours) * 100)
              : 0;
            const plannedWidth = (week.planned_hours / maxHours) * 100;
            const actualWidth = (week.actual_hours / maxHours) * 100;

            return (
              <div key={week.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {format(new Date(week.week_start), "MMM d")}
                  </span>
                  <span className={cn(
                    tax > 30 ? "text-destructive" : tax > 15 ? "text-warning" : "text-success"
                  )}>
                    {tax > 0 ? `${tax}%` : "✓"}
                  </span>
                </div>
                <div className="relative h-6 bg-muted rounded">
                  <div 
                    className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded"
                    style={{ width: `${plannedWidth}%` }}
                  />
                  <div 
                    className={cn(
                      "absolute inset-y-0 left-0 rounded transition-all",
                      tax > 30 ? "bg-destructive/60" : tax > 15 ? "bg-warning/60" : "bg-success/60"
                    )}
                    style={{ width: `${actualWidth}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-mono">
                    {week.actual_hours}/{week.planned_hours}h
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CapacityPage() {
  const { data: avgTax } = useADHDTaxAverage();

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            Weekly Capacity
          </h1>
          <p className="text-muted-foreground">
            Track your planned vs actual hours • Understand your ADHD tax
          </p>
        </div>

        {/* Insight Card */}
        {avgTax !== null && (
          <Card className={cn(
            "border-l-4",
            avgTax > 30 ? "border-l-destructive bg-destructive/5" : 
            avgTax > 15 ? "border-l-warning bg-warning/5" : 
            "border-l-success bg-success/5"
          )}>
            <CardContent className="p-4 flex items-center gap-4">
              {avgTax > 30 ? (
                <TrendingDown className="h-8 w-8 text-destructive" />
              ) : avgTax > 15 ? (
                <Minus className="h-8 w-8 text-warning" />
              ) : (
                <TrendingUp className="h-8 w-8 text-success" />
              )}
              <div>
                <p className="font-semibold">
                  {avgTax > 30 
                    ? "High ADHD Tax Detected" 
                    : avgTax > 15 
                    ? "Moderate ADHD Tax" 
                    : "You're Doing Great!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {avgTax > 30 
                    ? "You're completing about " + (100 - avgTax) + "% of planned hours. Try planning less and doing more." 
                    : avgTax > 15 
                    ? "You're on track. Keep logging to find patterns." 
                    : "Your estimates are realistic. Nice work!"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <WeeklyForm />
          <HistoryChart />
        </div>
      </div>
    </AppLayout>
  );
}
