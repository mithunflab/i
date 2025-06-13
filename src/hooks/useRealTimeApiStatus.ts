
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ApiStatus {
  provider: string;
  status: boolean;
  isPrimary: boolean;
  responseTime?: number;
  usageCount: number;
  lastCheck?: Date;
  errorMessage?: string;
}

export const useRealTimeApiStatus = () => {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const checkApiStatus = async () => {
    try {
      // Check all API provider tables
      const [
        { data: openRouterKeys },
        { data: togetherKeys },
        { data: groqKeys },
        { data: youtubeKeys },
        { data: githubKeys },
        { data: netlifyKeys }
      ] = await Promise.all([
        supabase.from('openrouter_api_keys').select('*').eq('is_active', true).limit(1),
        supabase.from('together_api_keys').select('*').eq('is_active', true).limit(1),
        supabase.from('groq_api_keys').select('*').eq('is_active', true).limit(1),
        supabase.from('youtube_api_keys').select('*').eq('is_active', true).limit(1),
        supabase.from('github_api_keys').select('*').eq('is_active', true).limit(1),
        supabase.from('netlify_api_keys').select('*').eq('is_active', true).limit(1)
      ]);

      const statuses: ApiStatus[] = [
        {
          provider: 'together',
          status: !!(togetherKeys && togetherKeys.length > 0),
          isPrimary: true,
          usageCount: togetherKeys?.[0]?.requests_count || 0
        },
        {
          provider: 'groq',
          status: !!(groqKeys && groqKeys.length > 0),
          isPrimary: false,
          usageCount: groqKeys?.[0]?.requests_count || 0
        },
        {
          provider: 'openrouter',
          status: !!(openRouterKeys && openRouterKeys.length > 0),
          isPrimary: false,
          usageCount: openRouterKeys?.[0]?.requests_count || 0
        },
        {
          provider: 'youtube',
          status: !!(youtubeKeys && youtubeKeys.length > 0),
          isPrimary: false,
          usageCount: youtubeKeys?.[0]?.quota_used || 0
        },
        {
          provider: 'github',
          status: !!(githubKeys && githubKeys.length > 0),
          isPrimary: false,
          usageCount: githubKeys?.[0]?.rate_limit_used || 0
        },
        {
          provider: 'netlify',
          status: !!(netlifyKeys && netlifyKeys.length > 0),
          isPrimary: false,
          usageCount: netlifyKeys?.[0]?.deployments_count || 0
        }
      ];

      setApiStatuses(statuses);
    } catch (error) {
      console.error('Error checking API status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Set up real-time checking every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { 
    apiStatuses, 
    loading, 
    refreshStatus: checkApiStatus,
    primaryApi: apiStatuses.find(api => api.isPrimary && api.status)?.provider || 'none'
  };
};
