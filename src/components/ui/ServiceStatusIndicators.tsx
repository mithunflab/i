
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

interface ServiceStats {
  youtube: { used: number; limit: number };
  openrouter: { used: number; limit: number };
  github: { used: number; limit: number };
  netlify: { used: number; limit: number };
}

const ServiceStatusIndicators: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ServiceStatus>({
    youtube: 'unavailable',
    openrouter: 'unavailable',
    github: 'unavailable',
    netlify: 'unavailable'
  });
  const [stats, setStats] = useState<ServiceStats>({
    youtube: { used: 0, limit: 0 },
    openrouter: { used: 0, limit: 0 },
    github: { used: 0, limit: 0 },
    netlify: { used: 0, limit: 0 }
  });
  const [loading, setLoading] = useState(true);

  const checkServiceStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking real-time service status...');

      // Check each service for available keys and current usage
      const [youtubeKeys, openrouterKeys, githubKeys, netlifyKeys] = await Promise.all([
        supabase.from('youtube_api_keys').select('quota_used, quota_limit').eq('is_active', true),
        supabase.from('openrouter_api_keys').select('credits_used, credits_limit').eq('is_active', true),
        supabase.from('github_api_keys').select('rate_limit_used, rate_limit_limit').eq('is_active', true),
        supabase.from('netlify_api_keys').select('deployments_count, deployments_limit').eq('is_active', true)
      ]);

      // Check recent usage from logs (last 2 minutes for real-time indication)
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: recentUsage } = await supabase
        .from('api_usage_logs')
        .select('provider')
        .gte('created_at', twoMinutesAgo)
        .eq('status', 'success');

      const activeServices = new Set(recentUsage?.map(log => log.provider) || []);

      // Calculate service status and stats
      const newStatus: ServiceStatus = {
        youtube: getServiceStatus(youtubeKeys.data, activeServices.has('youtube')),
        openrouter: getServiceStatus(openrouterKeys.data, activeServices.has('openrouter')),
        github: getServiceStatus(githubKeys.data, activeServices.has('github')),
        netlify: getServiceStatus(netlifyKeys.data, activeServices.has('netlify'))
      };

      const newStats: ServiceStats = {
        youtube: calculateServiceStats(youtubeKeys.data, 'quota_used', 'quota_limit'),
        openrouter: calculateServiceStats(openrouterKeys.data, 'credits_used', 'credits_limit'),
        github: calculateServiceStats(githubKeys.data, 'rate_limit_used', 'rate_limit_limit'),
        netlify: calculateServiceStats(netlifyKeys.data, 'deployments_count', 'deployments_limit')
      };

      setStatus(newStatus);
      setStats(newStats);
      console.log('✅ Real-time service status updated:', { status: newStatus, stats: newStats });
    } catch (error) {
      console.error('❌ Error checking service status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getServiceStatus = (serviceData: any[], isInUse: boolean): 'available' | 'in-use' | 'unavailable' => {
    if (!serviceData || serviceData.length === 0) return 'unavailable';
    if (isInUse) return 'in-use';
    return 'available';
  };

  const calculateServiceStats = (serviceData: any[], usedField: string, limitField: string) => {
    if (!serviceData || serviceData.length === 0) return { used: 0, limit: 0 };
    
    const totalUsed = serviceData.reduce((sum, item) => sum + (item[usedField] || 0), 0);
    const totalLimit = serviceData.reduce((sum, item) => sum + (item[limitField] || 0), 0);
    
    return { used: totalUsed, limit: totalLimit };
  };

  useEffect(() => {
    checkServiceStatus();

    // Check status every 15 seconds for real-time updates
    const interval = setInterval(checkServiceStatus, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const getStatusColor = (serviceStatus: 'available' | 'in-use' | 'unavailable') => {
    switch (serviceStatus) {
      case 'available':
        return 'bg-green-500';
      case 'in-use':
        return 'bg-blue-500 animate-pulse';
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
        return 'Active';
      case 'unavailable':
        return 'No API Key';
      default:
        return 'Unknown';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const services = [
    {
      name: 'YouTube',
      key: 'youtube' as keyof ServiceStatus,
      unit: 'quota'
    },
    {
      name: 'AI',
      key: 'openrouter' as keyof ServiceStatus,
      unit: 'credits'
    },
    {
      name: 'GitHub',
      key: 'github' as keyof ServiceStatus,
      unit: 'requests'
    },
    {
      name: 'Netlify',
      key: 'netlify' as keyof ServiceStatus,
      unit: 'deploys'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        {services.map(service => (
          <div key={service.name} className="flex items-center gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">{service.name}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {services.map(service => {
          const serviceStats = stats[service.key];
          const usagePercentage = getUsagePercentage(serviceStats.used, serviceStats.limit);
          
          return (
            <Tooltip key={service.name}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status[service.key])}`} />
                  <span className="text-xs text-gray-300">{service.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p className="font-medium">{service.name}: {getStatusText(status[service.key])}</p>
                  
                  {status[service.key] === 'unavailable' && (
                    <p className="text-xs text-red-400">No API keys configured</p>
                  )}
                  
                  {status[service.key] === 'in-use' && (
                    <p className="text-xs text-blue-400">Currently processing requests</p>
                  )}
                  
                  {status[service.key] === 'available' && serviceStats.limit > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-green-400">
                        Usage: {serviceStats.used.toLocaleString()} / {serviceStats.limit.toLocaleString()} {service.unit}
                      </p>
                      <div className="w-24 h-1 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            usagePercentage > 80 ? 'bg-red-400' : 
                            usagePercentage > 60 ? 'bg-yellow-400' : 'bg-green-400'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">{usagePercentage.toFixed(1)}% used</p>
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};

export default ServiceStatusIndicators;
