import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OpportunityType = "income" | "scholarship" | "volunteering" | "certification";

export type Opportunity = {
  id: string;
  name: string;
  description: string | null;
  opportunity_type: OpportunityType;
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
  application_deadline: string | null;
  requirements: string | null;
  url: string | null;
  estimated_hours: number | null;
  created_at: string;
  updated_at: string;
};

export type NewOpportunity = Omit<Opportunity, "id" | "created_at" | "updated_at">;

export function useOpportunities(typeFilter?: OpportunityType | "all") {
  return useQuery({
    queryKey: ["opportunities", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("opportunities")
        .select("*")
        .order("adhd_compatibility", { ascending: false })
        .order("created_at", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("opportunity_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useActiveOpportunities(typeFilter?: OpportunityType | "all") {
  return useQuery({
    queryKey: ["opportunities", "active", typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .order("adhd_compatibility", { ascending: false });

      if (typeFilter && typeFilter !== "all") {
        query = query.eq("opportunity_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useQuickWinOpportunities() {
  return useQuery({
    queryKey: ["opportunities", "quick_wins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .in("adhd_compatibility", ["high", "hyperfocus_gold"])
        .lt("context_switch_minutes", 20)
        .order("realistic_monthly_eur", { ascending: false });

      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useUpcomingDeadlines() {
  return useQuery({
    queryKey: ["opportunities", "upcoming_deadlines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("status", "active")
        .not("application_deadline", "is", null)
        .order("application_deadline", { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Opportunity[];
    },
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (opportunity: NewOpportunity) => {
      const { data, error } = await supabase
        .from("opportunities")
        .insert(opportunity)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity added");
    },
    onError: (error) => {
      toast.error("Failed to add opportunity: " + error.message);
    },
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Opportunity> & { id: string }) => {
      const { data, error } = await supabase
        .from("opportunities")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity updated");
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete: " + error.message);
    },
  });
}
