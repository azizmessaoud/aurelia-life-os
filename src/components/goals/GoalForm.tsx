import { useState, useEffect } from "react";
import { Goal, GOAL_AREAS, GOAL_TIMEFRAMES, GPS_STATUSES } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface GoalFormProps {
  initialData?: Partial<Goal>;
  onSubmit: (data: Partial<Goal>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GoalForm({ initialData, onSubmit, onCancel, isLoading }: GoalFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [area, setArea] = useState(initialData?.area || "career");
  const [timeframe, setTimeframe] = useState(initialData?.timeframe || "yearly");
  const [metricName, setMetricName] = useState(initialData?.metric_name || "");
  const [targetValue, setTargetValue] = useState(initialData?.target_value?.toString() || "");
  const [currentValue, setCurrentValue] = useState(initialData?.current_value?.toString() || "0");
  const [whyDriver, setWhyDriver] = useState(initialData?.why_driver || "");
  const [antiGoals, setAntiGoals] = useState(initialData?.anti_goals || "");
  const [gpsStatus, setGpsStatus] = useState(initialData?.gps_status || "not_defined");
  const [priority, setPriority] = useState(initialData?.priority || 5);
  const [deadline, setDeadline] = useState(
    initialData?.deadline 
      ? new Date(initialData.deadline).toISOString().split("T")[0] 
      : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      area,
      timeframe,
      metric_name: metricName || null,
      target_value: targetValue ? parseFloat(targetValue) : null,
      current_value: currentValue ? parseFloat(currentValue) : 0,
      why_driver: whyDriver || null,
      anti_goals: antiGoals || null,
      gps_status: gpsStatus,
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Goal Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Complete Data Science certification"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="area">Life Area</Label>
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_AREAS.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  {a.emoji} {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeframe">Timeframe</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GOAL_TIMEFRAMES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="metric">Metric Name</Label>
          <Input
            id="metric"
            value={metricName}
            onChange={(e) => setMetricName(e.target.value)}
            placeholder="e.g., Modules completed"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="target">Target</Label>
          <Input
            id="target"
            type="number"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
            placeholder="e.g., 12"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="current">Current</Label>
          <Input
            id="current"
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="why">Why? (Driver)</Label>
        <Textarea
          id="why"
          value={whyDriver}
          onChange={(e) => setWhyDriver(e.target.value)}
          placeholder="What's driving you towards this goal?"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="antiGoals">Anti-Goals (What you won't sacrifice)</Label>
        <Textarea
          id="antiGoals"
          value={antiGoals}
          onChange={(e) => setAntiGoals(e.target.value)}
          placeholder="e.g., I won't sacrifice sleep for this goal"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">GPS Status</Label>
          <Select value={gpsStatus} onValueChange={setGpsStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GPS_STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Priority: {priority}</Label>
        <Slider
          value={[priority]}
          onValueChange={([v]) => setPriority(v)}
          min={1}
          max={10}
          step={1}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !title.trim()}>
          {initialData?.id ? "Update Goal" : "Create Goal"}
        </Button>
      </div>
    </form>
  );
}
