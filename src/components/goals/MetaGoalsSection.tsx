import { useState } from "react";
import { MetaGoal, useCreateMetaGoal, useUpdateMetaGoal, useDeleteMetaGoal } from "@/hooks/useGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Brain, ChevronUp, ChevronDown } from "lucide-react";

interface MetaGoalsSectionProps {
  goalId: string;
  metaGoals: MetaGoal[];
}

export function MetaGoalsSection({ goalId, metaGoals }: MetaGoalsSectionProps) {
  const [newSkill, setNewSkill] = useState("");
  const [newRequired, setNewRequired] = useState(5);

  const createMetaGoal = useCreateMetaGoal();
  const updateMetaGoal = useUpdateMetaGoal();
  const deleteMetaGoal = useDeleteMetaGoal();

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;
    await createMetaGoal.mutateAsync({
      goal_id: goalId,
      skill_name: newSkill.trim(),
      required_level: newRequired,
      current_level: 1,
    });
    setNewSkill("");
    setNewRequired(5);
  };

  const adjustLevel = async (metaGoal: MetaGoal, delta: number) => {
    const newLevel = Math.max(1, Math.min(10, metaGoal.current_level + delta));
    if (newLevel !== metaGoal.current_level) {
      await updateMetaGoal.mutateAsync({
        id: metaGoal.id,
        current_level: newLevel,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Skill Gaps (Meta-Goals)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metaGoals.map((meta) => {
          const progress = Math.round((meta.current_level / meta.required_level) * 100);
          const gap = meta.required_level - meta.current_level;
          
          return (
            <div
              key={meta.id}
              className="p-3 rounded-lg border bg-muted/30 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{meta.skill_name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustLevel(meta, -1)}
                    disabled={meta.current_level <= 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                  <Badge variant={gap <= 0 ? "default" : "secondary"} className="min-w-[60px] justify-center">
                    {meta.current_level} / {meta.required_level}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => adjustLevel(meta, 1)}
                    disabled={meta.current_level >= 10}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => deleteMetaGoal.mutate(meta.id)}
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </div>
              </div>
              <Progress value={Math.min(100, progress)} className="h-1.5" />
              {gap > 0 && (
                <p className="text-xs text-muted-foreground">
                  {gap} level{gap > 1 ? "s" : ""} to close
                </p>
              )}
              {meta.practice_system && (
                <p className="text-xs text-muted-foreground">
                  System: {meta.practice_system}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex gap-2 pt-2 border-t">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add skill gap..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
          />
          <Input
            type="number"
            value={newRequired}
            onChange={(e) => setNewRequired(parseInt(e.target.value) || 5)}
            className="w-16"
            min={1}
            max={10}
          />
          <Button size="icon" onClick={handleAddSkill} disabled={!newSkill.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
