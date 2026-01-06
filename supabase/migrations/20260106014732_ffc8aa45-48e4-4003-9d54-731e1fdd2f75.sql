-- Create gps_blueprints table for storing GPS coaching sessions and blueprints
CREATE TABLE public.gps_blueprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_title TEXT NOT NULL,
  blueprint_markdown TEXT,
  coaching_history JSONB DEFAULT '[]'::jsonb,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.gps_blueprints ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own gps_blueprints"
ON public.gps_blueprints
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gps_blueprints_updated_at
BEFORE UPDATE ON public.gps_blueprints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_gps_blueprints_user_id ON public.gps_blueprints(user_id);
CREATE INDEX idx_gps_blueprints_status ON public.gps_blueprints(status);