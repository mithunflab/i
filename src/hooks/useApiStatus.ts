
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  openrouter: boolean;
  together: boolean;
  groq: boolean;
  youtube: boolean;
  github: boolean;
  netlify: boolean;
}

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    openrouter: false,
    together: false,
    groq: false,
    youtube: false,
    github: false,
    netlify: false
  });
  const [loading, setLoading] = useState(true);

  const checkApiStatus = async () => {
    try {
      setLoading(true);

      // Check all API keys
      const [
        { data: openRouterKeys },
        { data: togetherKeys },
        { data: groqKeys },
        { data: youtubeKeys },
        { data: githubKeys },
        { data: netlifyKeys }
      ] = await Promise.all([
        supabase
          .from('openrouter_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        supabase
          .from('together_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        supabase
          .from('groq_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        supabase
          .from('youtube_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        supabase
          .from('github_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1),
        supabase
          .from('netlify_api_keys')
          .select('id')
          .eq('is_active', true)
          .limit(1)
      ]);

      setApiStatus({
        openrouter: !!(openRouterKeys && openRouterKeys.length > 0),
        together: !!(togetherKeys && togetherKeys.length > 0),
        groq: !!(groqKeys && groqKeys.length > 0),
        youtube: !!(youtubeKeys && youtubeKeys.length > 0),
        github: !!(githubKeys && githubKeys.length > 0),
        netlify: !!(netlifyKeys && netlifyKeys.length > 0)
      });
    } catch (error) {
      console.error('Error checking API status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);

  return { apiStatus, loading, refreshStatus: checkApiStatus };
};
