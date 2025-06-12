import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
interface ServiceStatus {
  youtube: 'available' | 'in-use' | 'unavailable';
  openrouter: 'available' | 'in-use' | 'unavailable';
  github: 'available' | 'in-use' | 'unavailable';
  netlify: 'available' | 'in-use' | 'unavailable';
}
const ServiceStatusIndicators: React.FC = () => {
  const {
    user
  } = useAuth();
  const [status, setStatus] = useState<ServiceStatus>({
    youtube: 'unavailable',
    openrouter: 'unavailable',
    github: 'unavailable',
    netlify: 'unavailable'
  });
  const [loading, setLoading] = useState(true);
  const checkServiceStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      console.log('🔍 Checking service status...');

      // Check each service for available keys and current usage
      const [youtubeKeys, openrouterKeys, githubKeys, netlifyKeys] = await Promise.all([supabase.from('youtube_api_keys').select('*').eq('is_active', true), supabase.from('openrouter_api_keys').select('*').eq('is_active', true), supabase.from('github_api_keys').select('*').eq('is_active', true), supabase.from('netlify_api_keys').select('*').eq('is_active', true)]);

      // Check current usage from logs (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const {
        data: recentUsage
      } = await supabase.from('api_usage_logs').select('provider').gte('created_at', fiveMinutesAgo);
      const activeServices = new Set(recentUsage?.map(log => log.provider) || []);
      const newStatus: ServiceStatus = {
        youtube: youtubeKeys.data && youtubeKeys.data.length > 0 ? activeServices.has('youtube') ? 'in-use' : 'available' : 'unavailable',
        openrouter: openrouterKeys.data && openrouterKeys.data.length > 0 ? activeServices.has('openrouter') ? 'in-use' : 'available' : 'unavailable',
        github: githubKeys.data && githubKeys.data.length > 0 ? activeServices.has('github') ? 'in-use' : 'available' : 'unavailable',
        netlify: netlifyKeys.data && netlifyKeys.data.length > 0 ? activeServices.has('netlify') ? 'in-use' : 'available' : 'unavailable'
      };
      setStatus(newStatus);
      console.log('✅ Service status updated:', newStatus);
    } catch (error) {
      console.error('❌ Error checking service status:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    checkServiceStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);
  const getStatusColor = (serviceStatus: 'available' | 'in-use' | 'unavailable') => {
    switch (serviceStatus) {
      case 'available':
        return 'bg-green-500';
      case 'in-use':
        return 'bg-blue-500';
      case 'unavailable':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  const getStatusText = (serviceStatus: 'available' | 'in-use' | 'unavailable') => {
    switch (serviceStatus) {
      case 'available':
        return 'Available';
      case 'in-use':
        return 'In Use';
      case 'unavailable':
        return 'No API Key';
      default:
        return 'Unknown';
    }
  };
  const services = [{
    name: 'YouTube',
    key: 'youtube' as keyof ServiceStatus
  }, {
    name: 'AI',
    key: 'openrouter' as keyof ServiceStatus
  }, {
    name: 'GitHub',
    key: 'github' as keyof ServiceStatus
  }, {
    name: 'Netlify',
    key: 'netlify' as keyof ServiceStatus
  }];
  if (loading) {
    return <div className="flex items-center gap-2">
        {services.map(service => <div key={service.name} className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">{service.name}</span>
          </div>)}
      </div>;
  }
  return <TooltipProvider>
      <div className="flex items-center gap-2">
        {services.map(service => <Tooltip key={service.name}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(status[service.key])}`} />
                
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{service.name}: {getStatusText(status[service.key])}</p>
              {status[service.key] === 'unavailable' && <p className="text-xs text-red-400">No API keys configured</p>}
              {status[service.key] === 'in-use' && <p className="text-xs text-blue-400">Currently processing requests</p>}
            </TooltipContent>
          </Tooltip>)}
      </div>
    </TooltipProvider>;
};
export default ServiceStatusIndicators;