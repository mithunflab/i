
-- Fix project_verification_requests table to match component expectations
ALTER TABLE public.project_verification_requests 
ADD COLUMN IF NOT EXISTS project_name TEXT,
ADD COLUMN IF NOT EXISTS project_url TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS website_description TEXT,
ADD COLUMN IF NOT EXISTS channel_verification TEXT,
ADD COLUMN IF NOT EXISTS additional_info TEXT,
ADD COLUMN IF NOT EXISTS project_data JSONB,
ADD COLUMN IF NOT EXISTS verification_type TEXT DEFAULT 'youtube_website';

-- Update existing records to have default values
UPDATE public.project_verification_requests 
SET 
  project_name = COALESCE(project_name, 'Unnamed Project'),
  verification_type = COALESCE(verification_type, 'youtube_website')
WHERE project_name IS NULL OR verification_type IS NULL;
