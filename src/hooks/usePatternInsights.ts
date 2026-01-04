import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface PatternInsight {
  id: string;
  pattern_type: string;
  title: string;
  description: string;
  confidence: number;
  data: Json;
  is_actionable: boolean;
  action_taken: boolean;
  detected_at: string;
  expires_at: string | null;
  created_at: string;
}

// Get active pattern insights (not expired, not acted upon)
export function useActivePatternInsights() {
  return useQuery({
    queryKey: ["pattern_insights", "active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("pattern_insights")
        .select("*")
        .eq("action_taken", false)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order("confidence", { ascending: false });

      if (error) throw error;
      return data as PatternInsight[];
    },
  });
}

// Get all recent pattern insights
export function useRecentPatternInsights(limit: number = 20) {
  return useQuery({
    queryKey: ["pattern_insights", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pattern_insights")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as PatternInsight[];
    },
  });
}

// Mark insight as acted upon
export function useMarkInsightActedUpon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("pattern_insights")
        .update({ action_taken: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pattern_insights"] });
      toast.success("Insight marked as addressed!");
    },
    onError: (error) => {
      toast.error("Failed to update insight", {
        description: error.message,
      });
    },
  });
}

// Create a pattern insight
export function useCreatePatternInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      pattern_type: string;
      title: string;
      description: string;
      confidence?: number;
      data?: Json;
      is_actionable?: boolean;
      expires_at?: string;
    }) => {
      const { data, error } = await supabase
        .from("pattern_insights")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pattern_insights"] });
    },
    onError: (error) => {
      toast.error("Failed to create insight", {
        description: error.message,
      });
    },
  });
}
