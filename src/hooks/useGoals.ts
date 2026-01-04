import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Goal = Tables<"goals">;
export type ForceField = Tables<"goal_force_fields">;
export type MetaGoal = Tables<"meta_goals">;

export type GoalInsert = TablesInsert<"goals">;
export type ForceFieldInsert = TablesInsert<"goal_force_fields">;
export type MetaGoalInsert = TablesInsert<"meta_goals">;

export const GOAL_AREAS = [
  { value: "career", label: "Career", emoji: "💼" },
  { value: "health", label: "Health", emoji: "💪" },
  { value: "finance", label: "Finance", emoji: "💰" },
  { value: "relationships", label: "Relationships", emoji: "❤️" },
  { value: "learning", label: "Learning", emoji: "📚" },
  { value: "creativity", label: "Creativity", emoji: "🎨" },
  { value: "mindfulness", label: "Mindfulness", emoji: "🧘" },
] as const;

export const GOAL_TIMEFRAMES = [
  { value: "yearly", label: "Yearly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "monthly", label: "Monthly" },
] as const;

export const GPS_STATUSES = [
  { value: "not_defined", label: "Not Defined", color: "hsl(var(--muted-foreground))" },
  { value: "planned", label: "Planned", color: "hsl(var(--warning))" },
  { value: "systemized", label: "Systemized", color: "hsl(var(--primary))" },
  { value: "tracking", label: "Tracking", color: "hsl(var(--success))" },
] as const;

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useGoalsByTimeframe(timeframe: string) {
  return useQuery({
    queryKey: ["goals", "timeframe", timeframe],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("timeframe", timeframe)
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as Goal[];
    },
  });
}

export function useGoalWithDetails(goalId: string) {
  return useQuery({
    queryKey: ["goals", goalId, "details"],
    queryFn: async () => {
      const [goalResult, forceFieldsResult, metaGoalsResult] = await Promise.all([
        supabase.from("goals").select("*").eq("id", goalId).single(),
        supabase.from("goal_force_fields").select("*").eq("goal_id", goalId),
        supabase.from("meta_goals").select("*").eq("goal_id", goalId),
      ]);

      if (goalResult.error) throw goalResult.error;

      return {
        goal: goalResult.data as Goal,
        forceFields: (forceFieldsResult.data || []) as ForceField[],
        metaGoals: (metaGoalsResult.data || []) as MetaGoal[],
      };
    },
    enabled: !!goalId,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (goal: GoalInsert) => {
      const { data, error } = await supabase
        .from("goals")
        .insert(goal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created");
    },
    onError: (error) => {
      toast.error("Failed to create goal: " + error.message);
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal updated");
    },
    onError: (error) => {
      toast.error("Failed to update goal: " + error.message);
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete goal: " + error.message);
    },
  });
}

// Force Field mutations
export function useCreateForceField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (forceField: ForceFieldInsert) => {
      const { data, error } = await supabase
        .from("goal_force_fields")
        .insert(forceField)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals", variables.goal_id, "details"] });
      toast.success("Force added");
    },
    onError: (error) => {
      toast.error("Failed to add force: " + error.message);
    },
  });
}

export function useUpdateForceField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ForceField> & { id: string }) => {
      const { data, error } = await supabase
        .from("goal_force_fields")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      toast.error("Failed to update force: " + error.message);
    },
  });
}

export function useDeleteForceField() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goal_force_fields").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      toast.error("Failed to delete force: " + error.message);
    },
  });
}

// Meta Goal mutations
export function useCreateMetaGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (metaGoal: MetaGoalInsert) => {
      const { data, error } = await supabase
        .from("meta_goals")
        .insert(metaGoal)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goals", variables.goal_id, "details"] });
      toast.success("Skill gap added");
    },
    onError: (error) => {
      toast.error("Failed to add skill gap: " + error.message);
    },
  });
}

export function useUpdateMetaGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MetaGoal> & { id: string }) => {
      const { data, error } = await supabase
        .from("meta_goals")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      toast.error("Failed to update skill: " + error.message);
    },
  });
}

export function useDeleteMetaGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meta_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: (error) => {
      toast.error("Failed to delete skill: " + error.message);
    },
  });
}
