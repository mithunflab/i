
-- Add plan_tier column to api_tokens table
ALTER TABLE public.api_tokens ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';

-- Create index for plan_tier
CREATE INDEX IF NOT EXISTS idx_api_tokens_plan_tier ON public.api_tokens(plan_tier);

-- Insert some sample OpenRouter models for different plan tiers
INSERT INTO public.api_tokens (user_id, name, token_value, provider, token_type, plan_tier, description, is_active)
SELECT 
    auth.uid(),
    'Sample OpenRouter Free Models',
    'sample-token-replace-with-real',
    'OpenRouter',
    'api',
    'free',
    'Free tier OpenRouter models for testing',
    false
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;
