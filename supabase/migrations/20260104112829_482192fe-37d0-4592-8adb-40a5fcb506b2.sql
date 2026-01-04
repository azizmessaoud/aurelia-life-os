-- Create health_scores table for 5D health tracking
CREATE TABLE public.health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emotional INTEGER NOT NULL DEFAULT 5 CHECK (emotional >= 1 AND emotional <= 10),
  mental INTEGER NOT NULL DEFAULT 5 CHECK (mental >= 1 AND mental <= 10),
  physical INTEGER NOT NULL DEFAULT 5 CHECK (physical >= 1 AND physical <= 10),
  spiritual INTEGER NOT NULL DEFAULT 5 CHECK (spiritual >= 1 AND spiritual <= 10),
  hormonal INTEGER NOT NULL DEFAULT 5 CHECK (hormonal >= 1 AND hormonal <= 10),
  overall INTEGER GENERATED ALWAYS AS (ROUND((emotional + mental + physical + spiritual + hormonal) / 5.0)::INTEGER) STORED,
  notes TEXT,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (single user app)
CREATE POLICY "Allow all access to health_scores" ON public.health_scores
  FOR ALL USING (true) WITH CHECK (true);

-- Create burnout_indicators table for trajectory tracking
CREATE TABLE public.burnout_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  indicator_type TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  description TEXT,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.burnout_indicators ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (single user app)
CREATE POLICY "Allow all access to burnout_indicators" ON public.burnout_indicators
  FOR ALL USING (true) WITH CHECK (true);

-- Create pattern_insights table to store detected patterns
CREATE TABLE public.pattern_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  data JSONB,
  is_actionable BOOLEAN NOT NULL DEFAULT true,
  action_taken BOOLEAN NOT NULL DEFAULT false,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pattern_insights ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (single user app)
CREATE POLICY "Allow all access to pattern_insights" ON public.pattern_insights
  FOR ALL USING (true) WITH CHECK (true);