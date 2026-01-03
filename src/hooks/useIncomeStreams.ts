import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type IncomeStream = {
  id: string;
  name: string;
  description: string | null;
  adhd_compatibility: string;
  dopamine_level: string;
  context_switch_minutes: number;
  setup_energy: number;
  maintenance_energy: number;
  realistic_monthly_eur: number | null;
  optimistic_monthly_eur: number | null;
  has_external_deadline: boolean;
  body_double_possible: boolean;
  status: string;
  last_worked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NewIncomeStream = Omit<IncomeStream, "id" | "created_at" | "updated_at">;

export function useIncomeStreams() {
  return useQuery({
    queryKey: ["income_streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_streams")
        .select("*")
        .order("adhd_compatibility", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IncomeStream[];
    },
  });
}

export function useActiveIncomeStreams() {
  return useQuery({
    queryKey: ["income_streams", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_streams")
        .select("*")
        .eq("status", "active")
        .order("adhd_compatibility", { ascending: false });

      if (error) throw error;
      return data as IncomeStream[];
    },
  });
}

export function useQuickWinStreams() {
  return useQuery({
    queryKey: ["income_streams", "quick_wins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_streams")
        .select("*")
        .eq("status", "active")
        .in("adhd_compatibility", ["high", "hyperfocus_gold"])
        .lt("context_switch_minutes", 20)
        .order("realistic_monthly_eur", { ascending: false });

      if (error) throw error;
      return data as IncomeStream[];
    },
  });
}

export function useCreateIncomeStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stream: NewIncomeStream) => {
      const { data, error } = await supabase
        .from("income_streams")
        .insert(stream)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income_streams"] });
      toast.success("Income stream added");
    },
    onError: (error) => {
      toast.error("Failed to add income stream: " + error.message);
    },
  });
}

export function useUpdateIncomeStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IncomeStream> & { id: string }) => {
      const { data, error } = await supabase
        .from("income_streams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income_streams"] });
      toast.success("Income stream updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });
}

export function useDeleteIncomeStream() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_streams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income_streams"] });
      toast.success("Income stream deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
