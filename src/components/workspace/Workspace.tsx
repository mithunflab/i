
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import EnhancedWorkspace from './EnhancedWorkspace';

const Workspace = () => {
  const [searchParams] = useSearchParams();
  
  const youtubeUrl = searchParams.get('url') || '';
  const projectIdea = searchParams.get('idea') || '';
  const channelDataParam = searchParams.get('channelData');
  
  let channelData = null;
  if (channelDataParam) {
    try {
      channelData = JSON.parse(decodeURIComponent(channelDataParam));
    } catch (error) {
      console.error('Error parsing channel data:', error);
    }
  }

  if (!youtubeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Missing YouTube URL</h1>
          <p className="text-gray-400">Please provide a valid YouTube channel URL to continue.</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedWorkspace
      youtubeUrl={youtubeUrl}
      projectIdea={projectIdea}
      channelData={channelData}
    />
  );
};

export default Workspace;
