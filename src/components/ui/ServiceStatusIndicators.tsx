
import React, { useState, useEffect, useRef } from 'react';
import { Circle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { apiKeyManager } from '@/utils/apiKeyManager';

interface ServiceStatus {
  ai: boolean;
  youtube: boolean;
  netlify: boolean;
  github: boolean;
}

const ServiceStatusIndicators = () => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    ai: false,
    youtube: false,
    netlify: false,
    github: false
  });
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Check service status immediately
    checkServiceStatus();
    
    // Set up real-time updates for keys
    if (user?.id) {
      setupRealTimeUpdates();
    }

    // Refresh status every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);

    return () => {
      cleanupRealTimeUpdates();
      clearInterval(interval);
    };
  }, [user?.id]);

  const cleanupRealTimeUpdates = () => {
    if (channelRef.current) {
      console.log('🧹 Cleaning up service status real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupRealTimeUpdates = () => {
    cleanupRealTimeUpdates();
    
    if (!user?.id) return;
    
    console.log('🔄 Setting up real-time updates for service status');
    
    channelRef.current = supabase
      .channel('service-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'youtube_api_keys'
        },
        (payload) => {
          console.log('📺 Real-time YouTube API key update:', payload.eventType);
          setTimeout(checkServiceStatus, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'openrouter_api_keys'
        },
        (payload) => {
          console.log('🤖 Real-time OpenRouter API key update:', payload.eventType);
          setTimeout(checkServiceStatus, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'github_api_keys'
        },
        (payload) => {
          console.log('🐙 Real-time GitHub API key update:', payload.eventType);
          setTimeout(checkServiceStatus, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'netlify_api_keys'
        },
        (payload) => {
          console.log('🌐 Real-time Netlify API key update:', payload.eventType);
          setTimeout(checkServiceStatus, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_tokens'
        },
        (payload) => {
          console.log('🔑 Real-time deployment token update:', payload.eventType);
          setTimeout(checkServiceStatus, 1000);
        }
      )
      .subscribe((status) => {
        console.log('📡 Service status real-time subscription status:', status);
      });
  };

  const checkServiceStatus = async () => {
    try {
      console.log('🔍 Checking service status from Supabase tables...');

      // Clear cache to get fresh data
      apiKeyManager.clearCache();

      const availability = await apiKeyManager.checkKeyAvailability();

      // Map openrouter to ai for display
      const statusWithAI = {
        ai: availability.openrouter,
        youtube: availability.youtube,
        netlify: availability.netlify,
        github: availability.github
      };

      console.log('📊 Service status updated from Supabase tables:', statusWithAI);
      setServiceStatus(statusWithAI);
    } catch (error) {
      console.error('❌ Error checking service status:', error);
      // Set all to false on error
      setServiceStatus({
        ai: false,
        youtube: false,
        netlify: false,
        github: false
      });
    }
  };

  const services = [
    { name: 'AI', key: 'ai' as keyof ServiceStatus, emoji: '🤖' },
    { name: 'YouTube', key: 'youtube' as keyof ServiceStatus, emoji: '📺' },
    { name: 'GitHub', key: 'github' as keyof ServiceStatus, emoji: '🐙' },
    { name: 'Netlify', key: 'netlify' as keyof ServiceStatus, emoji: '🌐' }
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
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
            <div className="flex items-center gap-2">
              <span>{service.emoji}</span>
              <span>{service.name}: {serviceStatus[service.key] ? '✅ Connected' : '❌ Not Connected'}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceStatusIndicators;
