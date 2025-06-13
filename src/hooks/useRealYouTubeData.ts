
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  duration: string;
  embedUrl: string;
}

interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl: string;
  videos: YouTubeVideo[];
}

export const useRealYouTubeData = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRealChannelData = useCallback(async (youtubeUrl: string): Promise<YouTubeChannel | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎥 Fetching REAL YouTube data for:', youtubeUrl);

      // Extract channel identifier from URL
      const channelIdentifier = extractChannelIdentifier(youtubeUrl);
      
      if (!channelIdentifier) {
        throw new Error('Invalid YouTube URL format. Please use a valid YouTube channel URL.');
      }

      console.log('🔍 Channel identifier extracted:', channelIdentifier);

      // Call YouTube integration edge function
      const { data, error } = await supabase.functions.invoke('youtube-integration', {
        body: {
          channelIdentifier,
          fetchVideos: true,
          maxResults: 12
        }
      });

      if (error) {
        console.error('❌ YouTube API Error:', error);
        throw new Error(`Failed to fetch channel data: ${error.message}`);
      }

      if (!data?.channel) {
        throw new Error('No channel data received from YouTube API');
      }

      console.log('✅ Real YouTube data fetched successfully:', {
        channel: data.channel.title,
        subscribers: data.channel.subscriberCount,
        videos: data.channel.videos.length
      });

      return data.channel;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch YouTube data';
      console.error('❌ Error fetching real YouTube data:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchRealChannelData
  };
};

// Helper function to extract channel identifier from YouTube URL
const extractChannelIdentifier = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Handle different YouTube URL formats
    if (pathname.includes('/channel/')) {
      return pathname.split('/channel/')[1].split('/')[0];
    }
    
    if (pathname.includes('/c/')) {
      return pathname.split('/c/')[1].split('/')[0];
    }
    
    if (pathname.includes('/user/')) {
      return pathname.split('/user/')[1].split('/')[0];
    }
    
    if (pathname.includes('/@')) {
      return pathname.split('/@')[1].split('/')[0];
    }
    
    // Handle youtube.com/channelname format
    if (pathname.length > 1) {
      const channelName = pathname.substring(1).split('/')[0];
      if (channelName && !channelName.includes('watch')) {
        return channelName;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};
