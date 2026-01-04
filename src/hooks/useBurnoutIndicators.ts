import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subDays } from "date-fns";

export interface BurnoutIndicator {
  id: string;
  indicator_type: string;
  severity: number;
  description: string | null;
  detected_at: string;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

// Get active (unresolved) burnout indicators
export function useActiveBurnoutIndicators() {
  return useQuery({
    queryKey: ["burnout_indicators", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("burnout_indicators")
        .select("*")
        .eq("is_resolved", false)
        .order("severity", { ascending: false });

      if (error) throw error;
      return data as BurnoutIndicator[];
    },
  });
}

// Get recent burnout indicators
export function useRecentBurnoutIndicators(days: number = 14) {
  return useQuery({
    queryKey: ["burnout_indicators", "recent", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("burnout_indicators")
        .select("*")
        .gte("detected_at", startDate.toISOString())
        .order("detected_at", { ascending: false });

      if (error) throw error;
      return data as BurnoutIndicator[];
    },
  });
}

// Calculate burnout risk score (0-100)
export function useBurnoutRiskScore() {
  return useQuery({
    queryKey: ["burnout_indicators", "risk_score"],
    queryFn: async () => {
      // Get active indicators
      const { data: indicators, error: indicatorError } = await supabase
        .from("burnout_indicators")
        .select("severity")
        .eq("is_resolved", false);

      if (indicatorError) throw indicatorError;

      // Get recent mood logs (last 7 days)
      const startDate = subDays(new Date(), 7);
      const { data: moodLogs, error: moodError } = await supabase
        .from("mood_logs")
        .select("energy_level, mood, stress")
        .gte("logged_at", startDate.toISOString());

      if (moodError) throw moodError;

      // Calculate risk from indicators (max 50 points)
      const indicatorRisk = indicators 
        ? Math.min(50, indicators.reduce((sum, i) => sum + i.severity * 10, 0))
        : 0;

      // Calculate risk from mood patterns (max 50 points)
      let moodRisk = 0;
      if (moodLogs && moodLogs.length > 0) {
        const avgEnergy = moodLogs.reduce((sum, m) => sum + m.energy_level, 0) / moodLogs.length;
        const avgMood = moodLogs.reduce((sum, m) => sum + m.mood, 0) / moodLogs.length;
        const avgStress = moodLogs.reduce((sum, m) => sum + m.stress, 0) / moodLogs.length;

        // Low energy/mood + high stress = higher risk
        const energyRisk = Math.max(0, (5 - avgEnergy) * 5);
        const moodRiskPart = Math.max(0, (5 - avgMood) * 5);
        const stressRisk = Math.max(0, (avgStress - 5) * 5);

        moodRisk = Math.min(50, energyRisk + moodRiskPart + stressRisk);
      }

      const totalRisk = Math.round(indicatorRisk + moodRisk);

      return {
        score: Math.min(100, totalRisk),
        level: totalRisk < 25 ? "low" : totalRisk < 50 ? "moderate" : totalRisk < 75 ? "elevated" : "critical",
        indicatorCount: indicators?.length || 0,
        moodDataPoints: moodLogs?.length || 0,
      };
    },
  });
}

// Resolve a burnout indicator
export function useResolveBurnoutIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("burnout_indicators")
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["burnout_indicators"] });
      toast.success("Indicator resolved!");
    },
    onError: (error) => {
      toast.error("Failed to resolve indicator", {
        description: error.message,
      });
    },
  });
}

// Create a burnout indicator
export function useCreateBurnoutIndicator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { indicator_type: string; severity: number; description?: string }) => {
      const { data, error } = await supabase
        .from("burnout_indicators")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["burnout_indicators"] });
    },
    onError: (error) => {
      toast.error("Failed to create indicator", {
        description: error.message,
      });
    },
  });
}
