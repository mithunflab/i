
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelIdentifier, fetchVideos = true, maxResults = 12 } = await req.json();
    
    console.log('🎥 YouTube Integration request:', { channelIdentifier, fetchVideos, maxResults });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get active YouTube API key from database
    console.log('🔍 Fetching YouTube API key from database...');
    const { data: youtubeKeys, error: youtubeError } = await supabase
      .from('youtube_api_keys')
      .select('api_key, name')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (youtubeError) {
      console.error('❌ Error fetching YouTube keys:', youtubeError);
      throw new Error('Failed to fetch YouTube API keys from database');
    }

    if (!youtubeKeys || youtubeKeys.length === 0) {
      console.error('❌ No active YouTube API keys found in database');
      throw new Error('No active YouTube API keys found. Please add API keys in admin panel.');
    }

    const youtubeApiKey = youtubeKeys[0].api_key;
    console.log('✅ Found YouTube API key:', youtubeKeys[0].name);

    // First, resolve channel ID if we have a username/handle
    let channelId = channelIdentifier;
    
    if (!channelIdentifier.startsWith('UC')) {
      // Try to get channel ID by username/handle
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelIdentifier)}&key=${youtubeApiKey}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        }
      }
    }

    // Fetch channel details
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${youtubeApiKey}`
    );

    if (!channelResponse.ok) {
      throw new Error(`YouTube API error: ${channelResponse.status}`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found');
    }

    const channel = channelData.items[0];
    
    // Prepare channel data
    const channelInfo = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
      subscriberCount: channel.statistics.subscriberCount || '0',
      videoCount: channel.statistics.videoCount || '0',
      viewCount: channel.statistics.viewCount || '0',
      customUrl: channel.snippet.customUrl || '',
      videos: []
    };

    // Fetch latest videos if requested
    if (fetchVideos) {
      console.log('📹 Fetching channel videos...');
      
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${youtubeApiKey}`
      );

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        
        if (videosData.items) {
          // Get video statistics for each video
          const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
          
          const videoStatsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${youtubeApiKey}`
          );

          let videoStats = {};
          if (videoStatsResponse.ok) {
            const statsData = await videoStatsResponse.json();
            videoStats = statsData.items.reduce((acc: any, item: any) => {
              acc[item.id] = {
                viewCount: item.statistics.viewCount || '0',
                duration: item.contentDetails.duration || 'PT0M0S'
              };
              return acc;
            }, {});
          }

          channelInfo.videos = videosData.items.map((item: any) => {
            const stats = videoStats[item.id.videoId] || {};
            return {
              id: item.id.videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
              publishedAt: item.snippet.publishedAt,
              viewCount: stats.viewCount || '0',
              duration: stats.duration || 'PT0M0S',
              embedUrl: `https://www.youtube.com/embed/${item.id.videoId}`
            };
          });
        }
      }
    }

    console.log('✅ YouTube data fetched successfully:', {
      channel: channelInfo.title,
      videos: channelInfo.videos.length
    });

    return new Response(
      JSON.stringify({ channel: channelInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ YouTube Integration error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to fetch YouTube data',
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
