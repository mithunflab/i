
import React, { useState, useEffect, useRef } from 'react';
import { Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceStatus {
  youtube: boolean;
  openrouter: boolean;
  netlify: boolean;
  github: boolean;
}

const ServiceStatusIndicators = () => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    youtube: false,
    openrouter: false,
    netlify: false,
    github: false
  });
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      checkServiceStatus();
      setupRealTimeUpdates();
    }

    return () => {
      cleanupRealTimeUpdates();
    };
  }, [user?.id]);

  const cleanupRealTimeUpdates = () => {
    if (channelRef.current) {
      console.log('Cleaning up service status real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupRealTimeUpdates = () => {
    cleanupRealTimeUpdates();
    
    if (!user?.id) return;
    
    console.log('Setting up real-time updates for service status');
    
    channelRef.current = supabase
      .channel(`service-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'youtube_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time YouTube API key update:', payload);
          checkServiceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'openrouter_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time OpenRouter API key update:', payload);
          checkServiceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'github_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time GitHub API key update:', payload);
          checkServiceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'netlify_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time Netlify API key update:', payload);
          checkServiceStatus();
        }
      )
      .subscribe((status) => {
        console.log('Service status real-time subscription status:', status);
      });
  };

  const checkServiceStatus = async () => {
    if (!user?.id) return;

    try {
      console.log('Checking service status for user:', user.id);

      // Check YouTube API keys
      const { data: youtubeKeys, error: youtubeError } = await supabase
        .from('youtube_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Check OpenRouter API keys
      const { data: openrouterKeys, error: openrouterError } = await supabase
        .from('openrouter_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Check GitHub API keys
      const { data: githubKeys, error: githubError } = await supabase
        .from('github_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Check Netlify API keys
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (youtubeError) console.error('Error fetching YouTube keys:', youtubeError);
      if (openrouterError) console.error('Error fetching OpenRouter keys:', openrouterError);
      if (githubError) console.error('Error fetching GitHub keys:', githubError);
      if (netlifyError) console.error('Error fetching Netlify keys:', netlifyError);

      console.log('YouTube Keys:', youtubeKeys);
      console.log('OpenRouter Keys:', openrouterKeys);
      console.log('GitHub Keys:', githubKeys);
      console.log('Netlify Keys:', netlifyKeys);

      const newStatus = {
        youtube: (youtubeKeys && youtubeKeys.length > 0),
        openrouter: (openrouterKeys && openrouterKeys.length > 0),
        github: (githubKeys && githubKeys.length > 0),
        netlify: (netlifyKeys && netlifyKeys.length > 0)
      };

      console.log('Service status updated:', newStatus);
      setServiceStatus(newStatus);
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  };

  const services = [
    { name: 'YouTube', key: 'youtube' as keyof ServiceStatus },
    { name: 'OpenRouter', key: 'openrouter' as keyof ServiceStatus },
    { name: 'Netlify', key: 'netlify' as keyof ServiceStatus },
    { name: 'GitHub', key: 'github' as keyof ServiceStatus }
  ];

  return (
    <div className="flex items-center gap-2">
      {services.map((service) => (
        <div key={service.key} className="relative group">
          <Circle
            size={8}
            className={`${
              serviceStatus[service.key] 
                ? 'text-green-400 fill-green-400' 
                : 'text-red-400 fill-red-400'
            }`}
          />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {service.name}: {serviceStatus[service.key] ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceStatusIndicators;
