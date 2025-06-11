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
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use ref to track channel subscription
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadYouTubeApiKey();
      setupRealTimeUpdates();
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
    
    console.log('Setting up real-time updates for YouTube API key');
    
    channelRef.current = supabase
      .channel(`youtube-api-key-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time YouTube API key update:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.user_id === user?.id && 
                (payload.new.provider === 'YouTube' || payload.new.provider === 'YouTube Data API v3')) {
              setYoutubeApiKey(payload.new.key_value || '');
              setError('');
              toast({
                title: "Real-time Update",
                description: "YouTube API key updated"
              });
            }
          }
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('YouTube API real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
  };

  const loadYouTubeApiKey = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Loading YouTube API key from api_keys table for user:', user.id);
      
      const { data: apiKeyData, error } = await supabase
        .from('api_keys')
        .select('key_value, is_active, provider')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .in('provider', ['YouTube', 'YouTube Data API v3'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading YouTube API key:', error);
        setError('Failed to load YouTube API configuration');
        return;
      }

      console.log('YouTube API key data:', apiKeyData);

      if (apiKeyData && apiKeyData.length > 0 && apiKeyData[0].key_value) {
        setYoutubeApiKey(apiKeyData[0].key_value);
        setError('');
        console.log('YouTube API key loaded successfully');
      } else {
        console.log('No active YouTube API key found');
        setYoutubeApiKey('');
        setError('YouTube API key not configured. Please contact administrator.');
      }
    } catch (err) {
      console.error('Exception loading YouTube API key:', err);
      setError('Failed to load YouTube API configuration');
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
        try {
          const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${identifier}&type=channel&maxResults=1&key=${youtubeApiKey}`
          );
          
          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            if (searchResult.items && searchResult.items.length > 0) {
              return searchResult.items[0].snippet.channelId;
            }
          }
        } catch (err) {
          console.log('Could not resolve channel ID from username/handle:', err);
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

    if (!youtubeApiKey) {
      setError('YouTube API key not configured. Please contact administrator.');
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

      // Fetch channel data from YouTube API
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      );

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error('YouTube API Error:', errorData);
        throw new Error(`YouTube API Error: ${errorData.error?.message || 'Failed to fetch channel data'}`);
      }

      const channelResult = await channelResponse.json();

      if (!channelResult.items || channelResult.items.length === 0) {
        setError('Channel not found or private');
        return;
      }

      // Fetch recent videos
      console.log('Fetching recent videos for channel:', channelId);
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${youtubeApiKey}`
      );

      let videos = [];
      if (videosResponse.ok) {
        const videosResult = await videosResponse.json();
        videos = videosResult.items || [];
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
                disabled={isLoading || !youtubeApiKey}
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
