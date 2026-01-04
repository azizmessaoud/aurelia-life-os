import { useState } from "react";
import { ForceField, useCreateForceField, useUpdateForceField, useDeleteForceField } from "@/hooks/useGoals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, TrendingUp, TrendingDown, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForceFieldAnalysisProps {
  goalId: string;
  forceFields: ForceField[];
}

export function ForceFieldAnalysis({ goalId, forceFields }: ForceFieldAnalysisProps) {
  const [newDriver, setNewDriver] = useState("");
  const [newBarrier, setNewBarrier] = useState("");
  const [newDriverStrength, setNewDriverStrength] = useState(5);
  const [newBarrierStrength, setNewBarrierStrength] = useState(5);

  const createForceField = useCreateForceField();
  const updateForceField = useUpdateForceField();
  const deleteForceField = useDeleteForceField();

  const drivers = forceFields.filter((f) => f.force_type === "driver");
  const barriers = forceFields.filter((f) => f.force_type === "barrier");

  const totalDriverStrength = drivers.reduce((sum, d) => sum + d.strength, 0);
  const totalBarrierStrength = barriers.reduce((sum, b) => sum + b.strength, 0);
  const netForce = totalDriverStrength - totalBarrierStrength;

  const handleAddDriver = async () => {
    if (!newDriver.trim()) return;
    await createForceField.mutateAsync({
      goal_id: goalId,
      force_type: "driver",
      description: newDriver.trim(),
      strength: newDriverStrength,
    });
    setNewDriver("");
    setNewDriverStrength(5);
  };

  const handleAddBarrier = async () => {
    if (!newBarrier.trim()) return;
    await createForceField.mutateAsync({
      goal_id: goalId,
      force_type: "barrier",
      description: newBarrier.trim(),
      strength: newBarrierStrength,
    });
    setNewBarrier("");
    setNewBarrierStrength(5);
  };

  const toggleAddressed = async (forceField: ForceField) => {
    await updateForceField.mutateAsync({
      id: forceField.id,
      is_addressed: !forceField.is_addressed,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Force Field Analysis
        </h3>
        <Badge 
          variant={netForce >= 0 ? "default" : "destructive"}
          className="font-mono"
        >
          Net Force: {netForce > 0 ? "+" : ""}{netForce}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Drivers */}
        <Card className="border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-600 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
              Drivers (+{totalDriverStrength})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border bg-green-50/50 dark:bg-green-950/20",
                  driver.is_addressed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={driver.is_addressed}
                  onCheckedChange={() => toggleAddressed(driver)}
                />
                <div className="flex-1">
                  <p className={cn("text-sm", driver.is_addressed && "line-through")}>
                    {driver.description}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    Strength: {driver.strength}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteForceField.mutate(driver.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t">
              <Input
                value={newDriver}
                onChange={(e) => setNewDriver(e.target.value)}
                placeholder="Add a driver..."
                onKeyDown={(e) => e.key === "Enter" && handleAddDriver()}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">
                  Strength: {newDriverStrength}
                </span>
                <Slider
                  value={[newDriverStrength]}
                  onValueChange={([v]) => setNewDriverStrength(v)}
                  min={1}
                  max={10}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddDriver} disabled={!newDriver.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barriers */}
        <Card className="border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
              <TrendingDown className="h-4 w-4" />
              Barriers (-{totalBarrierStrength})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {barriers.map((barrier) => (
              <div
                key={barrier.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg border bg-red-50/50 dark:bg-red-950/20",
                  barrier.is_addressed && "opacity-60"
                )}
              >
                <Checkbox
                  checked={barrier.is_addressed}
                  onCheckedChange={() => toggleAddressed(barrier)}
                />
                <div className="flex-1">
                  <p className={cn("text-sm", barrier.is_addressed && "line-through")}>
                    {barrier.description}
                  </p>
                  <Badge variant="outline" className="text-xs mt-1">
                    Strength: {barrier.strength}
                  </Badge>
                  {barrier.counter_move && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Counter: {barrier.counter_move}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteForceField.mutate(barrier.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t">
              <Input
                value={newBarrier}
                onChange={(e) => setNewBarrier(e.target.value)}
                placeholder="Add a barrier..."
                onKeyDown={(e) => e.key === "Enter" && handleAddBarrier()}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">
                  Strength: {newBarrierStrength}
                </span>
                <Slider
                  value={[newBarrierStrength]}
                  onValueChange={([v]) => setNewBarrierStrength(v)}
                  min={1}
                  max={10}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleAddBarrier} disabled={!newBarrier.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
