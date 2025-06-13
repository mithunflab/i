
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { useRealTimeApiStatus } from '@/hooks/useRealTimeApiStatus';
import { useGroqAI } from '@/hooks/useGroqAI';
import { useEffect } from 'react';

const RealTimeApiStatusIndicators = () => {
  const { apiStatuses, loading } = useRealTimeApiStatus();
  const { isConnected: groqConnected, checkGroqConnection } = useGroqAI();

  useEffect(() => {
    checkGroqConnection();
  }, [checkGroqConnection]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <Loader2 size={12} className="animate-spin text-gray-400" />
      </div>
    );
  }

  const getStatusColor = (provider: string, status: boolean, isPrimary: boolean) => {
    if (!status) return 'bg-gray-600';
    if (provider === 'groq' && groqConnected) return 'bg-green-500 animate-pulse';
    if (isPrimary) return 'bg-green-500 animate-pulse';
    return provider === 'together' ? 'bg-blue-500' :
           provider === 'groq' ? 'bg-green-500' :
           provider === 'openrouter' ? 'bg-purple-500' :
           provider === 'youtube' ? 'bg-red-500' :
           provider === 'github' ? 'bg-orange-500' :
           'bg-teal-500';
  };

  const getProviderName = (provider: string) => {
    return provider === 'together' ? 'Together AI' :
           provider === 'groq' ? 'Groq AI' :
           provider === 'openrouter' ? 'OpenRouter' :
           provider === 'youtube' ? 'YouTube API' :
           provider === 'github' ? 'GitHub' :
           'Netlify';
  };

  const getStatusText = (provider: string, status: boolean) => {
    if (provider === 'groq' && groqConnected) return 'Real-time Active';
    return status ? 'Connected' : 'Disconnected';
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        {/* API Status Dots */}
        {apiStatuses.map((api) => (
          <Tooltip key={api.provider}>
            <TooltipTrigger asChild>
              <div 
                className={`w-2 h-2 rounded-full cursor-pointer ${getStatusColor(api.provider, api.status, api.isPrimary)}`}
              />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-center">
                <p className="font-medium">{getProviderName(api.provider)}</p>
                <p className="text-xs">{getStatusText(api.provider, api.status)}</p>
                {api.isPrimary && <p className="text-xs text-green-400">(Primary)</p>}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
        
        {/* Groq Status Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`w-2 h-2 rounded-full cursor-pointer ${groqConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="font-medium">Groq AI</p>
              <p className="text-xs">{groqConnected ? 'Real-time Active' : 'Disconnected'}</p>
              {groqConnected && <p className="text-xs text-green-400">(Real-time Generation)</p>}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Error Indicator */}
        {apiStatuses.some(api => !api.status) && !groqConnected && (
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertCircle size={12} className="text-yellow-400 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Some APIs are offline</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default RealTimeApiStatusIndicators;
