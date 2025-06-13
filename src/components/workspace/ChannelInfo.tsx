
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, Video, Eye } from 'lucide-react';

interface ChannelInfoProps {
  channelData: {
    title: string;
    thumbnail: string;
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  } | null;
}

const ChannelInfo = ({ channelData }: ChannelInfoProps) => {
  if (!channelData) {
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
        <div>
          <h3 className="text-white font-medium">AI Website Builder</h3>
          <p className="text-gray-400 text-sm">Ready to create</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-lg border border-red-500/20">
      <img 
        src={channelData.thumbnail} 
        alt={channelData.title}
        className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
      />
      <div className="flex-1">
        <h3 className="text-white font-medium text-sm truncate max-w-48">
          {channelData.title}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={10} />
            {parseInt(channelData.subscriberCount || '0').toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Video size={10} />
            {parseInt(channelData.videoCount || '0').toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Eye size={10} />
            {parseInt(channelData.viewCount || '0').toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelInfo;
