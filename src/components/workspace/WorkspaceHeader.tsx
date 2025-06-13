
import React from 'react';
import ApiStatusIndicators from './ApiStatusIndicators';
import GitStatusIndicator from './GitStatusIndicator';

const WorkspaceHeader = () => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-black/50">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">AI Workspace</h1>
        <div className="flex items-center gap-4">
          <ApiStatusIndicators />
          <div className="w-px h-4 bg-gray-600"></div>
          <GitStatusIndicator />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-xs text-gray-400">
          Real-time AI • Professional Generation • Git Sync
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
