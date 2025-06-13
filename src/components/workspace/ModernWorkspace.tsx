
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EnhancedRealTimeWorkspace from './EnhancedRealTimeWorkspace';
import { supabase } from '@/integrations/supabase/client';

const ModernWorkspace: React.FC = () => {
  const location = useLocation();
  const [channelData, setChannelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Extract URL parameters
  const urlParams = new URLSearchParams(location.search);
  const youtubeUrl = urlParams.get('url') || '';
  const projectIdea = urlParams.get('idea') || 'Create a modern website';
  const channelId = urlParams.get('channelId') || '';

  // Fetch channel data directly from database
  useEffect(() => {
    const fetchChannelData = async () => {
      if (!channelId && !youtubeUrl) {
        setLoading(false);
        return;
      }

      try {
        console.log('🎥 Fetching channel data from database...');
        
        // Try to get channel data from projects table first
        const { data: projects } = await supabase
          .from('projects')
          .select('channel_data')
          .eq('youtube_url', youtubeUrl)
          .not('channel_data', 'is', null)
          .limit(1);

        if (projects && projects.length > 0 && projects[0].channel_data) {
          console.log('✅ Found channel data in projects table');
          setChannelData(projects[0].channel_data);
        } else {
          // Fallback: Create basic channel data from URL
          const channelName = youtubeUrl.includes('youtube.com') 
            ? youtubeUrl.split('/').pop() || 'YouTube Channel'
            : 'Content Creator';
            
          const fallbackData = {
            id: channelId || 'unknown',
            title: channelName,
            description: `AI-generated website for ${channelName}`,
            thumbnail: '/placeholder.svg',
            subscriberCount: '0',
            videoCount: '0',
            viewCount: '0',
            customUrl: youtubeUrl,
            videos: []
          };
          
          console.log('📝 Using fallback channel data');
          setChannelData(fallbackData);
        }
      } catch (error) {
        console.error('❌ Error fetching channel data:', error);
        
        // Create minimal fallback data
        setChannelData({
          id: 'fallback',
          title: 'AI Website',
          description: 'AI-generated website',
          thumbnail: '/placeholder.svg',
          subscriberCount: '0',
          videoCount: '0',
          viewCount: '0',
          customUrl: youtubeUrl,
          videos: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [youtubeUrl, channelId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading real-time workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <EnhancedRealTimeWorkspace
      youtubeUrl={youtubeUrl}
      projectIdea={projectIdea}
      channelData={channelData}
    />
  );
};

export default ModernWorkspace;
