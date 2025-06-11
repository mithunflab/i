
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
          table: 'api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time service status update:', payload);
          checkServiceStatus();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deployment_tokens',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time deployment tokens update:', payload);
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

      // Check API keys
      const { data: apiKeys, error: apiKeysError } = await supabase
        .from('api_keys')
        .select('provider, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (apiKeysError) {
        console.error('Error fetching API keys:', apiKeysError);
      }

      // Check deployment tokens
      const { data: deploymentTokens, error: deploymentTokensError } = await supabase
        .from('deployment_tokens')
        .select('provider, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (deploymentTokensError) {
        console.error('Error fetching deployment tokens:', deploymentTokensError);
      }

      console.log('API Keys found:', apiKeys);
      console.log('Deployment tokens found:', deploymentTokens);

      const allTokens = [...(apiKeys || []), ...(deploymentTokens || [])];
      console.log('All tokens:', allTokens);

      const newStatus = {
        youtube: allTokens.some(token => 
          token.provider === 'YouTube' || 
          token.provider === 'youtube' ||
          token.provider === 'YouTube Data API v3'
        ),
        openrouter: allTokens.some(token => 
          token.provider === 'OpenRouter' || 
          token.provider === 'openrouter'
        ),
        netlify: allTokens.some(token => 
          token.provider === 'Netlify' || 
          token.provider === 'netlify'
        ),
        github: allTokens.some(token => 
          token.provider === 'GitHub' || 
          token.provider === 'github'
        )
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
