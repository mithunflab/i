
import { useState, useCallback, useEffect } from 'react';
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

export const useYouTubeIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannelData = useCallback(async (youtubeUrl: string): Promise<YouTubeChannel | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎥 Fetching YouTube channel data for:', youtubeUrl);

      // Extract channel ID or username from URL
      const channelIdentifier = extractChannelIdentifier(youtubeUrl);
      
      if (!channelIdentifier) {
        throw new Error('Invalid YouTube URL format');
      }

      // Call Supabase Edge Function to fetch YouTube data
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

      console.log('✅ YouTube channel data fetched successfully');
      return data.channel;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Error fetching YouTube data:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateWebsiteWithRealData = useCallback(async (
    channelData: YouTubeChannel,
    projectIdea: string,
    userRequest?: string
  ) => {
    try {
      setLoading(true);
      console.log('🏗️ Generating professional website with real YouTube data...');

      const { data, error } = await supabase.functions.invoke('generate-professional-website', {
        body: {
          channelData,
          projectIdea,
          userRequest: userRequest || 'Create a professional website',
          includeRealVideos: true,
          generateMultipleFiles: true,
          preserveDesign: !!userRequest // If userRequest exists, preserve existing design
        }
      });

      if (error) {
        throw new Error(`Website generation failed: ${error.message}`);
      }

      console.log('✅ Professional website generated with real data');
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Website generation failed';
      console.error('❌ Error generating website:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchChannelData,
    generateWebsiteWithRealData
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
    
    if (pathname.includes('/c/') || pathname.includes('/user/')) {
      return pathname.split('/').filter(Boolean)[1];
    }
    
    if (pathname.includes('/@')) {
      return pathname.split('/@')[1].split('/')[0];
    }
    
    // Handle youtube.com/channelname format
    if (pathname.length > 1) {
      return pathname.substring(1).split('/')[0];
    }
    
    return null;
  } catch {
    return null;
  }
};
