
-- Create deployment_tokens table for storing GitHub and Netlify tokens separately
CREATE TABLE IF NOT EXISTS public.deployment_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'github' or 'netlify'
    token_name TEXT NOT NULL,
    token_value TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider, token_name)
);

-- Create project_chat_history table for storing workspace chat conversations
CREATE TABLE IF NOT EXISTS public.project_chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_type TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB, -- For storing additional data like timestamps, features mentioned, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_verification_requests table for get verified feature
CREATE TABLE IF NOT EXISTS public.project_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    request_message TEXT,
    admin_notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    UNIQUE(project_id)
);

-- Create storage_usage_tracking table for real-time storage monitoring
CREATE TABLE IF NOT EXISTS public.storage_usage_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket_name TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.deployment_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for deployment_tokens
CREATE POLICY "Users can view their own deployment tokens" ON public.deployment_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own deployment tokens" ON public.deployment_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own deployment tokens" ON public.deployment_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own deployment tokens" ON public.deployment_tokens FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_chat_history
CREATE POLICY "Users can view their own project chat history" ON public.project_chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own project chat history" ON public.project_chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own project chat history" ON public.project_chat_history FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for project_verification_requests
CREATE POLICY "Users can view their own verification requests" ON public.project_verification_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own verification requests" ON public.project_verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own verification requests" ON public.project_verification_requests FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for verification requests
CREATE POLICY "Admins can view all verification requests" ON public.project_verification_requests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
CREATE POLICY "Admins can update verification requests" ON public.project_verification_requests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Create RLS policies for storage_usage_tracking
CREATE POLICY "Users can view their own storage usage" ON public.storage_usage_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage storage usage tracking" ON public.storage_usage_tracking FOR ALL USING (true);

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_deployment_tokens
    BEFORE UPDATE ON public.deployment_tokens
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deployment_tokens_user_id ON public.deployment_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_deployment_tokens_provider ON public.deployment_tokens(provider);
CREATE INDEX IF NOT EXISTS idx_project_chat_history_project_id ON public.project_chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_project_chat_history_user_id ON public.project_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_project_verification_requests_project_id ON public.project_verification_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_project_verification_requests_status ON public.project_verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_storage_usage_tracking_user_id ON public.storage_usage_tracking(user_id);

-- Enable real-time for the new tables
ALTER TABLE public.deployment_tokens REPLICA IDENTITY FULL;
ALTER TABLE public.project_chat_history REPLICA IDENTITY FULL;
ALTER TABLE public.project_verification_requests REPLICA IDENTITY FULL;
ALTER TABLE public.storage_usage_tracking REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.deployment_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_chat_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_verification_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.storage_usage_tracking;
