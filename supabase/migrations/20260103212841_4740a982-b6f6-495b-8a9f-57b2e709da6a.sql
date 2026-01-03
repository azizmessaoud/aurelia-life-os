-- AURELIA MVP Database Schema

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL DEFAULT 'freelance' CHECK (domain IN ('exam', 'freelance', 'learning', 'health', 'startup', 'personal')),
  deadline TIMESTAMPTZ,
  priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deep work sessions table
CREATE TABLE public.deep_work_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  focus_quality INTEGER CHECK (focus_quality >= 1 AND focus_quality <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Weekly capacity table
CREATE TABLE public.weekly_capacity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  planned_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  actual_hours NUMERIC(5,2) NOT NULL DEFAULT 0,
  what_worked TEXT,
  what_failed TEXT,
  revenue_this_week NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);

-- Income streams table (ADHD-adjusted)
CREATE TABLE public.income_streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  adhd_compatibility TEXT NOT NULL DEFAULT 'medium' CHECK (adhd_compatibility IN ('hell_no', 'low', 'medium', 'high', 'hyperfocus_gold')),
  dopamine_level TEXT NOT NULL DEFAULT 'neutral' CHECK (dopamine_level IN ('boring_af', 'low', 'neutral', 'interesting', 'obsession_worthy')),
  context_switch_minutes INTEGER NOT NULL DEFAULT 15,
  setup_energy INTEGER NOT NULL DEFAULT 5 CHECK (setup_energy >= 1 AND setup_energy <= 10),
  maintenance_energy INTEGER NOT NULL DEFAULT 5 CHECK (maintenance_energy >= 1 AND maintenance_energy <= 10),
  realistic_monthly_eur NUMERIC(10,2) DEFAULT 0,
  optimistic_monthly_eur NUMERIC(10,2) DEFAULT 0,
  has_external_deadline BOOLEAN NOT NULL DEFAULT false,
  body_double_possible BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'abandoned')),
  last_worked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow all operations since single-user)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deep_work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create public access policies (single-user app, no auth needed)
CREATE POLICY "Allow all access to projects" ON public.projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to deep_work_sessions" ON public.deep_work_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to weekly_capacity" ON public.weekly_capacity FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to income_streams" ON public.income_streams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_weekly_capacity_updated_at
  BEFORE UPDATE ON public.weekly_capacity
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_income_streams_updated_at
  BEFORE UPDATE ON public.income_streams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;