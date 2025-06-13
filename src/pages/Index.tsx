
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Youtube, Sparkles, Code, Globe, Loader2, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
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
        variant: "destructive"
      });
      return;
    }

    if (!validateYouTubeUrl(youtubeUrl)) {
      toast({
        title: "Invalid URL", 
        description: "Please enter a valid YouTube channel URL",
        variant: "destructive"
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
          description: `Successfully loaded ${data.title} with ${parseInt(data.subscriberCount).toLocaleString()} subscribers`
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
        variant: "destructive"
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
        variant: "destructive"
      });
      return;
    }

    if (!urlValidated || !channelData) {
      toast({
        title: "Validation Required",
        description: "Please validate your YouTube channel first",
        variant: "destructive"
      });
      return;
    }

    if (!projectIdea.trim()) {
      toast({
        title: "Project Idea Required",
        description: "Please describe what you want to build",
        variant: "destructive"
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Youtube className="h-8 w-8 text-primary" />
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <Code className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Transform Your YouTube Channel into a Website
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              AI-powered website generation from your YouTube content
            </p>
            <ServiceStatusIndicators />
          </div>

          {/* Main Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Create Your AI Website
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* YouTube URL Input */}
              <div className="space-y-2">
                <Label htmlFor="youtube-url">YouTube Channel URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="youtube-url"
                    type="url"
                    placeholder="https://youtube.com/@yourchannel"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleValidateChannel}
                    disabled={isValidating || youtubeLoading}
                    variant={urlValidated ? "secondary" : "default"}
                  >
                    {isValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : urlValidated ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      "Validate"
                    )}
                  </Button>
                </div>
                {channelData && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      <strong>{channelData.title}</strong> - {parseInt(channelData.subscriberCount).toLocaleString()} subscribers
                    </span>
                  </div>
                )}
              </div>

              {/* Project Idea Input */}
              <div className="space-y-2">
                <Label htmlFor="project-idea">What do you want to build?</Label>
                <Textarea
                  id="project-idea"
                  placeholder="Describe your website idea (e.g., portfolio site, landing page, blog, etc.)"
                  value={projectIdea}
                  onChange={(e) => setProjectIdea(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Create Button */}
              <Button 
                onClick={handleCreateProject}
                size="lg"
                className="w-full"
                disabled={!urlValidated || !projectIdea.trim()}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Create AI Website
              </Button>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Youtube className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">YouTube Integration</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically pulls content from your YouTube channel
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">AI Generated</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Powered by advanced AI to create stunning websites
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Code className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Live Preview</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  See your website come to life in real-time
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
