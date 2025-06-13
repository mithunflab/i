
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, AlertCircle } from 'lucide-react';
import { useRealTimeApiStatus } from '@/hooks/useRealTimeApiStatus';

const RealTimeApiStatusIndicators = () => {
  const { apiStatuses, loading, primaryApi } = useRealTimeApiStatus();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={12} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Checking APIs...</span>
      </div>
    );
  }

  const getStatusColor = (provider: string, status: boolean, isPrimary: boolean) => {
    if (!status) return 'bg-gray-600';
    if (isPrimary && primaryApi === provider) return 'bg-green-500 animate-pulse';
    return provider === 'together' ? 'bg-blue-500' :
           provider === 'groq' ? 'bg-green-500' :
           provider === 'openrouter' ? 'bg-purple-500' :
           provider === 'youtube' ? 'bg-red-500' :
           provider === 'github' ? 'bg-orange-500' :
           'bg-teal-500';
  };

  const getProviderName = (provider: string) => {
    return provider === 'together' ? 'Together' :
           provider === 'groq' ? 'Groq' :
           provider === 'openrouter' ? 'OpenRouter' :
           provider === 'youtube' ? 'YT' :
           provider === 'github' ? 'Git' :
           'Net';
  };

  return (
    <div className="flex items-center gap-3">
      {/* Primary AI Provider Indicator */}
      {primaryApi !== 'none' && (
        <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
          <Zap size={10} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">
            {primaryApi.toUpperCase()}
          </span>
        </div>
      )}

      {/* API Status Dots */}
      <div className="flex items-center gap-1">
        {apiStatuses.map((api) => (
          <div key={api.provider} className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${getStatusColor(api.provider, api.status, api.isPrimary)}`}
              title={`${getProviderName(api.provider)} API ${api.status ? 'Connected' : 'Disconnected'}${api.isPrimary ? ' (Primary)' : ''}`}
            />
            <span className={`text-xs ${api.status ? 'text-gray-300' : 'text-gray-500'}`}>
              {getProviderName(api.provider)}
            </span>
          </div>
        ))}
      </div>

      {/* Error Indicator */}
      {apiStatuses.some(api => !api.status) && (
        <div title="Some APIs are offline">
          <AlertCircle size={12} className="text-yellow-400" />
        </div>
      )}
    </div>
  );
};

export default RealTimeApiStatusIndicators;
