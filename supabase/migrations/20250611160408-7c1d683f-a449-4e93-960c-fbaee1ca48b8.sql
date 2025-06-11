
-- Create separate tables for each API provider
CREATE TABLE IF NOT EXISTS public.youtube_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    quota_used INTEGER DEFAULT 0,
    quota_limit INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.openrouter_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    credits_used NUMERIC DEFAULT 0,
    credits_limit NUMERIC DEFAULT 100,
    requests_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.github_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_token TEXT NOT NULL,
    rate_limit_used INTEGER DEFAULT 0,
    rate_limit_limit INTEGER DEFAULT 5000,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.netlify_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_token TEXT NOT NULL,
    deployments_count INTEGER DEFAULT 0,
    deployments_limit INTEGER DEFAULT 300,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS public.api_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('youtube', 'openrouter', 'github', 'netlify')),
    api_key_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd NUMERIC DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_youtube_api_keys_user_id ON public.youtube_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_api_keys_active ON public.youtube_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_openrouter_api_keys_user_id ON public.openrouter_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_openrouter_api_keys_active ON public.openrouter_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_github_api_keys_user_id ON public.github_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_github_api_keys_active ON public.github_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_netlify_api_keys_user_id ON public.netlify_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_netlify_api_keys_active ON public.netlify_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_id ON public.api_usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_provider ON public.api_usage_tracking(provider);

-- Enable RLS on all tables
ALTER TABLE public.youtube_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openrouter_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netlify_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for youtube_api_keys
CREATE POLICY "Users can view their own YouTube API keys" ON public.youtube_api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own YouTube API keys" ON public.youtube_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own YouTube API keys" ON public.youtube_api_keys
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own YouTube API keys" ON public.youtube_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for openrouter_api_keys
CREATE POLICY "Users can view their own OpenRouter API keys" ON public.openrouter_api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own OpenRouter API keys" ON public.openrouter_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own OpenRouter API keys" ON public.openrouter_api_keys
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own OpenRouter API keys" ON public.openrouter_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for github_api_keys
CREATE POLICY "Users can view their own GitHub API keys" ON public.github_api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own GitHub API keys" ON public.github_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own GitHub API keys" ON public.github_api_keys
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own GitHub API keys" ON public.github_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for netlify_api_keys
CREATE POLICY "Users can view their own Netlify API keys" ON public.netlify_api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own Netlify API keys" ON public.netlify_api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own Netlify API keys" ON public.netlify_api_keys
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own Netlify API keys" ON public.netlify_api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for api_usage_tracking
CREATE POLICY "Users can view their own API usage" ON public.api_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own API usage" ON public.api_usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER set_updated_at_youtube_api_keys
    BEFORE UPDATE ON public.youtube_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_openrouter_api_keys
    BEFORE UPDATE ON public.openrouter_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_github_api_keys
    BEFORE UPDATE ON public.github_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_netlify_api_keys
    BEFORE UPDATE ON public.netlify_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Insert the provided API keys
INSERT INTO public.youtube_api_keys (user_id, name, api_key)
SELECT '10ed3515-e078-4b4f-85a4-5a5b683092e7'::uuid, 'Primary YouTube API', 'AIzaSyC-2ILP7PsKdhcACtfzZWKynOzD0jELKZo'
WHERE NOT EXISTS (
    SELECT 1 FROM public.youtube_api_keys 
    WHERE api_key = 'AIzaSyC-2ILP7PsKdhcACtfzZWKynOzD0jELKZo'
);

INSERT INTO public.openrouter_api_keys (user_id, name, api_key)
SELECT '10ed3515-e078-4b4f-85a4-5a5b683092e7'::uuid, 'Primary OpenRouter API', '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'
WHERE NOT EXISTS (
    SELECT 1 FROM public.openrouter_api_keys 
    WHERE api_key = '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'
);
