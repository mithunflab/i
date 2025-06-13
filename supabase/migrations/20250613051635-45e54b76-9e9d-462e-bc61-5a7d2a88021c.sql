
-- Add missing response_message column to project_verification_requests table
ALTER TABLE public.project_verification_requests 
ADD COLUMN IF NOT EXISTS response_message TEXT;
