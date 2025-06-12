
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Globe, Wifi, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiKeyManager } from '@/utils/apiKeyManager';

const YouTubeWebsiteBuilder = () => {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyAvailability, setKeyAvailability] = useState({
    youtube: false,
    openrouter: false,
    github: false,
    netlify: false
  });
  const [totalKeys, setTotalKeys] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      console.log('Checking API key availability...');
      const availability = await apiKeyManager.checkKeyAvailability();
      const total = await apiKeyManager.getTotalKeyCount();
      
      setKeyAvailability(availability);
      setTotalKeys(total);
      
      console.log('API Key Status:', availability);
      console.log('Total Keys:', total);
    } catch (error) {
      console.error('Error checking API keys:', error);
      toast({
        title: "Error",
        description: "Failed to check API key status",
        variant: "destructive"
      });
    }
  };

  const handleFetchChannel = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube channel URL",
        variant: "destructive"
      });
      return;
    }

    if (!keyAvailability.youtube) {
      toast({
        title: "Error",
        description: "YouTube API key not available. Please contact admin.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Fetching YouTube channel data for:', channelUrl);
      
      // Get the YouTube API key
      const youtubeKey = await apiKeyManager.getYouTubeKey();
      
      if (!youtubeKey) {
        throw new Error('YouTube API key not found');
      }

      console.log('Using YouTube API key for channel fetch');

      // Extract channel ID from URL
      let channelId = '';
      if (channelUrl.includes('/channel/')) {
        channelId = channelUrl.split('/channel/')[1];
      } else if (channelUrl.includes('/@')) {
        // For handle URLs, we'll need to resolve to channel ID
        const handle = channelUrl.split('/@')[1];
        console.log('Detected handle:', handle);
        
        // Search for channel by handle
        const searchResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${handle}&key=${youtubeKey}`
        );
        
        if (!searchResponse.ok) {
          throw new Error('Failed to search for channel');
        }
        
        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        } else {
          throw new Error('Channel not found');
        }
      }

      if (!channelId) {
        throw new Error('Could not extract channel ID from URL');
      }

      console.log('Extracted channel ID:', channelId);

      // Fetch channel details
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeKey}`
      );

      if (!channelResponse.ok) {
        throw new Error('Failed to fetch channel data');
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = channelData.items[0];
      console.log('Channel data fetched successfully:', channel);

      // Fetch latest videos
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=5&key=${youtubeKey}`
      );

      let videos = [];
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        videos = videosData.items || [];
      }

      toast({
        title: "Success",
        description: `Channel "${channel.snippet.title}" found! Redirecting to workspace...`,
      });

      // Redirect to workspace with channel data
      setTimeout(() => {
        navigate('/workspace', {
          state: {
            youtubeUrl: channelUrl,
            projectIdea: `YouTube Channel Website for ${channel.snippet.title}`,
            channelData: {
              id: channelId,
              title: channel.snippet.title,
              description: channel.snippet.description,
              thumbnail: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url,
              subscriberCount: channel.statistics.subscriberCount,
              videoCount: channel.statistics.videoCount,
              viewCount: channel.statistics.viewCount,
              customUrl: channel.snippet.customUrl,
              videos: videos
            }
          }
        });
      }, 1500);
      
    } catch (error) {
      console.error('Error fetching channel:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch channel data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-400' : 'text-red-400';
  };

  const getStatusText = (available: boolean) => {
    return available ? 'Connected' : 'Not Available';
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Youtube size={20} className="text-red-500" />
            YouTube Website Builder
            <div className="ml-auto flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              <Badge variant="outline" className="text-xs">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalKeys} API Keys Available
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">YouTube</span>
                {keyAvailability.youtube ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.youtube)}`}>
                {getStatusText(keyAvailability.youtube)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">OpenRouter</span>
                {keyAvailability.openrouter ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.openrouter)}`}>
                {getStatusText(keyAvailability.openrouter)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">GitHub</span>
                {keyAvailability.github ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.github)}`}>
                {getStatusText(keyAvailability.github)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Netlify</span>
                {keyAvailability.netlify ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.netlify)}`}>
                {getStatusText(keyAvailability.netlify)}
              </p>
            </div>
          </div>

          {/* Alert if YouTube API is not available */}
          {!keyAvailability.youtube && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                YouTube API keys not configured. Please contact the administrator to add API keys.
              </AlertDescription>
            </Alert>
          )}

          {/* Channel Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-url" className="text-white">YouTube Channel URL</Label>
              <Input
                id="channel-url"
                placeholder="https://youtube.com/@channelname or https://youtube.com/channel/UC..."
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
                disabled={loading || !keyAvailability.youtube}
              />
            </div>

            <Button 
              onClick={handleFetchChannel}
              disabled={loading || !keyAvailability.youtube || !channelUrl.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Channel...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Start Building Website
                </>
              )}
            </Button>
          </div>

          {/* Refresh Keys Button */}
          <div className="pt-4 border-t border-gray-700">
            <Button 
              onClick={checkApiKeys}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Refresh API Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default YouTubeWebsiteBuilder;
