
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  openrouter: boolean;
  youtube: boolean;
  github: boolean;
  netlify: boolean;
}

export const useApiStatus = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    openrouter: false,
    youtube: false,
    github: false,
    netlify: false
  });
  const [loading, setLoading] = useState(true);

  const checkApiStatus = async () => {
    try {
      setLoading(true);

      // Check OpenRouter API keys
      const { data: openRouterKeys } = await supabase
        .from('openrouter_api_keys')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      // Check YouTube API keys
      const { data: youtubeKeys } = await supabase
        .from('youtube_api_keys')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      // Check GitHub API keys
      const { data: githubKeys } = await supabase
        .from('github_api_keys')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      // Check Netlify API keys
      const { data: netlifyKeys } = await supabase
        .from('netlify_api_keys')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      setApiStatus({
        openrouter: !!(openRouterKeys && openRouterKeys.length > 0),
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
