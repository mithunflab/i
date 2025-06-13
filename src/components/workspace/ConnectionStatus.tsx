
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Github,
  Globe
} from 'lucide-react';

interface ConnectionStatusProps {
  aiStatus: 'connected' | 'connecting' | 'disconnected';
  githubStatus: 'connected' | 'syncing' | 'error' | 'idle';
  deploymentStatus: 'idle' | 'deploying' | 'deployed' | 'failed';
  netlifyUrl?: string;
  githubUrl?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  aiStatus,
  githubStatus,
  deploymentStatus,
  netlifyUrl,
  githubUrl
}) => {
  const getAIStatusBadge = () => {
    switch (aiStatus) {
      case 'connected':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Wifi className="w-3 h-3 mr-1" />
            AI Connected
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            AI Connecting
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <WifiOff className="w-3 h-3 mr-1" />
            AI Offline
          </Badge>
        );
    }
  };

  const getGitHubStatusBadge = () => {
    switch (githubStatus) {
      case 'connected':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Github className="w-3 h-3 mr-1" />
            GitHub Synced
          </Badge>
        );
      case 'syncing':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            GitHub Syncing
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            GitHub Error
          </Badge>
        );
      case 'idle':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            <Github className="w-3 h-3 mr-1" />
            GitHub Ready
          </Badge>
        );
    }
  };

  const getDeploymentStatusBadge = () => {
    switch (deploymentStatus) {
      case 'deployed':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <Globe className="w-3 h-3 mr-1" />
            Live
          </Badge>
        );
      case 'deploying':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Deploying
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Deploy Failed
          </Badge>
        );
      case 'idle':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
            <Globe className="w-3 h-3 mr-1" />
            Ready to Deploy
          </Badge>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {getAIStatusBadge()}
      {getGitHubStatusBadge()}
      {getDeploymentStatusBadge()}
      
      {netlifyUrl && (
        <a
          href={netlifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          View Live
        </a>
      )}
      
      {githubUrl && (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-gray-800 underline"
        >
          View Code
        </a>
      )}
    </div>
  );
};

export default ConnectionStatus;
