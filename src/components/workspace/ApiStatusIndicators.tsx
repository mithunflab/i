
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, Brain } from 'lucide-react';
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
    { name: 'Together', status: apiStatus.together, color: 'bg-blue-500', icon: <Zap size={8} /> },
    { name: 'Groq', status: apiStatus.groq, color: 'bg-green-500', icon: <Brain size={8} /> },
    { name: 'OpenRouter', status: apiStatus.openrouter, color: 'bg-purple-500', icon: <Brain size={8} /> },
    { name: 'YT', status: apiStatus.youtube, color: 'bg-red-500' },
    { name: 'Git', status: apiStatus.github, color: 'bg-orange-500' },
    { name: 'Net', status: apiStatus.netlify, color: 'bg-teal-500' }
  ];

  // Show which AI is currently active
  const activeAI = apiStatus.together ? 'Together AI' : apiStatus.groq ? 'Groq' : apiStatus.openrouter ? 'OpenRouter' : 'None';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {indicators.map((indicator) => (
          <div key={indicator.name} className="flex items-center gap-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                indicator.status 
                  ? indicator.color 
                  : 'bg-gray-600'
              } flex items-center justify-center`}
              title={`${indicator.name} API ${indicator.status ? 'Connected' : 'Disconnected'}`}
            >
              {indicator.status && indicator.icon && (
                <div className="text-white">{indicator.icon}</div>
              )}
            </div>
            <span className="text-xs text-gray-400">{indicator.name}</span>
          </div>
        ))}
      </div>
      
      {activeAI !== 'None' && (
        <Badge variant="outline" className="text-xs px-1 py-0 bg-green-500/10 text-green-400 border-green-500/30">
          Active: {activeAI}
        </Badge>
      )}
    </div>
  );
};

export default ApiStatusIndicators;
