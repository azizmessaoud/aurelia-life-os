import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subDays } from "date-fns";

export interface HealthScore {
  id: string;
  emotional: number;
  mental: number;
  physical: number;
  spiritual: number;
  hormonal: number;
  overall: number;
  notes: string | null;
  calculated_at: string;
  created_at: string;
}

export interface CreateHealthScoreInput {
  emotional: number;
  mental: number;
  physical: number;
  spiritual: number;
  hormonal: number;
  notes?: string;
}

// Get recent health scores
export function useRecentHealthScores(days: number = 7) {
  return useQuery({
    queryKey: ["health_scores", "recent", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("health_scores")
        .select("*")
        .gte("calculated_at", startDate.toISOString())
        .order("calculated_at", { ascending: false });

      if (error) throw error;
      return data as HealthScore[];
    },
  });
}

// Get latest health score
export function useLatestHealthScore() {
  return useQuery({
    queryKey: ["health_scores", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("health_scores")
        .select("*")
        .order("calculated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as HealthScore | null;
    },
  });
}

// Get health score trends
export function useHealthScoreTrends(days: number = 14) {
  return useQuery({
    queryKey: ["health_scores", "trends", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("health_scores")
        .select("*")
        .gte("calculated_at", startDate.toISOString())
        .order("calculated_at", { ascending: true });

      if (error) throw error;
      return data as HealthScore[];
    },
  });
}

// Create health score
export function useCreateHealthScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHealthScoreInput) => {
      const { data, error } = await supabase
        .from("health_scores")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as HealthScore;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health_scores"] });
      toast.success("Health score logged!", {
        description: "5D health snapshot captured",
      });
    },
    onError: (error) => {
      toast.error("Failed to log health score", {
        description: error.message,
      });
    },
  });
}

// Calculate averages for the 5D scores
export function useHealthAverages(days: number = 7) {
  return useQuery({
    queryKey: ["health_scores", "averages", days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase
        .from("health_scores")
        .select("emotional, mental, physical, spiritual, hormonal, overall")
        .gte("calculated_at", startDate.toISOString());

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10;

      return {
        emotional: avg(data.map(d => d.emotional)),
        mental: avg(data.map(d => d.mental)),
        physical: avg(data.map(d => d.physical)),
        spiritual: avg(data.map(d => d.spiritual)),
        hormonal: avg(data.map(d => d.hormonal)),
        overall: avg(data.map(d => d.overall)),
        count: data.length,
      };
    },
  });
}
