-- Create mood_logs table for ADHD energy tracking
CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Core metrics (1-10 scale)
  energy_level INT NOT NULL CHECK (energy_level >= 1 AND energy_level <= 10),
  mood INT NOT NULL CHECK (mood >= 1 AND mood <= 10),
  stress INT NOT NULL CHECK (stress >= 1 AND stress <= 10),
  
  -- Context
  notes TEXT,
  trigger TEXT, -- "coffee crash", "got feedback", "slept well", "procrastinating"
  location TEXT, -- "home", "library", "cafe", "class"
  context JSONB, -- {"task_attempted": "AWS Study", "music": "brain.fm", "body_double": false}
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access (single user app for now)
CREATE POLICY "Allow all access to mood_logs"
ON public.mood_logs
FOR ALL
USING (true)
WITH CHECK (true);

-- Index for efficient querying by date
CREATE INDEX idx_mood_logs_logged_at ON public.mood_logs(logged_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_mood_logs_updated_at
  BEFORE UPDATE ON public.mood_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();