
-- Create the project_verification_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.project_verification_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_url TEXT,
  contact_email TEXT NOT NULL,
  website_description TEXT NOT NULL,
  channel_verification TEXT,
  additional_info TEXT,
  project_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_type TEXT NOT NULL DEFAULT 'youtube_website',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_verification_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.project_verification_requests;
DROP POLICY IF EXISTS "Users can create their own verification requests" ON public.project_verification_requests;
DROP POLICY IF EXISTS "Users can update their own verification requests" ON public.project_verification_requests;

-- Create policies (without IF NOT EXISTS as it's not supported for policies)
CREATE POLICY "Users can view their own verification requests" 
  ON public.project_verification_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification requests" 
  ON public.project_verification_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification requests" 
  ON public.project_verification_requests 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add verified column to projects table if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.project_verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.project_verification_requests(status);
