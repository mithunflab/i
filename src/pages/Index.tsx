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
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    fetchChannelData,
    loading: youtubeLoading
  } = useYouTubeIntegration();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [projectIdea, setProjectIdea] = useState('');
  const [channelData, setChannelData] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [urlValidated, setUrlValidated] = useState(false);
  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [/^https?:\/\/(www\.)?youtube\.com\/channel\/[a-zA-Z0-9_-]+/, /^https?:\/\/(www\.)?youtube\.com\/c\/[a-zA-Z0-9_-]+/, /^https?:\/\/(www\.)?youtube\.com\/user\/[a-zA-Z0-9_-]+/, /^https?:\/\/(www\.)?youtube\.com\/@[a-zA-Z0-9_-]+/, /^https?:\/\/(www\.)?youtube\.com\/[a-zA-Z0-9_-]+$/];
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
  return;
};
export default Index;