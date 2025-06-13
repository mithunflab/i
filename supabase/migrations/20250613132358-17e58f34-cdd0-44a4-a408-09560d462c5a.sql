
-- Create table for Together AI API keys
CREATE TABLE public.together_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  requests_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table for Groq API keys
CREATE TABLE public.groq_api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  requests_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add RLS policies for Together AI keys
ALTER TABLE public.together_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own together keys" 
  ON public.together_api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own together keys" 
  ON public.together_api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own together keys" 
  ON public.together_api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own together keys" 
  ON public.together_api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add RLS policies for Groq keys
ALTER TABLE public.groq_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own groq keys" 
  ON public.groq_api_keys 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groq keys" 
  ON public.groq_api_keys 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groq keys" 
  ON public.groq_api_keys 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groq keys" 
  ON public.groq_api_keys 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER handle_updated_at_together_api_keys
  BEFORE UPDATE ON public.together_api_keys
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_groq_api_keys
  BEFORE UPDATE ON public.groq_api_keys
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
