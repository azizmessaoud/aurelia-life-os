export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_assignments: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          due_date: string
          grade: number | null
          id: string
          is_exam: boolean
          max_grade: number | null
          status: string
          submission_url: string | null
          title: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          due_date: string
          grade?: number | null
          id?: string
          is_exam?: boolean
          max_grade?: number | null
          status?: string
          submission_url?: string | null
          title: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          grade?: number | null
          id?: string
          is_exam?: boolean
          max_grade?: number | null
          status?: string
          submission_url?: string | null
          title?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academic_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_courses: {
        Row: {
          blackboard_url: string | null
          color: string | null
          course_code: string
          course_name: string
          created_at: string
          credits: number | null
          id: string
          instructor: string | null
          semester: string
          updated_at: string
        }
        Insert: {
          blackboard_url?: string | null
          color?: string | null
          course_code: string
          course_name: string
          created_at?: string
          credits?: number | null
          id?: string
          instructor?: string | null
          semester?: string
          updated_at?: string
        }
        Update: {
          blackboard_url?: string | null
          color?: string | null
          course_code?: string
          course_name?: string
          created_at?: string
          credits?: number | null
          id?: string
          instructor?: string | null
          semester?: string
          updated_at?: string
        }
        Relationships: []
      }
      academic_materials: {
        Row: {
          ai_summary: string | null
          course_id: string
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_processed: boolean
          material_type: string
          title: string
          week_number: number | null
        }
        Insert: {
          ai_summary?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_processed?: boolean
          material_type?: string
          title: string
          week_number?: number | null
        }
        Update: {
          ai_summary?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_processed?: boolean
          material_type?: string
          title?: string
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_materials_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academic_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_schedule: {
        Row: {
          course_id: string
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_recurring: boolean
          location: string | null
          notes: string | null
          schedule_type: string
          specific_date: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_recurring?: boolean
          location?: string | null
          notes?: string | null
          schedule_type?: string
          specific_date?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_recurring?: boolean
          location?: string | null
          notes?: string | null
          schedule_type?: string
          specific_date?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academic_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      blackboard_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          items_synced: number | null
          started_at: string
          status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
        }
        Relationships: []
      }
      burnout_indicators: {
        Row: {
          created_at: string
          description: string | null
          detected_at: string
          id: string
          indicator_type: string
          is_resolved: boolean
          resolved_at: string | null
          severity: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          indicator_type: string
          is_resolved?: boolean
          resolved_at?: string | null
          severity?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          indicator_type?: string
          is_resolved?: boolean
          resolved_at?: string | null
          severity?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          graph_context: Json | null
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          graph_context?: Json | null
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          graph_context?: Json | null
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          deep_work_minutes: number | null
          hours_coded: number | null
          id: string
          log_date: string
          notes: string | null
          revenue_earned: number | null
          tasks_completed: number | null
          updated_at: string
          workouts_done: number | null
        }
        Insert: {
          created_at?: string
          deep_work_minutes?: number | null
          hours_coded?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          revenue_earned?: number | null
          tasks_completed?: number | null
          updated_at?: string
          workouts_done?: number | null
        }
        Update: {
          created_at?: string
          deep_work_minutes?: number | null
          hours_coded?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          revenue_earned?: number | null
          tasks_completed?: number | null
          updated_at?: string
          workouts_done?: number | null
        }
        Relationships: []
      }
      deep_work_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          end_time: string | null
          focus_quality: number | null
          id: string
          notes: string | null
          project_id: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          focus_quality?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          start_time?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          end_time?: string | null
          focus_quality?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "deep_work_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_force_fields: {
        Row: {
          counter_move: string | null
          created_at: string
          description: string
          force_type: string
          goal_id: string
          id: string
          is_addressed: boolean
          strength: number
          updated_at: string
        }
        Insert: {
          counter_move?: string | null
          created_at?: string
          description: string
          force_type: string
          goal_id: string
          id?: string
          is_addressed?: boolean
          strength?: number
          updated_at?: string
        }
        Update: {
          counter_move?: string | null
          created_at?: string
          description?: string
          force_type?: string
          goal_id?: string
          id?: string
          is_addressed?: boolean
          strength?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_force_fields_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          anti_goals: string | null
          area: string
          created_at: string
          current_value: number | null
          deadline: string | null
          gps_status: string
          id: string
          metric_name: string | null
          priority: number
          target_value: number | null
          timeframe: string
          title: string
          updated_at: string
          why_driver: string | null
        }
        Insert: {
          anti_goals?: string | null
          area?: string
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          gps_status?: string
          id?: string
          metric_name?: string | null
          priority?: number
          target_value?: number | null
          timeframe?: string
          title: string
          updated_at?: string
          why_driver?: string | null
        }
        Update: {
          anti_goals?: string | null
          area?: string
          created_at?: string
          current_value?: number | null
          deadline?: string | null
          gps_status?: string
          id?: string
          metric_name?: string | null
          priority?: number
          target_value?: number | null
          timeframe?: string
          title?: string
          updated_at?: string
          why_driver?: string | null
        }
        Relationships: []
      }
      health_scores: {
        Row: {
          calculated_at: string
          created_at: string
          emotional: number
          hormonal: number
          id: string
          mental: number
          notes: string | null
          overall: number | null
          physical: number
          spiritual: number
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          emotional?: number
          hormonal?: number
          id?: string
          mental?: number
          notes?: string | null
          overall?: number | null
          physical?: number
          spiritual?: number
        }
        Update: {
          calculated_at?: string
          created_at?: string
          emotional?: number
          hormonal?: number
          id?: string
          mental?: number
          notes?: string | null
          overall?: number | null
          physical?: number
          spiritual?: number
        }
        Relationships: []
      }
      knowledge_entities: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          entity_type: string
          frequency: number | null
          id: string
          importance: number | null
          last_mentioned: string | null
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          entity_type: string
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          entity_type?: string
          frequency?: number | null
          id?: string
          importance?: number | null
          last_mentioned?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_relationships: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          relationship_type: string
          source_id: string
          strength: number | null
          target_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type: string
          source_id: string
          strength?: number | null
          target_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string
          source_id?: string
          strength?: number | null
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_relationships_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_relationships_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "knowledge_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_goals: {
        Row: {
          created_at: string
          current_level: number
          goal_id: string
          id: string
          practice_system: string | null
          required_level: number
          skill_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          goal_id: string
          id?: string
          practice_system?: string | null
          required_level?: number
          skill_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_level?: number
          goal_id?: string
          id?: string
          practice_system?: string | null
          required_level?: number
          skill_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meta_goals_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_logs: {
        Row: {
          context: Json | null
          created_at: string
          energy_level: number
          id: string
          location: string | null
          logged_at: string
          mood: number
          notes: string | null
          stress: number
          trigger: string | null
          updated_at: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          energy_level: number
          id?: string
          location?: string | null
          logged_at?: string
          mood: number
          notes?: string | null
          stress: number
          trigger?: string | null
          updated_at?: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          energy_level?: number
          id?: string
          location?: string | null
          logged_at?: string
          mood?: number
          notes?: string | null
          stress?: number
          trigger?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          adhd_compatibility: string
          application_deadline: string | null
          body_double_possible: boolean
          context_switch_minutes: number
          created_at: string
          description: string | null
          dopamine_level: string
          estimated_hours: number | null
          has_external_deadline: boolean
          id: string
          last_worked_at: string | null
          maintenance_energy: number
          name: string
          opportunity_type: string
          optimistic_monthly_eur: number | null
          realistic_monthly_eur: number | null
          requirements: string | null
          setup_energy: number
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          adhd_compatibility?: string
          application_deadline?: string | null
          body_double_possible?: boolean
          context_switch_minutes?: number
          created_at?: string
          description?: string | null
          dopamine_level?: string
          estimated_hours?: number | null
          has_external_deadline?: boolean
          id?: string
          last_worked_at?: string | null
          maintenance_energy?: number
          name: string
          opportunity_type?: string
          optimistic_monthly_eur?: number | null
          realistic_monthly_eur?: number | null
          requirements?: string | null
          setup_energy?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          adhd_compatibility?: string
          application_deadline?: string | null
          body_double_possible?: boolean
          context_switch_minutes?: number
          created_at?: string
          description?: string | null
          dopamine_level?: string
          estimated_hours?: number | null
          has_external_deadline?: boolean
          id?: string
          last_worked_at?: string | null
          maintenance_energy?: number
          name?: string
          opportunity_type?: string
          optimistic_monthly_eur?: number | null
          realistic_monthly_eur?: number | null
          requirements?: string | null
          setup_energy?: number
          status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      pattern_insights: {
        Row: {
          action_taken: boolean
          confidence: number
          created_at: string
          data: Json | null
          description: string
          detected_at: string
          expires_at: string | null
          id: string
          is_actionable: boolean
          pattern_type: string
          title: string
        }
        Insert: {
          action_taken?: boolean
          confidence?: number
          created_at?: string
          data?: Json | null
          description: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_actionable?: boolean
          pattern_type: string
          title: string
        }
        Update: {
          action_taken?: boolean
          confidence?: number
          created_at?: string
          data?: Json | null
          description?: string
          detected_at?: string
          expires_at?: string | null
          id?: string
          is_actionable?: boolean
          pattern_type?: string
          title?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          domain: string
          goal_id: string | null
          id: string
          priority: number
          progress: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string
          goal_id?: string | null
          id?: string
          priority?: number
          progress?: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          domain?: string
          goal_id?: string | null
          id?: string
          priority?: number
          progress?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_capacity: {
        Row: {
          actual_hours: number
          created_at: string
          id: string
          notes: string | null
          planned_hours: number
          revenue_this_week: number | null
          updated_at: string
          week_start: string
          what_failed: string | null
          what_worked: string | null
        }
        Insert: {
          actual_hours?: number
          created_at?: string
          id?: string
          notes?: string | null
          planned_hours?: number
          revenue_this_week?: number | null
          updated_at?: string
          week_start: string
          what_failed?: string | null
          what_worked?: string | null
        }
        Update: {
          actual_hours?: number
          created_at?: string
          id?: string
          notes?: string | null
          planned_hours?: number
          revenue_this_week?: number | null
          updated_at?: string
          week_start?: string
          what_failed?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
