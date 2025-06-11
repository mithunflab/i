import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Globe, Wand2, AlertCircle, CheckCircle, Loader2, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiKeyManager } from '@/utils/apiKeyManager';

interface YouTubeChannelData {
  channelId: string;
  channelName: string;
  description: string;
  thumbnails: any;
  subscriberCount: string;
  videoCount: string;
  videos: any[];
}

const YouTubeWebsiteBuilder = () => {
  const [channelUrl, setChannelUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [channelData, setChannelData] = useState<YouTubeChannelData | null>(null);
  const [generatedWebsite, setGeneratedWebsite] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [youtubeApiKeys, setYoutubeApiKeys] = useState<any[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use ref to track channel subscription
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadYouTubeApiKeys();
      setupRealTimeUpdates();
    } else {
      setLoadingKeys(false);
    }
    
    return () => {
      cleanupRealTimeUpdates();
    };
  }, [user?.id]);

  const cleanupRealTimeUpdates = () => {
    if (channelRef.current) {
      console.log('Cleaning up YouTube API real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupRealTimeUpdates = () => {
    // Clean up any existing subscription first
    cleanupRealTimeUpdates();
    
    if (!user?.id) return;
    
    console.log('Setting up real-time updates for YouTube API keys');
    
    channelRef.current = supabase
      .channel(`youtube-api-keys-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'youtube_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time YouTube API key update received:', payload);
          loadYouTubeApiKeys();
          setError('');
          toast({
            title: "Real-time Update",
            description: "YouTube API keys updated"
          });
        }
      )
      .subscribe((status) => {
        console.log('YouTube API real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
  };

  const loadYouTubeApiKeys = async () => {
    if (!user?.id) {
      setLoadingKeys(false);
      return;
    }
    
    setLoadingKeys(true);
    
    try {
      console.log('Loading YouTube API keys for user:', user.id);
      
      const activeKey = await apiKeyManager.getActiveKey('youtube', user.id);
      const allKeys = await apiKeyManager.getAllKeys(user.id);
      
      console.log('Active YouTube key:', activeKey);
      console.log('All YouTube keys:', allKeys.youtube);

      setYoutubeApiKeys(allKeys.youtube || []);
      
      if (allKeys.youtube && allKeys.youtube.length > 0) {
        setError('');
        console.log('YouTube API keys loaded successfully:', allKeys.youtube.length);
      } else {
        console.log('No YouTube API keys found');
        setError('YouTube API keys not configured. Please add API keys in the admin panel.');
      }
    } catch (err) {
      console.error('Exception loading YouTube API keys:', err);
      setError('Failed to load YouTube API configuration');
      toast({
        title: "Error",
        description: "Failed to load YouTube API configuration",
        variant: "destructive"
      });
    } finally {
      setLoadingKeys(false);
    }
  };

  const extractChannelId = async (url: string) => {
    // Handle different YouTube URL formats
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const identifier = match[1];
        
        // If it starts with UC, it's already a channel ID
        if (identifier.startsWith('UC')) {
          return identifier;
        }
        
        // Otherwise, we need to convert username/handle to channel ID
        const apiKey = await apiKeyManager.getActiveKey('youtube', user?.id || '');
        if (!apiKey || !apiKey.api_key) {
          throw new Error('No YouTube API keys available');
        }

        try {
          const startTime = Date.now();
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${identifier}&type=channel&maxResults=1&key=${apiKey.api_key}`
          );
          const responseTime = Date.now() - startTime;
          
          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            
            // Track successful usage
            await apiKeyManager.updateUsage('youtube', apiKey.id, {
              quota_used: (apiKey.quota_used || 0) + 1
            });
            await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'search', 0, 0, responseTime, true);
            
            if (searchResult.items && searchResult.items.length > 0) {
              return searchResult.items[0].snippet.channelId;
            }
          } else {
            // Track failed usage
            await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'search', 0, 0, responseTime, false, `HTTP ${searchResponse.status}`);
          }
        } catch (err) {
          console.log('Could not resolve channel ID from username/handle:', err);
          await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'search', 0, 0, 0, false, err instanceof Error ? err.message : 'Unknown error');
        }
        
        return identifier; // Fallback to original identifier
      }
    }
    return null;
  };

  const fetchChannelData = async () => {
    if (!channelUrl.trim()) {
      setError('Please enter a valid YouTube channel URL');
      return;
    }

    if (youtubeApiKeys.length === 0) {
      setError('YouTube API keys not configured. Please add API keys in the admin panel.');
      return;
    }

    setIsLoading(true);
    setError('');
    setChannelData(null);

    try {
      console.log('Extracting channel ID from URL:', channelUrl);
      const channelId = await extractChannelId(channelUrl);

      if (!channelId) {
        setError('Invalid YouTube channel URL format');
        return;
      }

      console.log('Fetching channel data for ID:', channelId);

      // Get the best available API key
      const apiKey = await apiKeyManager.getActiveKey('youtube', user?.id || '');
      if (!apiKey || !apiKey.api_key) {
        setError('No YouTube API keys available');
        return;
      }

      console.log(`Using YouTube API key: ${apiKey.name}`);

      // Fetch channel data from YouTube API
      const startTime = Date.now();
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey.api_key}`
      );
      const channelResponseTime = Date.now() - startTime;

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error('YouTube API Error:', errorData);
        
        // Track failed usage
        await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'channels', 0, 0, channelResponseTime, false, `HTTP ${channelResponse.status}: ${errorData.error?.message || 'Failed to fetch channel data'}`);
        
        throw new Error(`YouTube API Error: ${errorData.error?.message || 'Failed to fetch channel data'}`);
      }

      const channelResult = await channelResponse.json();

      if (!channelResult.items || channelResult.items.length === 0) {
        await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'channels', 0, 0, channelResponseTime, false, 'Channel not found or private');
        setError('Channel not found or private');
        return;
      }

      // Track successful channel fetch
      await apiKeyManager.updateUsage('youtube', apiKey.id, {
        quota_used: (apiKey.quota_used || 0) + 1
      });
      await apiKeyManager.trackUsage('youtube', apiKey.id, user?.id || '', 'channels', 0, 0, channelResponseTime, true);

      // Fetch recent videos with another API key if needed
      console.log('Fetching recent videos for channel:', channelId);
      const videoApiKey = await apiKeyManager.getActiveKey('youtube', user?.id || '');
      if (!videoApiKey || !videoApiKey.api_key) {
        console.warn('No API key available for fetching videos, continuing with channel data only');
      }

      let videos = [];
      if (videoApiKey && videoApiKey.api_key) {
        const videoStartTime = Date.now();
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${videoApiKey.api_key}`
        );
        const videoResponseTime = Date.now() - videoStartTime;

        if (videosResponse.ok) {
          const videosResult = await videosResponse.json();
          videos = videosResult.items || [];
          
          // Track successful video fetch
          await apiKeyManager.updateUsage('youtube', videoApiKey.id, {
            quota_used: (videoApiKey.quota_used || 0) + 1
          });
          await apiKeyManager.trackUsage('youtube', videoApiKey.id, user?.id || '', 'search', 0, 0, videoResponseTime, true);
        } else {
          await apiKeyManager.trackUsage('youtube', videoApiKey.id, user?.id || '', 'search', 0, 0, videoResponseTime, false, `HTTP ${videosResponse.status}`);
        }
      }

      const channel = channelResult.items[0];

      const channelData: YouTubeChannelData = {
        channelId,
        channelName: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        videos: videos.map((video: any) => ({
          id: video.id.videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnail: video.snippet.thumbnails.medium.url,
          publishedAt: video.snippet.publishedAt
        }))
      };

      setChannelData(channelData);
      setSuccess('Channel data fetched successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('YouTube API Error:', err);
      setError(`Failed to fetch channel data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWebsite = async () => {
    if (!channelData) {
      setError('Please fetch channel data first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      // Mock website generation for now (replace with actual OpenRouter API call)
      const mockWebsiteCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData.channelName} - YouTube Channel</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; background: linear-gradient(135deg, #ff0000, #cc0000); color: white; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { text-align: center; padding: 60px 0; }
        .hero h1 { font-size: 3em; margin-bottom: 20px; }
        .stats { display: flex; justify-content: center; gap: 40px; margin: 40px 0; }
        .stat { text-align: center; }
        .stat-number { font-size: 2em; font-weight: bold; }
        .videos { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px; }
        .video-card { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; }
        .subscribe-btn { background: #ff0000; color: white; padding: 15px 30px; border: none; border-radius: 25px; font-size: 1.2em; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <div class="hero">
            <h1>${channelData.channelName}</h1>
            <p>${channelData.description}</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">${parseInt(channelData.subscriberCount).toLocaleString()}</div>
                    <div>Subscribers</div>
                </div>
                <div class="stat">
                    <div class="stat-number">${parseInt(channelData.videoCount).toLocaleString()}</div>
                    <div>Videos</div>
                </div>
            </div>
            <button class="subscribe-btn" onclick="window.open('https://youtube.com/channel/${channelData.channelId}', '_blank')">
                Subscribe on YouTube
            </button>
        </div>
        <div class="videos">
            ${channelData.videos.slice(0, 6).map(video => `
                <div class="video-card">
                    <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; border-radius: 5px;">
                    <h3 style="margin: 10px 0;">${video.title}</h3>
                    <p style="opacity: 0.8;">${video.description.substring(0, 100)}...</p>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

      setGeneratedWebsite(mockWebsiteCode);
      
      // Save generated website to analytics
      if (user?.id) {
        await supabase
          .from('analytics')
          .insert({
            user_id: user.id,
            event_type: 'generated_website',
            event_data: {
              channel_name: channelData.channelName,
              channel_id: channelData.channelId,
              website_code: mockWebsiteCode,
              created_at: new Date().toISOString()
            }
          });
      }

      setSuccess('Website generated successfully!');
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError('Failed to generate website. Please try again.');
      console.error('Website Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loadingKeys) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading YouTube API configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube Website Builder
            <div className="ml-auto flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </span>
              <span className="text-xs text-blue-400">
                {youtubeApiKeys.length} API Key{youtubeApiKeys.length !== 1 ? 's' : ''} Available
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="channel-url" className="text-white">
              YouTube Channel URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="channel-url"
                type="url"
                placeholder="https://youtube.com/@channelname or https://youtube.com/channel/UC..."
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Button 
                onClick={fetchChannelData} 
                disabled={isLoading || youtubeApiKeys.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>
          </div>

          {channelData && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {channelData.thumbnails?.medium?.url && (
                    <img 
                      src={channelData.thumbnails.medium.url} 
                      alt={channelData.channelName}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">{channelData.channelName}</h3>
                    <p className="text-gray-400 text-sm">{parseInt(channelData.subscriberCount).toLocaleString()} subscribers</p>
                    <p className="text-gray-400 text-sm">{parseInt(channelData.videoCount).toLocaleString()} videos</p>
                    <p className="text-gray-300 text-sm mt-2 line-clamp-3">
                      {channelData.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={generateWebsite} 
            disabled={!channelData || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Website...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Website with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedWebsite && (
        <Card className="bg-white/5 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Generated Website Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg h-96 overflow-hidden">
              <iframe 
                srcDoc={generatedWebsite}
                className="w-full h-full border-0"
                title="Website Preview"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <Button className="bg-green-600 hover:bg-green-700">
                <Globe className="mr-2 h-4 w-4" />
                Deploy to Netlify
              </Button>
              <Button variant="outline" className="text-white border-gray-600">
                Download Code
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubeWebsiteBuilder;
