
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
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔑 Checking API key availability...');
      const availability = await apiKeyManager.checkKeyAvailability();
      const total = await apiKeyManager.getTotalKeyCount();
      
      setKeyAvailability(availability);
      setTotalKeys(total);
      
      console.log('✅ API Key Status:', availability);
      console.log('📊 Total Keys:', total);
    } catch (error) {
      console.error('❌ Error checking API keys:', error);
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
      console.log('🎥 Fetching YouTube channel data for:', channelUrl);

      // Extract channel identifier from URL
      let channelIdentifier = '';
      if (channelUrl.includes('/channel/')) {
        channelIdentifier = channelUrl.split('/channel/')[1].split('/')[0];
      } else if (channelUrl.includes('/@')) {
        channelIdentifier = channelUrl.split('/@')[1].split('/')[0];
      } else if (channelUrl.includes('/c/')) {
        channelIdentifier = channelUrl.split('/c/')[1].split('/')[0];
      } else if (channelUrl.includes('/user/')) {
        channelIdentifier = channelUrl.split('/user/')[1].split('/')[0];
      } else {
        // Try to extract from basic URL patterns
        const urlParts = channelUrl.replace('https://www.youtube.com/', '').replace('https://youtube.com/', '');
        channelIdentifier = urlParts.split('/')[0];
      }

      if (!channelIdentifier) {
        throw new Error('Could not extract channel identifier from URL');
      }

      console.log('🔍 Extracted channel identifier:', channelIdentifier);

      // Call YouTube integration edge function
      const { data: channelResponse, error: fetchError } = await supabase.functions.invoke('youtube-integration', {
        body: {
          channelIdentifier,
          fetchVideos: true,
          maxResults: 12
        }
      });

      if (fetchError) {
        console.error('❌ YouTube API error:', fetchError);
        throw new Error(fetchError.message || 'Failed to fetch channel data');
      }

      if (!channelResponse?.channel) {
        throw new Error('Channel not found or invalid response');
      }

      const channel = channelResponse.channel;
      console.log('✅ Channel data fetched successfully:', channel.title);

      // Create project in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const projectData = {
        name: `${channel.title} Website`,
        description: `YouTube website for ${channel.title} - ${parseInt(channel.subscriberCount || '0').toLocaleString()} subscribers`,
        user_id: user.id,
        youtube_url: channelUrl,
        channel_data: channel,
        status: 'active'
      };

      console.log('💾 Creating project in database...');
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) {
        console.error('❌ Project creation error:', projectError);
        throw new Error('Failed to create project in database');
      }

      console.log('✅ Project created successfully:', project.id);

      toast({
        title: "🎉 Success!",
        description: `Channel "${channel.title}" analyzed! Redirecting to workspace...`
      });

      // Navigate to workspace with project data
      setTimeout(() => {
        navigate('/workspace', {
          state: {
            projectId: project.id,
            youtubeUrl: channelUrl,
            projectIdea: `YouTube Channel Website for ${channel.title}`,
            channelData: channel
          }
        });
      }, 1500);

    } catch (error) {
      console.error('❌ Error in handleFetchChannel:', error);
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
          {/* API Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">YouTube</span>
                {keyAvailability.youtube ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.youtube)}`}>
                {getStatusText(keyAvailability.youtube)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">AI Intelligence</span>
                {keyAvailability.openrouter ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.openrouter)}`}>
                {getStatusText(keyAvailability.openrouter)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">GitHub</span>
                {keyAvailability.github ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
              </div>
              <p className={`text-xs ${getStatusColor(keyAvailability.github)}`}>
                {getStatusText(keyAvailability.github)}
              </p>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Netlify</span>
                {keyAvailability.netlify ? 
                  <CheckCircle className="h-4 w-4 text-green-400" /> : 
                  <AlertCircle className="h-4 w-4 text-red-400" />
                }
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

          {/* Channel Input Section */}
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
              className="w-full border-gray-600 text-gray-300 hover:bg-white/10"
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
