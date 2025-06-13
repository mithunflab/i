
import React from 'react';
import { GitBranch, GitCommit, AlertCircle } from 'lucide-react';
import { useGitHubIntegration } from '@/hooks/useGitHubIntegration';

const GitStatusIndicator = () => {
  const { gitStatus } = useGitHubIntegration();

  const getStatusColor = () => {
    if (!gitStatus.connected) return 'text-gray-500';
    if (gitStatus.syncStatus === 'syncing') return 'text-yellow-500';
    if (gitStatus.syncStatus === 'error') return 'text-red-500';
    if (gitStatus.syncStatus === 'success') return 'text-green-500';
    return 'text-blue-500';
  };

  const getStatusIcon = () => {
    if (!gitStatus.connected) return <GitBranch size={14} />;
    if (gitStatus.syncStatus === 'syncing') return <GitCommit size={14} className="animate-pulse" />;
    if (gitStatus.syncStatus === 'error') return <AlertCircle size={14} />;
    return <GitBranch size={14} />;
  };

  const getStatusText = () => {
    if (!gitStatus.connected) return 'Not Connected';
    if (gitStatus.syncStatus === 'syncing') return 'Syncing...';
    if (gitStatus.syncStatus === 'error') return 'Sync Error';
    if (gitStatus.syncStatus === 'success') return 'Synced';
    return 'Connected';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${getStatusColor()} flex items-center gap-1`}>
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </div>
      {gitStatus.lastSync && (
        <span className="text-xs text-gray-400">
          {gitStatus.lastSync.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default GitStatusIndicator;
