
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Youtube, 
  Sparkles, 
  Code, 
  Globe, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useYouTubeIntegration } from '@/hooks/useYouTubeIntegration';
import ServiceStatusIndicators from '@/components/ui/ServiceStatusIndicators';

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchChannelData, loading: youtubeLoading } = useYouTubeIntegration();

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [channelData, setChannelData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9_-]+$/
    ];
    return patterns.some(pattern => pattern.test(url));
  };

  const handleValidateChannel = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a YouTube channel URL",
        variant: "destructive",
      });
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    try {
      console.log('🔍 Validating YouTube channel:', youtubeUrl);
      
      const data = await fetchChannelData(youtubeUrl);
      
      if (data) {
        setChannelData(data);
        setUrlValidated(true);
        
        toast({
          title: "Channel Found!",
          description: `Successfully loaded ${data.title} with ${parseInt(data.subscriberCount).toLocaleString()} subscribers`,
        });
        
        console.log('✅ Channel validated:', data);
      } else {
        throw new Error('Channel data not available');
      }
    } catch (error) {
      console.error('❌ Channel validation failed:', error);
      toast({
        title: "Channel Not Found",
        description: "Please check the URL and try again. Make sure the channel is public.",
        variant: "destructive",
      });
      setUrlValidated(false);
      setChannelData(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateProject = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to create a project",
        variant: "destructive",
      });
      return;
    }

    if (!urlValidated || !channelData) {
      toast({
        title: "Validation Required",
        description: "Please validate your YouTube channel first",
        variant: "destructive",
      });
      return;
    }

    if (!projectIdea.trim()) {
      toast({
        title: "Project Idea Required",
        description: "Please describe what you want to build",
        variant: "destructive",
      });
      return;
    }

    // Navigate to workspace with channel data
    navigate('/workspace', {
      state: {
        youtubeUrl,
        projectIdea,
        channelData
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AI Website Builder</h1>
                <p className="text-sm text-gray-400">Create stunning websites with AI</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <ServiceStatusIndicators />
              {user ? (
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                  Logged in as {user.email}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-600/20 text-red-400 border-red-600/30">
                  Not logged in
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-yellow-400" />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                AI Website Builder
              </h1>
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <p className="text-xl text-gray-300 mb-8">
              Transform your YouTube channel into a stunning website with AI
            </p>
            
            {/* Service Status */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <Globe className="h-5 w-5 text-blue-400" />
              <span className="text-gray-400">Platform Status:</span>
              <ServiceStatusIndicators />
            </div>
          </div>

          {/* Main Card */}
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Youtube className="h-6 w-6 text-red-500" />
                Create Your AI-Powered Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: YouTube URL */}
              <div className="space-y-3">
                <Label htmlFor="youtube-url" className="text-gray-300 font-medium">
                  Step 1: YouTube Channel URL *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="youtube-url"
                    placeholder="https://youtube.com/@yourchannel"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setUrlValidated(false);
                      setChannelData(null);
                    }}
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                    disabled={isValidating}
                  />
                  <Button
                    onClick={handleValidateChannel}
                    disabled={isValidating || youtubeLoading}
                    className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                  >
                    {isValidating || youtubeLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validating...
                      </>
                    ) : urlValidated ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Validated
                      </>
                    ) : (
                      'Validate'
                    )}
                  </Button>
                </div>
                
                {/* Channel Info */}
                {urlValidated && channelData && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img 
                        src={channelData.thumbnail} 
                        alt={channelData.title}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="text-white font-semibold">{channelData.title}</h3>
                        <p className="text-green-400 text-sm">
                          {parseInt(channelData.subscriberCount).toLocaleString()} subscribers • {' '}
                          {parseInt(channelData.videoCount).toLocaleString()} videos
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-400 ml-auto" />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Project Idea */}
              <div className="space-y-3">
                <Label htmlFor="project-idea" className="text-gray-300 font-medium">
                  Step 2: Describe Your Website Vision *
                </Label>
                <Textarea
                  id="project-idea"
                  placeholder="I want to create a modern portfolio website that showcases my YouTube content with a professional landing page, video gallery, and contact section..."
                  value={projectIdea}
                  onChange={(e) => setProjectIdea(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white min-h-[120px] resize-none"
                  rows={5}
                />
                <p className="text-gray-400 text-sm">
                  Be specific about features, style, and functionality you want
                </p>
              </div>

              {/* Create Button */}
              <div className="pt-4">
                <Button
                  onClick={handleCreateProject}
                  disabled={!urlValidated || !projectIdea.trim() || !user}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 text-lg font-semibold"
                >
                  {!user ? (
                    <>
                      <AlertCircle className="mr-2 h-5 w-5" />
                      Please Log In First
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Create AI Website
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                
                {!user && (
                  <p className="text-center text-gray-400 text-sm mt-2">
                    Create an account to start building your AI-powered website
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Preview */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-6 text-center">
                <Youtube className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">YouTube Integration</h3>
                <p className="text-gray-400 text-sm">
                  Automatically fetch your channel data, videos, and statistics
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-6 text-center">
                <Sparkles className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">AI-Powered Design</h3>
                <p className="text-gray-400 text-sm">
                  Generate stunning, responsive websites with advanced AI
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Real-time Preview</h3>
                <p className="text-gray-400 text-sm">
                  See your website come to life instantly with live preview
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
