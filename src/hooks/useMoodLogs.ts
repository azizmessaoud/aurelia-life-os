import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subDays, startOfDay, endOfDay } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

export interface MoodLog {
  id: string;
  logged_at: string;
  energy_level: number;
  mood: number;
  stress: number;
  notes: string | null;
  trigger: string | null;
  location: string | null;
  context: Json | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMoodLogInput {
  energy_level: number;
  mood: number;
  stress: number;
  notes?: string;
  trigger?: string;
  location?: string;
  context?: Json;
}

// Get recent mood logs (last 7 days by default)
export function useRecentMoodLogs(days: number = 7) {
  return useQuery({
    queryKey: ["mood_logs", "recent", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .gte("logged_at", startDate.toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data as MoodLog[];
    },
  });
}

// Get today's mood logs
export function useTodaysMoodLogs() {
  return useQuery({
    queryKey: ["mood_logs", "today"],
    queryFn: async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .gte("logged_at", startOfDay(today).toISOString())
        .lte("logged_at", endOfDay(today).toISOString())
        .order("logged_at", { ascending: false });

      if (error) throw error;
      return data as MoodLog[];
    },
  });
}

// Get average energy for the last N days
export function useAverageEnergy(days: number = 7) {
  return useQuery({
    queryKey: ["mood_logs", "average_energy", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("mood_logs")
        .select("energy_level")
        .gte("logged_at", startDate.toISOString());

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const avg = data.reduce((sum, log) => sum + log.energy_level, 0) / data.length;
      return Math.round(avg * 10) / 10;
    },
  });
}

// Get the latest mood log
export function useLatestMoodLog() {
  return useQuery({
    queryKey: ["mood_logs", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_logs")
        .select("*")
        .order("logged_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as MoodLog | null;
    },
  });
}

// Create a new mood log
export function useCreateMoodLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateMoodLogInput) => {
      const { data, error } = await supabase
        .from("mood_logs")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as MoodLog;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood_logs"] });
      toast.success("Mood logged!", {
        description: "Keep tracking for better insights",
      });
    },
    onError: (error) => {
      toast.error("Failed to log mood", {
        description: error.message,
      });
    },
  });
}

// Get daily averages for trend chart
export function useMoodTrends(days: number = 7) {
  return useQuery({
    queryKey: ["mood_logs", "trends", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("mood_logs")
        .select("logged_at, energy_level, mood, stress")
        .gte("logged_at", startDate.toISOString())
        .order("logged_at", { ascending: true });

      if (error) throw error;
      
      // Group by day and calculate averages
      const dailyData: Record<string, { energy: number[]; mood: number[]; stress: number[] }> = {};
      
      (data as MoodLog[]).forEach((log) => {
        const date = new Date(log.logged_at).toISOString().split("T")[0];
        if (!dailyData[date]) {
          dailyData[date] = { energy: [], mood: [], stress: [] };
        }
        dailyData[date].energy.push(log.energy_level);
        dailyData[date].mood.push(log.mood);
        dailyData[date].stress.push(log.stress);
      });

      return Object.entries(dailyData).map(([date, values]) => ({
        date,
        energy: Math.round(values.energy.reduce((a, b) => a + b, 0) / values.energy.length * 10) / 10,
        mood: Math.round(values.mood.reduce((a, b) => a + b, 0) / values.mood.length * 10) / 10,
        stress: Math.round(values.stress.reduce((a, b) => a + b, 0) / values.stress.length * 10) / 10,
      }));
    },
  });
}
