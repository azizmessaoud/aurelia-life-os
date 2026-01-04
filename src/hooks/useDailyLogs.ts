import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";

export type DailyLog = {
  id: string;
  log_date: string;
  hours_coded: number | null;
  workouts_done: number | null;
  tasks_completed: number | null;
  revenue_earned: number | null;
  deep_work_minutes: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewDailyLog = Omit<DailyLog, "id" | "created_at" | "updated_at">;

export function useTodaysLog() {
  const today = format(new Date(), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["daily_logs", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("log_date", today)
        .maybeSingle();

      if (error) throw error;
      return data as DailyLog | null;
    },
  });
}

export function useWeekLogs() {
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["daily_logs", "week", weekStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .gte("log_date", weekStart)
        .lte("log_date", weekEnd)
        .order("log_date", { ascending: true });

      if (error) throw error;
      return data as DailyLog[];
    },
  });
}

export function useRecentLogs(days: number = 30) {
  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");
  
  return useQuery({
    queryKey: ["daily_logs", "recent", days],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .gte("log_date", startDate)
        .lte("log_date", endDate)
        .order("log_date", { ascending: false });

      if (error) throw error;
      return data as DailyLog[];
    },
  });
}

export function useUpsertDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: Partial<NewDailyLog> & { log_date: string }) => {
      const { data, error } = await supabase
        .from("daily_logs")
        .upsert(log, { onConflict: "log_date" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
      toast.success("Daily log updated");
    },
    onError: (error) => {
      toast.error("Failed to update log: " + error.message);
    },
  });
}

export function useDeleteDailyLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
      toast.success("Daily log deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete log: " + error.message);
    },
  });
}

// Aggregation helpers
export function useWeeklyStats() {
  const { data: weekLogs = [] } = useWeekLogs();
  
  return {
    totalHoursCoded: weekLogs.reduce((sum, log) => sum + (log.hours_coded || 0), 0),
    totalWorkouts: weekLogs.reduce((sum, log) => sum + (log.workouts_done || 0), 0),
    totalTasks: weekLogs.reduce((sum, log) => sum + (log.tasks_completed || 0), 0),
    totalRevenue: weekLogs.reduce((sum, log) => sum + (log.revenue_earned || 0), 0),
    totalDeepWorkMinutes: weekLogs.reduce((sum, log) => sum + (log.deep_work_minutes || 0), 0),
    daysLogged: weekLogs.length,
  };
}
