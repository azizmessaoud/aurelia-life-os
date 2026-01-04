import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  useGoals, 
  useGoalWithDetails,
  useCreateGoal, 
  useUpdateGoal, 
  useDeleteGoal,
  Goal,
  GOAL_AREAS,
  GOAL_TIMEFRAMES,
} from "@/hooks/useGoals";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalForm } from "@/components/goals/GoalForm";
import { ForceFieldAnalysis } from "@/components/goals/ForceFieldAnalysis";
import { MetaGoalsSection } from "@/components/goals/MetaGoalsSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const { data: goalDetails } = useGoalWithDetails(selectedGoalId || "");

  const handleCreate = async (data: Partial<Goal>) => {
    await createGoal.mutateAsync(data as any);
    setIsFormOpen(false);
  };

  const handleUpdate = async (data: Partial<Goal>) => {
    if (!editingGoal) return;
    await updateGoal.mutateAsync({ id: editingGoal.id, ...data });
    setEditingGoal(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this goal? This will also remove linked force fields and skill gaps.")) {
      await deleteGoal.mutateAsync(id);
      if (selectedGoalId === id) setSelectedGoalId(null);
    }
  };

  const yearlyGoals = goals.filter((g) => g.timeframe === "yearly");
  const quarterlyGoals = goals.filter((g) => g.timeframe === "quarterly");
  const monthlyGoals = goals.filter((g) => g.timeframe === "monthly");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Target className="h-7 w-7 text-primary" />
              Life Goals
            </h1>
            <p className="text-muted-foreground text-sm">
              Reverse goal setting with force field analysis
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>

        {/* Goals by Timeframe */}
        <Tabs defaultValue="yearly" className="space-y-4">
          <TabsList>
            <TabsTrigger value="yearly">
              Yearly ({yearlyGoals.length})
            </TabsTrigger>
            <TabsTrigger value="quarterly">
              Quarterly ({quarterlyGoals.length})
            </TabsTrigger>
            <TabsTrigger value="monthly">
              Monthly ({monthlyGoals.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <Skeleton className="h-2 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="yearly" className="mt-4">
                <GoalGrid 
                  goals={yearlyGoals} 
                  onEdit={setEditingGoal}
                  onDelete={handleDelete}
                  onClick={setSelectedGoalId}
                  emptyMessage="No yearly goals yet. Start with your big picture vision!"
                />
              </TabsContent>
              <TabsContent value="quarterly" className="mt-4">
                <GoalGrid 
                  goals={quarterlyGoals} 
                  onEdit={setEditingGoal}
                  onDelete={handleDelete}
                  onClick={setSelectedGoalId}
                  emptyMessage="No quarterly goals. Break your yearly goals into quarters!"
                />
              </TabsContent>
              <TabsContent value="monthly" className="mt-4">
                <GoalGrid 
                  goals={monthlyGoals} 
                  onEdit={setEditingGoal}
                  onDelete={handleDelete}
                  onClick={setSelectedGoalId}
                  emptyMessage="No monthly goals. Set focused monthly targets!"
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isFormOpen || !!editingGoal} onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingGoal(null);
          }
        }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGoal ? "Edit Goal" : "Create New Goal"}
              </DialogTitle>
            </DialogHeader>
            <GoalForm
              initialData={editingGoal || undefined}
              onSubmit={editingGoal ? handleUpdate : handleCreate}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingGoal(null);
              }}
              isLoading={createGoal.isPending || updateGoal.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Goal Details Sheet */}
        <Sheet open={!!selectedGoalId} onOpenChange={(open) => !open && setSelectedGoalId(null)}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSelectedGoalId(null)}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {goalDetails?.goal.title}
              </SheetTitle>
            </SheetHeader>
            
            {goalDetails && (
              <div className="space-y-6 mt-6">
                <GoalCard 
                  goal={goalDetails.goal} 
                  showActions={false}
                />
                
                <ForceFieldAnalysis 
                  goalId={goalDetails.goal.id}
                  forceFields={goalDetails.forceFields}
                />
                
                <MetaGoalsSection 
                  goalId={goalDetails.goal.id}
                  metaGoals={goalDetails.metaGoals}
                />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}

function GoalGrid({ 
  goals, 
  onEdit, 
  onDelete, 
  onClick,
  emptyMessage 
}: { 
  goals: Goal[]; 
  onEdit: (goal: Goal) => void;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
  emptyMessage: string;
}) {
  if (goals.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onEdit={() => onEdit(goal)}
          onDelete={() => onDelete(goal.id)}
          onClick={() => onClick(goal.id)}
        />
      ))}
    </div>
  );
}
