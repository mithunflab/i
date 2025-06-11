
-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.deployment_tokens CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;

-- Create api_keys table for general API key management (YouTube, OpenRouter, etc.)
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_value TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deployment_tokens table for GitHub/Netlify tokens
CREATE TABLE IF NOT EXISTS public.deployment_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('github', 'netlify')),
    token_name TEXT NOT NULL,
    token_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_deployment_tokens_user_id ON public.deployment_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_deployment_tokens_provider ON public.deployment_tokens(provider);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_keys
CREATE POLICY "Users can view their own api keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own api keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own api keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own api keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for deployment_tokens
CREATE POLICY "Users can view their own deployment tokens" ON public.deployment_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deployment tokens" ON public.deployment_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployment tokens" ON public.deployment_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployment tokens" ON public.deployment_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_api_keys
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_deployment_tokens
    BEFORE UPDATE ON public.deployment_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
