-- Add opportunity_type column to income_streams table
ALTER TABLE public.income_streams
ADD COLUMN opportunity_type TEXT NOT NULL DEFAULT 'income';

-- Add application_deadline for scholarships/certs
ALTER TABLE public.income_streams
ADD COLUMN application_deadline TIMESTAMP WITH TIME ZONE;

-- Add requirements field
ALTER TABLE public.income_streams
ADD COLUMN requirements TEXT;

-- Add url for opportunity links
ALTER TABLE public.income_streams
ADD COLUMN url TEXT;

-- Add estimated_hours for time commitment
ALTER TABLE public.income_streams
ADD COLUMN estimated_hours INTEGER;

-- Rename table to opportunities for clarity
ALTER TABLE public.income_streams RENAME TO opportunities;