import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { useToast } from "@/hooks/use-toast";

export interface AcademicCourse {
  id: string;
  course_code: string;
  course_name: string;
  instructor: string | null;
  blackboard_url: string | null;
  credits: number;
  semester: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicSchedule {
  id: string;
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location: string | null;
  schedule_type: string;
  is_recurring: boolean;
  specific_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  course?: AcademicCourse;
}

export interface AcademicAssignment {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string;
  weight: number;
  status: string;
  grade: number | null;
  max_grade: number;
  submission_url: string | null;
  is_exam: boolean;
  created_at: string;
  updated_at: string;
  course?: AcademicCourse;
}

export interface AcademicMaterial {
  id: string;
  course_id: string;
  title: string;
  material_type: string;
  file_url: string | null;
  description: string | null;
  week_number: number | null;
  ai_summary: string | null;
  is_processed: boolean;
  created_at: string;
  course?: AcademicCourse;
}

export interface BlackboardSyncLog {
  id: string;
  sync_type: string;
  status: string;
  items_synced: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export function useAcademicCourses() {
  return useQuery({
    queryKey: ["academic-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_courses")
        .select("*")
        .order("course_code");

      if (error) throw error;
      return data as AcademicCourse[];
    },
  });
}

export function useAcademicSchedule() {
  return useQuery({
    queryKey: ["academic-schedule"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_schedule")
        .select(`
          *,
          course:academic_courses(*)
        `)
        .order("day_of_week")
        .order("start_time");

      if (error) throw error;
      return data as AcademicSchedule[];
    },
  });
}

export function useAcademicAssignments() {
  return useQuery({
    queryKey: ["academic-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_assignments")
        .select(`
          *,
          course:academic_courses(*)
        `)
        .order("due_date");

      if (error) throw error;
      return data as AcademicAssignment[];
    },
  });
}

export function useUpcomingAssignments(days: number = 7) {
  return useQuery({
    queryKey: ["upcoming-assignments", days],
    queryFn: async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("academic_assignments")
        .select(`
          *,
          course:academic_courses(*)
        `)
        .gte("due_date", now.toISOString())
        .lte("due_date", futureDate.toISOString())
        .eq("status", "pending")
        .order("due_date");

      if (error) throw error;
      return data as AcademicAssignment[];
    },
  });
}

export function useAcademicMaterials(courseId?: string) {
  return useQuery({
    queryKey: ["academic-materials", courseId],
    queryFn: async () => {
      let query = supabase
        .from("academic_materials")
        .select(`
          *,
          course:academic_courses(*)
        `)
        .order("week_number", { nullsFirst: false })
        .order("created_at", { ascending: false });

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AcademicMaterial[];
    },
  });
}

export function useBlackboardSyncLogs() {
  return useQuery({
    queryKey: ["blackboard-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blackboard_sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as BlackboardSyncLog[];
    },
  });
}

export function useBlackboardSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      blackboardUrl,
      syncType = "full",
      courseUrls,
    }: {
      blackboardUrl: string;
      syncType?: "full" | "schedule" | "assignments" | "materials";
      courseUrls?: string[];
    }) => {
      const result = await firecrawlApi.syncBlackboard(blackboardUrl, syncType, courseUrls);
      if (!result.success) {
        throw new Error(result.error || "Sync failed");
      }
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${(data as { itemsSynced?: number }).itemsSynced || 0} items from Blackboard`,
      });
      // Invalidate all academic queries
      queryClient.invalidateQueries({ queryKey: ["academic-courses"] });
      queryClient.invalidateQueries({ queryKey: ["academic-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["academic-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["academic-materials"] });
      queryClient.invalidateQueries({ queryKey: ["blackboard-sync-logs"] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync from Blackboard",
        variant: "destructive",
      });
    },
  });
}

export function useTodaySchedule() {
  const today = new Date().getDay(); // 0-6, Sunday-Saturday
  
  return useQuery({
    queryKey: ["today-schedule", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_schedule")
        .select(`
          *,
          course:academic_courses(*)
        `)
        .eq("day_of_week", today)
        .eq("is_recurring", true)
        .order("start_time");

      if (error) throw error;
      return data as AcademicSchedule[];
    },
  });
}

// Mutations for adding/editing data manually
export function useAddCourse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (course: { course_code: string; course_name: string; instructor?: string; blackboard_url?: string; credits?: number; semester?: string; color?: string }) => {
      const { data, error } = await supabase
        .from("academic_courses")
        .insert([course])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Course added" });
      queryClient.invalidateQueries({ queryKey: ["academic-courses"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add course",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAddAssignment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignment: { course_id: string; title: string; due_date: string; description?: string; weight?: number; is_exam?: boolean }) => {
      const { data, error } = await supabase
        .from("academic_assignments")
        .insert([assignment])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Assignment added" });
      queryClient.invalidateQueries({ queryKey: ["academic-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-assignments"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateAssignmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, grade }: { id: string; status: string; grade?: number }) => {
      const { error } = await supabase
        .from("academic_assignments")
        .update({ status, grade })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-assignments"] });
    },
  });
}

export function useAddScheduleItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: { course_id: string; day_of_week: number; start_time: string; end_time: string; location?: string; schedule_type?: string }) => {
      const { data, error } = await supabase
        .from("academic_schedule")
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Schedule item added" });
      queryClient.invalidateQueries({ queryKey: ["academic-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["today-schedule"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add schedule item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
