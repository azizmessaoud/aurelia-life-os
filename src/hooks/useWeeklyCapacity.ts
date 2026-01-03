import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfWeek, format } from "date-fns";

export type WeeklyCapacity = {
  id: string;
  week_start: string;
  planned_hours: number;
  actual_hours: number;
  what_worked: string | null;
  what_failed: string | null;
  revenue_this_week: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function getWeekStartDate(date: Date = new Date()): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), "yyyy-MM-dd");
}

export function useWeeklyCapacityHistory() {
  return useQuery({
    queryKey: ["weekly_capacity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_capacity")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as WeeklyCapacity[];
    },
  });
}

export function useCurrentWeekCapacity() {
  const weekStart = getWeekStartDate();

  return useQuery({
    queryKey: ["weekly_capacity", weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_capacity")
        .select("*")
        .eq("week_start", weekStart)
        .maybeSingle();

      if (error) throw error;
      return data as WeeklyCapacity | null;
    },
  });
}

export function useUpsertWeeklyCapacity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (capacity: Partial<WeeklyCapacity> & { week_start: string }) => {
      const { data, error } = await supabase
        .from("weekly_capacity")
        .upsert(capacity, { onConflict: "week_start" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weekly_capacity"] });
      toast.success("Capacity updated");
    },
    onError: (error) => {
      toast.error("Failed to update capacity: " + error.message);
    },
  });
}

export function useADHDTaxAverage() {
  return useQuery({
    queryKey: ["weekly_capacity", "adhd_tax_average"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_capacity")
        .select("planned_hours, actual_hours")
        .order("week_start", { ascending: false })
        .limit(8);

      if (error) throw error;

      if (!data || data.length === 0) return null;

      const taxes = data
        .filter((w) => w.planned_hours > 0)
        .map((w) => {
          const tax = 1 - w.actual_hours / w.planned_hours;
          return Math.max(0, Math.min(1, tax)) * 100;
        });

      if (taxes.length === 0) return null;
      return taxes.reduce((a, b) => a + b, 0) / taxes.length;
    },
  });
}
