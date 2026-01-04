-- Create academic_courses table
CREATE TABLE public.academic_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  instructor TEXT,
  blackboard_url TEXT,
  credits INTEGER DEFAULT 3,
  semester TEXT NOT NULL DEFAULT 'Spring 2026',
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academic_courses ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (single user app)
CREATE POLICY "Allow all access to academic_courses" 
ON public.academic_courses 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_academic_courses_updated_at
BEFORE UPDATE ON public.academic_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create academic_schedule table
CREATE TABLE public.academic_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.academic_courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  schedule_type TEXT NOT NULL DEFAULT 'lecture',
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  specific_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academic_schedule ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all access to academic_schedule" 
ON public.academic_schedule 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_academic_schedule_updated_at
BEFORE UPDATE ON public.academic_schedule
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create academic_assignments table
CREATE TABLE public.academic_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.academic_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  weight NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  grade NUMERIC,
  max_grade NUMERIC DEFAULT 100,
  submission_url TEXT,
  is_exam BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academic_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all access to academic_assignments" 
ON public.academic_assignments 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_academic_assignments_updated_at
BEFORE UPDATE ON public.academic_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create academic_materials table
CREATE TABLE public.academic_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.academic_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  material_type TEXT NOT NULL DEFAULT 'lecture',
  file_url TEXT,
  description TEXT,
  week_number INTEGER,
  ai_summary TEXT,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.academic_materials ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all access to academic_materials" 
ON public.academic_materials 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create blackboard_sync_logs table
CREATE TABLE public.blackboard_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL DEFAULT 'full',
  status TEXT NOT NULL DEFAULT 'pending',
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blackboard_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all access to blackboard_sync_logs" 
ON public.blackboard_sync_logs 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create storage bucket for academic materials
INSERT INTO storage.buckets (id, name, public) VALUES ('academic-materials', 'academic-materials', false);

-- Create storage policies
CREATE POLICY "Allow all access to academic-materials" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'academic-materials')
WITH CHECK (bucket_id = 'academic-materials');