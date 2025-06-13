
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useApiStatus } from '@/hooks/useApiStatus';

const ApiStatusIndicators = () => {
  const { apiStatus, loading } = useApiStatus();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 size={12} className="animate-spin text-gray-400" />
        <span className="text-xs text-gray-400">Checking APIs...</span>
      </div>
    );
  }

  const indicators = [
    { name: 'AI', status: apiStatus.openrouter, color: 'bg-purple-500' },
    { name: 'YT', status: apiStatus.youtube, color: 'bg-red-500' },
    { name: 'Git', status: apiStatus.github, color: 'bg-orange-500' },
    { name: 'Net', status: apiStatus.netlify, color: 'bg-teal-500' }
  ];

  return (
    <div className="flex items-center gap-1">
      {indicators.map((indicator) => (
        <div key={indicator.name} className="flex items-center gap-1">
          <div 
            className={`w-2 h-2 rounded-full ${
              indicator.status 
                ? indicator.color 
                : 'bg-gray-600'
            }`}
            title={`${indicator.name} API ${indicator.status ? 'Connected' : 'Disconnected'}`}
          />
          <span className="text-xs text-gray-400">{indicator.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ApiStatusIndicators;
