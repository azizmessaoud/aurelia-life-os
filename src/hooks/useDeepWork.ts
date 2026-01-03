import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type DeepWorkSession = {
  id: string;
  project_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  focus_quality: number | null;
  notes: string | null;
  created_at: string;
};

export function useDeepWorkSessions() {
  return useQuery({
    queryKey: ["deep_work_sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deep_work_sessions")
        .select("*, projects(title)")
        .order("start_time", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });
}

export function useActiveSession() {
  return useQuery({
    queryKey: ["deep_work_sessions", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deep_work_sessions")
        .select("*, projects(title)")
        .is("end_time", null)
        .order("start_time", { ascending: false })
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 1000, // Refetch every second to update timer
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId?: string) => {
      const { data, error } = await supabase
        .from("deep_work_sessions")
        .insert({
          project_id: projectId || null,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deep_work_sessions"] });
      toast.success("Deep work session started");
    },
    onError: (error) => {
      toast.error("Failed to start session: " + error.message);
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      focusQuality,
      notes,
    }: {
      id: string;
      focusQuality?: number;
      notes?: string;
    }) => {
      const endTime = new Date();
      const { data: session } = await supabase
        .from("deep_work_sessions")
        .select("start_time")
        .eq("id", id)
        .single();

      const startTime = new Date(session?.start_time || endTime);
      const durationMinutes = Math.round(
        (endTime.getTime() - startTime.getTime()) / 60000
      );

      const { data, error } = await supabase
        .from("deep_work_sessions")
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          focus_quality: focusQuality,
          notes,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["deep_work_sessions"] });
      toast.success(`Session completed: ${data.duration_minutes} minutes`);
    },
    onError: (error) => {
      toast.error("Failed to end session: " + error.message);
    },
  });
}

export function useTodaysDeepWorkMinutes() {
  return useQuery({
    queryKey: ["deep_work_sessions", "today_minutes"],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("deep_work_sessions")
        .select("duration_minutes")
        .gte("start_time", today.toISOString())
        .not("duration_minutes", "is", null);

      if (error) throw error;
      return data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    },
  });
}

export function useWeeklyDeepWorkMinutes() {
  return useQuery({
    queryKey: ["deep_work_sessions", "weekly_minutes"],
    queryFn: async () => {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from("deep_work_sessions")
        .select("duration_minutes")
        .gte("start_time", weekStart.toISOString())
        .not("duration_minutes", "is", null);

      if (error) throw error;
      return data.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    },
  });
}
