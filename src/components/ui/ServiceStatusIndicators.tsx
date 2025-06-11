
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (user?.id) {
      checkServiceStatus();
      setupRealTimeUpdates();
    }
  }, [user?.id]);

  const checkServiceStatus = async () => {
    if (!user?.id) return;

    try {
      // Check API keys
      const { data: apiKeys } = await supabase
        .from('api_keys')
        .select('provider, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Check deployment tokens
      const { data: deploymentTokens } = await supabase
        .from('deployment_tokens')
        .select('provider, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const allTokens = [...(apiKeys || []), ...(deploymentTokens || [])];

      setServiceStatus({
        youtube: allTokens.some(token => 
          token.provider === 'YouTube' || token.provider === 'youtube'
        ),
        openrouter: allTokens.some(token => 
          token.provider === 'OpenRouter' || token.provider === 'openrouter'
        ),
        netlify: allTokens.some(token => 
          token.provider === 'Netlify' || token.provider === 'netlify'
        ),
        github: allTokens.some(token => 
          token.provider === 'GitHub' || token.provider === 'github'
        )
      });
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  };

  const setupRealTimeUpdates = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`service-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `user_id=eq.${user.id}`
        },
        () => {
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
        () => {
          checkServiceStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {service.name}: {serviceStatus[service.key] ? 'Connected' : 'Not Connected'}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceStatusIndicators;
