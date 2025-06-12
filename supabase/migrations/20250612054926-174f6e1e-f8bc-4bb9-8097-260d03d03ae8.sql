
-- First, clean up any conflicting policies to avoid errors
DROP POLICY IF EXISTS "Global read access to api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Global read access to youtube keys" ON public.youtube_api_keys;
DROP POLICY IF EXISTS "Global read access to openrouter keys" ON public.openrouter_api_keys;
DROP POLICY IF EXISTS "Global read access to github keys" ON public.github_api_keys;
DROP POLICY IF EXISTS "Global read access to netlify keys" ON public.netlify_api_keys;
DROP POLICY IF EXISTS "Admin can manage api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admin can manage youtube keys" ON public.youtube_api_keys;
DROP POLICY IF EXISTS "Admin can manage openrouter keys" ON public.openrouter_api_keys;
DROP POLICY IF EXISTS "Admin can manage github keys" ON public.github_api_keys;
DROP POLICY IF EXISTS "Admin can manage netlify keys" ON public.netlify_api_keys;

-- Create global read policies for all authenticated users to access shared keys
CREATE POLICY "All users can read api keys" ON public.api_keys
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can read youtube keys" ON public.youtube_api_keys
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can read openrouter keys" ON public.openrouter_api_keys
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can read github keys" ON public.github_api_keys
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can read netlify keys" ON public.netlify_api_keys
    FOR SELECT TO authenticated USING (true);

-- Admin management policies
CREATE POLICY "Admin can manage api keys" ON public.api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage youtube keys" ON public.youtube_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage openrouter keys" ON public.openrouter_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage github keys" ON public.github_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage netlify keys" ON public.netlify_api_keys
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert some sample GitHub and Netlify keys for testing
INSERT INTO public.github_api_keys (user_id, name, api_token)
SELECT '10ed3515-e078-4b4f-85a4-5a5b683092e7'::uuid, 'Primary GitHub Token', 'ghp_sample_token_replace_with_real'
WHERE NOT EXISTS (
    SELECT 1 FROM public.github_api_keys 
    WHERE name = 'Primary GitHub Token'
);

INSERT INTO public.netlify_api_keys (user_id, name, api_token)
SELECT '10ed3515-e078-4b4f-85a4-5a5b683092e7'::uuid, 'Primary Netlify Token', 'netlify_sample_token_replace_with_real'
WHERE NOT EXISTS (
    SELECT 1 FROM public.netlify_api_keys 
    WHERE name = 'Primary Netlify Token'
);
