
-- Fix the projects table to add the missing channel_data column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS channel_data jsonb;

-- Update the projects table to use proper UUID for id column (ensure it's UUID type)
-- The id column should already be UUID, but let's make sure it has proper constraints
ALTER TABLE public.projects 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Ensure project_chat_history has proper UUID handling for project_id
-- We need to change project_id from text to UUID to match projects.id
ALTER TABLE public.project_chat_history 
ALTER COLUMN project_id TYPE uuid USING project_id::uuid;

-- Add foreign key constraint to ensure data integrity
ALTER TABLE public.project_chat_history 
ADD CONSTRAINT fk_project_chat_history_project_id 
FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;

-- Update API keys tables with better sample data structure
-- Clear existing sample tokens and prepare for real tokens
UPDATE public.github_api_keys 
SET api_token = 'PLACEHOLDER_GITHUB_TOKEN' 
WHERE api_token LIKE '%sample%';

UPDATE public.netlify_api_keys 
SET api_token = 'PLACEHOLDER_NETLIFY_TOKEN' 
WHERE api_token LIKE '%sample%';
