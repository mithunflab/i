
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadYouTubeApiKey();
    setupRealTimeUpdates();
  }, []);

  const setupRealTimeUpdates = () => {
    console.log('Setting up real-time updates for YouTube API key');
    
    const channel = supabase
      .channel('youtube-api-key-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `provider=eq.YouTube`
        },
        (payload) => {
          console.log('Real-time YouTube API key update:', payload);
          loadYouTubeApiKey();
          toast({
            title: "Real-time Update",
            description: "YouTube API key updated"
          });
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('YouTube API real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up YouTube API real-time subscription');
      supabase.removeChannel(channel);
    };
  };

  const loadYouTubeApiKey = async () => {
    try {
      console.log('Loading YouTube API key from api_keys table');
      
      // Fetch from api_keys table where provider is YouTube
      const { data: apiKeyData, error } = await supabase
        .from('api_keys')
        .select('key_value')
        .eq('provider', 'YouTube')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading YouTube API key:', error);
        if (error.code !== 'PGRST116') { // Not found error
          setError('Failed to load YouTube API configuration');
        }
        return;
      }

      if (apiKeyData && apiKeyData.key_value) {
        setYoutubeApiKey(apiKeyData.key_value);
        console.log('YouTube API key loaded successfully');
      } else {
        console.log('No YouTube API key found');
      }
    } catch (err) {
      console.error('Exception loading YouTube API key:', err);
      setError('Failed to load YouTube API configuration');
    }
  };

  const extractChannelId = (url: string) => {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
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
      const channelId = extractChannelId(channelUrl);

      if (!channelId) {
        setError('Invalid YouTube channel URL format');
        return;
      }

      // Fetch channel data from YouTube API
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      );

      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel data');
      }

      const channelResult = await channelResponse.json();

      if (!channelResult.items || channelResult.items.length === 0) {
        setError('Channel not found or private');
        return;
      }

      // Fetch recent videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${youtubeApiKey}`
      );

      const videosResult = await videosResponse.json();

      const channel = channelResult.items[0];
      const videos = videosResult.items || [];

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

    } catch (err) {
      setError('Failed to fetch channel data. Please check the URL and try again.');
      console.error('YouTube API Error:', err);
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
      // Use OpenRouter API to generate website
      const prompt = `Create a modern, responsive website for the YouTube channel "${channelData.channelName}". 
      
      Channel Info:
      - Name: ${channelData.channelName}
      - Description: ${channelData.description}
      - Subscribers: ${channelData.subscriberCount}
      - Videos: ${channelData.videoCount}
      
      Recent Videos: ${channelData.videos.map(v => v.title).join(', ')}
      
      Generate a complete HTML website with:
      1. Modern CSS styling with gradients and animations
      2. Hero section with channel branding
      3. About section with channel description
      4. Video gallery showcasing recent videos
      5. Subscribe section with call-to-action
      6. Contact/social media footer
      7. Mobile-responsive design
      8. Professional color scheme matching YouTube branding
      
      Return only the complete HTML code with embedded CSS and any necessary JavaScript.`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-or-v1-your-api-key-here', // This would be from environment
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-sonnet:beta',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate website');
      }

      const result = await response.json();
      const websiteCode = result.choices[0].message.content;

      setGeneratedWebsite(websiteCode);
      
      // Save generated website to database
      await supabase
        .from('analytics')
        .insert({
          user_id: user?.id,
          event_type: 'generated_website',
          event_data: {
            channel_name: channelData.channelName,
            channel_id: channelData.channelId,
            website_code: websiteCode,
            created_at: new Date().toISOString()
          }
        });

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

          {!youtubeApiKey && (
            <Alert className="border-yellow-500 text-yellow-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                YouTube API key not configured. Please contact administrator to set up the API key.
              </AlertDescription>
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
                    <p className="text-gray-400 text-sm">{channelData.subscriberCount} subscribers</p>
                    <p className="text-gray-400 text-sm">{channelData.videoCount} videos</p>
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
