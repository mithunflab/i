
-- Ensure all API key tables exist and are properly configured for shared access
-- This will allow admin-added keys to be used by all users

-- Create or update api_keys table for general API keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provider-specific tables if they don't exist
CREATE TABLE IF NOT EXISTS public.youtube_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    credits_used DECIMAL DEFAULT 0,
    credits_limit DECIMAL DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.github_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_token TEXT NOT NULL,
    deployments_count INTEGER DEFAULT 0,
    deployments_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_provider_active ON public.api_keys(provider, is_active);
CREATE INDEX IF NOT EXISTS idx_youtube_api_keys_active ON public.youtube_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_openrouter_api_keys_active ON public.openrouter_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_github_api_keys_active ON public.github_api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_netlify_api_keys_active ON public.netlify_api_keys(is_active);

-- Enable RLS on all tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.openrouter_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netlify_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies that allow global access to API keys for all authenticated users
-- This allows shared keys to be used by everyone

-- API Keys policies
DROP POLICY IF EXISTS "Global read access to api keys" ON public.api_keys;
CREATE POLICY "Global read access to api keys" ON public.api_keys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage api keys" ON public.api_keys;
CREATE POLICY "Admin can manage api keys" ON public.api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- YouTube API Keys policies
DROP POLICY IF EXISTS "Global read access to youtube keys" ON public.youtube_api_keys;
CREATE POLICY "Global read access to youtube keys" ON public.youtube_api_keys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage youtube keys" ON public.youtube_api_keys;
CREATE POLICY "Admin can manage youtube keys" ON public.youtube_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- OpenRouter API Keys policies
DROP POLICY IF EXISTS "Global read access to openrouter keys" ON public.openrouter_api_keys;
CREATE POLICY "Global read access to openrouter keys" ON public.openrouter_api_keys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage openrouter keys" ON public.openrouter_api_keys;
CREATE POLICY "Admin can manage openrouter keys" ON public.openrouter_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- GitHub API Keys policies
DROP POLICY IF EXISTS "Global read access to github keys" ON public.github_api_keys;
CREATE POLICY "Global read access to github keys" ON public.github_api_keys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage github keys" ON public.github_api_keys;
CREATE POLICY "Admin can manage github keys" ON public.github_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Netlify API Keys policies
DROP POLICY IF EXISTS "Global read access to netlify keys" ON public.netlify_api_keys;
CREATE POLICY "Global read access to netlify keys" ON public.netlify_api_keys
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admin can manage netlify keys" ON public.netlify_api_keys;
CREATE POLICY "Admin can manage netlify keys" ON public.netlify_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables
DROP TRIGGER IF EXISTS set_updated_at_api_keys ON public.api_keys;
CREATE TRIGGER set_updated_at_api_keys
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_youtube_api_keys ON public.youtube_api_keys;
CREATE TRIGGER set_updated_at_youtube_api_keys
    BEFORE UPDATE ON public.youtube_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_openrouter_api_keys ON public.openrouter_api_keys;
CREATE TRIGGER set_updated_at_openrouter_api_keys
    BEFORE UPDATE ON public.openrouter_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_github_api_keys ON public.github_api_keys;
CREATE TRIGGER set_updated_at_github_api_keys
    BEFORE UPDATE ON public.github_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_netlify_api_keys ON public.netlify_api_keys;
CREATE TRIGGER set_updated_at_netlify_api_keys
    BEFORE UPDATE ON public.netlify_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
