
-- Add the missing channel_data column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS channel_data jsonb;

-- Update the GitHub API keys with the real tokens you provided
UPDATE public.github_api_keys 
SET api_token = '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'
WHERE api_token LIKE '%sample%' OR api_token = 'PLACEHOLDER_GITHUB_TOKEN';

-- Update the Netlify API keys with the real tokens you provided  
UPDATE public.netlify_api_keys 
SET api_token = 'nfp_DVwyeAQFZmHcpJcXJYVfhpydzxB18WX755a6'
WHERE api_token LIKE '%sample%' OR api_token = 'PLACEHOLDER_NETLIFY_TOKEN';

-- Also update deployment_tokens table if there are GitHub/Netlify tokens there
UPDATE public.deployment_tokens 
SET token_value = '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'
WHERE provider = 'github' AND (token_value LIKE '%sample%' OR token_value = 'PLACEHOLDER_GITHUB_TOKEN');

UPDATE public.deployment_tokens 
SET token_value = 'nfp_DVwyeAQFZmHcpJcXJYVfhpydzxB18WX755a6'
WHERE provider = 'netlify' AND (token_value LIKE '%sample%' OR token_value = 'PLACEHOLDER_NETLIFY_TOKEN');

-- Ensure the tokens are marked as active
UPDATE public.github_api_keys SET is_active = true;
UPDATE public.netlify_api_keys SET is_active = true;
UPDATE public.deployment_tokens SET is_active = true WHERE provider IN ('github', 'netlify');
