
-- Create email_configurations table
CREATE TABLE IF NOT EXISTS public.email_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'smtp', -- 'smtp' or 'google'
    smtp_host TEXT,
    smtp_port INTEGER,
    smtp_username TEXT,
    smtp_password TEXT,
    from_email TEXT,
    google_client_id TEXT,
    google_client_secret TEXT,
    google_refresh_token TEXT,
    google_access_token TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create api_usage_logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.api_keys(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,6) DEFAULT 0,
    response_time_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'success', -- 'success', 'error', 'timeout'
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create model_pricing table
CREATE TABLE IF NOT EXISTS public.model_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model TEXT NOT NULL UNIQUE,
    provider TEXT NOT NULL,
    input_cost_per_token DECIMAL(12,8) DEFAULT 0,
    output_cost_per_token DECIMAL(12,8) DEFAULT 0,
    plan_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'pro_plus'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create system_monitoring table
CREATE TABLE IF NOT EXISTS public.system_monitoring (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_unit TEXT DEFAULT '',
    metadata JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create webhook_endpoints table
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    secret TEXT,
    events TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create domain_management table
CREATE TABLE IF NOT EXISTS public.domain_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    ssl_enabled BOOLEAN DEFAULT false,
    dns_configured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'error'
    verification_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create backup_schedules table
CREATE TABLE IF NOT EXISTS public.backup_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule_cron TEXT NOT NULL,
    backup_type TEXT DEFAULT 'full', -- 'full', 'incremental'
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP WITH TIME ZONE,
    next_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create file_storage table
CREATE TABLE IF NOT EXISTS public.file_storage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW') NOT NULL
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default model pricing data
INSERT INTO public.model_pricing (model, provider, input_cost_per_token, output_cost_per_token, plan_tier) VALUES
('nousresearch/deephermes-3-mistral-24b-preview:free', 'OpenRouter', 0.0, 0.0, 'free'),
('deepseek/deepseek-r1-0528:free', 'OpenRouter', 0.0, 0.0, 'free'),
('deepseek/deepseek-r1-0528-qwen3-8b:free', 'OpenRouter', 0.0, 0.0, 'free'),
('qwen/qwen3-235b-a22b:free', 'OpenRouter', 0.0, 0.0, 'free'),
('deepseek/deepseek-prover-v2:free', 'OpenRouter', 0.0, 0.0, 'free'),
('qwen/qwen3-30b-a3b:free', 'OpenRouter', 0.0, 0.0, 'free'),
('deepseek/deepseek-v3-base:free', 'OpenRouter', 0.0, 0.0, 'free'),
('anthropic/claude-3-sonnet:beta', 'OpenRouter', 0.000003, 0.000015, 'pro'),
('openai/gpt-4o', 'OpenRouter', 0.000005, 0.000015, 'pro'),
('anthropic/claude-3-opus:beta', 'OpenRouter', 0.000015, 0.000075, 'pro_plus'),
('openai/o1-preview', 'OpenRouter', 0.000015, 0.00006, 'pro_plus')
ON CONFLICT (model) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_model ON public.api_usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_provider ON public.api_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_configurations_user_id ON public.email_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_model_pricing_plan_tier ON public.model_pricing(plan_tier);
CREATE INDEX IF NOT EXISTS idx_system_monitoring_recorded_at ON public.system_monitoring(recorded_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own email configurations" ON public.email_configurations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own email configurations" ON public.email_configurations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own email configurations" ON public.email_configurations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own email configurations" ON public.email_configurations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own API usage logs" ON public.api_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert API usage logs" ON public.api_usage_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can view model pricing" ON public.model_pricing FOR SELECT USING (true);
CREATE POLICY "Only admins can modify model pricing" ON public.model_pricing FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own webhooks" ON public.webhook_endpoints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own webhooks" ON public.webhook_endpoints FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own domains" ON public.domain_management FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own domains" ON public.domain_management FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own backups" ON public.backup_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own backups" ON public.backup_schedules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own files" ON public.file_storage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own files" ON public.file_storage FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view system monitoring" ON public.system_monitoring FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "System can insert monitoring data" ON public.system_monitoring FOR INSERT WITH CHECK (true);

