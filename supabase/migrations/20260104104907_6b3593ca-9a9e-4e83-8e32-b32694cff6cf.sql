-- Goals table for GPS system
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'career',
  timeframe TEXT NOT NULL DEFAULT 'yearly',
  metric_name TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  why_driver TEXT,
  anti_goals TEXT,
  gps_status TEXT NOT NULL DEFAULT 'not_defined',
  priority INTEGER NOT NULL DEFAULT 5,
  deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Force field analysis for each goal
CREATE TABLE public.goal_force_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  force_type TEXT NOT NULL CHECK (force_type IN ('driver', 'barrier')),
  description TEXT NOT NULL,
  strength INTEGER NOT NULL DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  counter_move TEXT,
  is_addressed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meta-goals track skill gaps that need to be closed
CREATE TABLE public.meta_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  required_level INTEGER NOT NULL DEFAULT 5,
  current_level INTEGER NOT NULL DEFAULT 1,
  practice_system TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Daily tracking logs for metrics
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours_coded NUMERIC DEFAULT 0,
  workouts_done INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  revenue_earned NUMERIC DEFAULT 0,
  deep_work_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(log_date)
);

-- Add goal_id to projects
ALTER TABLE public.projects ADD COLUMN goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- Enable RLS on all new tables
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_force_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies (allowing all access for now, matching existing pattern)
CREATE POLICY "Allow all access to goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to goal_force_fields" ON public.goal_force_fields FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to meta_goals" ON public.meta_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_logs" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goal_force_fields_updated_at
  BEFORE UPDATE ON public.goal_force_fields
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meta_goals_updated_at
  BEFORE UPDATE ON public.meta_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at
  BEFORE UPDATE ON public.daily_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_goals_area ON public.goals(area);
CREATE INDEX idx_goals_timeframe ON public.goals(timeframe);
CREATE INDEX idx_goals_gps_status ON public.goals(gps_status);
CREATE INDEX idx_goal_force_fields_goal_id ON public.goal_force_fields(goal_id);
CREATE INDEX idx_meta_goals_goal_id ON public.meta_goals(goal_id);
CREATE INDEX idx_daily_logs_log_date ON public.daily_logs(log_date);
CREATE INDEX idx_projects_goal_id ON public.projects(goal_id);