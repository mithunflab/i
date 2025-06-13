
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github, GitBranch, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useRealTimeGitSync } from '@/hooks/useRealTimeGitSync';
import { Badge } from '@/components/ui/badge';

interface RealTimeGitIndicatorProps {
  projectId?: string;
  projectData?: any;
}

const RealTimeGitIndicator: React.FC<RealTimeGitIndicatorProps> = ({ projectId, projectData }) => {
  const { syncStatus, isConnected, checkGitConnection } = useRealTimeGitSync(projectId);

  const getStatusIcon = () => {
    if (!isConnected) {
      return <X size={12} className="text-gray-500" />;
    }

    switch (syncStatus.syncStatus) {
      case 'syncing':
        return <Loader2 size={12} className="animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return <GitBranch size={12} className="text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-gray-600';
    
    switch (syncStatus.syncStatus) {
      case 'syncing':
        return 'bg-blue-500 animate-pulse';
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Not Connected';
    
    switch (syncStatus.syncStatus) {
      case 'syncing':
        return `Syncing ${syncStatus.filesSynced} files...`;
      case 'success':
        return `Last sync: ${syncStatus.lastSyncAt?.toLocaleTimeString() || 'Just now'}`;
      case 'error':
        return `Error: ${syncStatus.errorMessage || 'Unknown error'}`;
      default:
        return 'Ready to sync';
    }
  };

  const handleGitClick = () => {
    if (projectData?.github_url) {
      window.open(projectData.github_url, '_blank');
    } else {
      checkGitConnection();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Git Connection Status */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleGitClick}
        className="p-1 h-auto text-gray-400 hover:text-white"
        title={getStatusText()}
      >
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
          <Github size={14} />
        </div>
      </Button>

      {/* Sync Status Details */}
      {isConnected && (
        <Badge variant="outline" className="text-xs bg-black/30 border-gray-600">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="max-w-24 truncate">{getStatusText()}</span>
          </div>
        </Badge>
      )}

      {/* Commit Hash if available */}
      {syncStatus.commitHash && (
        <span className="text-xs text-gray-500 font-mono">
          {syncStatus.commitHash.substring(0, 7)}
        </span>
      )}
    </div>
  );
};

export default RealTimeGitIndicator;
