
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from '@/components/ui/switch';
import { 
  Code, 
  Eye, 
  Save, 
  Settings,
  Globe,
  Github,
  Loader2,
  Shield,
  Sparkles,
  Zap,
  Brain,
  Target,
  Palette,
  Layers,
  Maximize,
  Play,
  MonitorSpeaker
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import EnhancedAIChat from './EnhancedAIChat';
import ProjectVerificationDialog from '../user/ProjectVerificationDialog';

const PremiumWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Enhanced state management
  const [sourceCode, setSourceCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Premium AI Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      * { font-family: 'Inter', sans-serif; }
      .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .glass-effect { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.1); }
    </style>
</head>
<body class="bg-gray-900 text-white min-h-screen">
    <div class="gradient-bg min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <header class="glass-effect rounded-2xl p-6 mb-8">
                <h1 class="text-4xl font-bold text-center mb-4">Premium AI Website</h1>
                <p class="text-xl text-center opacity-90">Built with cutting-edge AI technology</p>
            </header>
            
            <main class="glass-effect rounded-2xl p-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white/10 rounded-xl p-6">
                        <h3 class="text-xl font-semibold mb-4">AI Features</h3>
                        <p>Experience the future of web development with AI-powered components.</p>
                    </div>
                    <div class="bg-white/10 rounded-xl p-6">
                        <h3 class="text-xl font-semibold mb-4">Premium Design</h3>
                        <p>Beautiful, responsive designs that adapt to your content seamlessly.</p>
                    </div>
                    <div class="bg-white/10 rounded-xl p-6">
                        <h3 class="text-xl font-semibold mb-4">Real-time Updates</h3>
                        <p>See changes instantly as you modify your website with natural language.</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
</body>
</html>`);
  
  const [projectId, setProjectId] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('Premium AI Website');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiModel, setAiModel] = useState('premium');
  const [isVerified, setIsVerified] = useState(false);

  // Initialize from location state
  useEffect(() => {
    if (location.state?.channelData) {
      setChannelData(location.state.channelData);
      generateYouTubeWebsite(location.state.channelData);
    }
    if (location.state?.projectId) {
      setProjectId(location.state.projectId);
    }
    if (location.state?.projectIdea) {
      setProjectName(location.state.projectIdea);
    }
  }, [location.state]);

  const generateYouTubeWebsite = (data: any) => {
    const youtubeCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Official Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      * { font-family: 'Poppins', sans-serif; }
      .youtube-gradient { background: linear-gradient(135deg, #ff0000, #cc0000, #990000); }
      .glass-card { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-900 via-purple-900 to-red-900 text-white min-h-screen">
    <header class="glass-card rounded-2xl m-4 p-6">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <img src="${data.thumbnail}" alt="${data.title}" class="w-16 h-16 rounded-full border-4 border-red-500 shadow-xl">
                <div>
                    <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">${data.title}</h1>
                    <p class="text-gray-300">${parseInt(data.subscriberCount).toLocaleString()} subscribers</p>
                </div>
            </div>
            <a href="${location.state?.youtubeUrl}" target="_blank" class="youtube-gradient px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg">
                Subscribe Now
            </a>
        </div>
    </header>

    <main class="m-4">
        <section class="glass-card rounded-2xl p-8 mb-8 text-center">
            <h2 class="text-4xl font-bold mb-4">Welcome to ${data.title}</h2>
            <p class="text-xl text-gray-300 mb-8">Join our amazing community of ${parseInt(data.subscriberCount).toLocaleString()} subscribers!</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-red-400">${parseInt(data.subscriberCount).toLocaleString()}</div>
                    <div class="text-gray-300">Subscribers</div>
                </div>
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-green-400">${parseInt(data.videoCount || '100').toLocaleString()}</div>
                    <div class="text-gray-300">Videos</div>
                </div>
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-blue-400">${parseInt(data.viewCount || '1000000').toLocaleString()}</div>
                    <div class="text-gray-300">Total Views</div>
                </div>
            </div>
        </section>

        <section class="glass-card rounded-2xl p-8">
            <h3 class="text-2xl font-bold mb-6 text-center">Latest Content</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="glass-card rounded-xl p-4 hover:scale-105 transition-transform">
                    <div class="w-full h-40 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                        <span class="text-white font-bold">Latest Video</span>
                    </div>
                    <h4 class="font-semibold text-white">Amazing Content Title</h4>
                    <p class="text-gray-400 text-sm">1.2M views • 2 days ago</p>
                </div>
                <div class="glass-card rounded-xl p-4 hover:scale-105 transition-transform">
                    <div class="w-full h-40 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mb-4 flex items-center justify-center">
                        <span class="text-white font-bold">Popular Video</span>
                    </div>
                    <h4 class="font-semibold text-white">Trending Topic</h4>
                    <p class="text-gray-400 text-sm">856K views • 1 week ago</p>
                </div>
                <div class="glass-card rounded-xl p-4 hover:scale-105 transition-transform">
                    <div class="w-full h-40 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg mb-4 flex items-center justify-center">
                        <span class="text-white font-bold">Featured</span>
                    </div>
                    <h4 class="font-semibold text-white">Special Episode</h4>
                    <p class="text-gray-400 text-sm">2.1M views • 2 weeks ago</p>
                </div>
            </div>
        </section>
    </main>
</body>
</html>`;
    setSourceCode(youtubeCode);
  };

  const handleCodeUpdate = (newCode: string) => {
    setSourceCode(newCode);
    toast({
      title: "🎨 Code Updated",
      description: "Your AI-powered changes have been applied successfully!",
    });
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your premium project.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .upsert({
          id: projectId || undefined,
          user_id: user.id,
          name: projectName,
          description: "Premium AI Generated Website",
          source_code: sourceCode,
          channel_data: channelData,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      if (!projectId) {
        setProjectId(data.id);
      }

      toast({
        title: "🎉 Project Saved",
        description: "Your premium project has been saved successfully!",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerificationRequest = () => {
    toast({
      title: "🚀 Verification Requested",
      description: "Your project has been submitted for premium verification!",
    });
    setIsVerified(true);
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '100%', transform: 'scale(0.8)' };
      case 'tablet':
        return { width: '768px', height: '100%', transform: 'scale(0.9)' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex overflow-hidden">
      {/* Left Panel - Premium AI Chat */}
      <div className="w-2/5 relative overflow-hidden border-r border-white/10">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-800/30 to-blue-900/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,119,198,0.3),transparent_50%)]"></div>
        </div>
        
        {/* Chat Content */}
        <div className="relative z-10 h-full flex flex-col backdrop-blur-sm">
          {/* Premium Header */}
          <div className="p-6 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-4 h-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <h2 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">
                  Premium AI Assistant
                </h2>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
                  <Sparkles className="w-3 h-3 mr-1" />
                  PREMIUM
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                
                {!isVerified && (
                  <Button
                    onClick={handleVerificationRequest}
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Get Verified
                  </Button>
                )}
              </div>
            </div>

            {/* AI Model Selector */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-300">AI Model:</span>
              <div className="flex gap-2">
                {['premium', 'pro', 'advanced'].map((model) => (
                  <Button
                    key={model}
                    variant={aiModel === model ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setAiModel(model)}
                    className={aiModel === model ? "bg-gradient-to-r from-blue-500 to-purple-500" : ""}
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    {model.charAt(0).toUpperCase() + model.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced AI Chat */}
          <div className="flex-1 overflow-hidden">
            <EnhancedAIChat
              projectId={projectId || 'premium-temp'}
              sourceCode={sourceCode}
              channelData={channelData}
              onCodeUpdate={handleCodeUpdate}
              aiModel={aiModel}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Premium Preview */}
      <div className="w-3/5 flex flex-col bg-black/20">
        {/* Premium Controls Header */}
        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-white">
                {channelData?.title || projectName}
              </div>
              {isVerified && (
                <Badge className="bg-gradient-to-r from-green-400 to-blue-400 text-black text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  VERIFIED
                </Badge>
              )}
            </div>
            
            {/* Device Preview Modes */}
            <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
              {[
                { mode: 'desktop', icon: MonitorSpeaker, label: 'Desktop' },
                { mode: 'tablet', icon: Layers, label: 'Tablet' },
                { mode: 'mobile', icon: Target, label: 'Mobile' }
              ].map(({ mode, icon: Icon, label }) => (
                <Button
                  key={mode}
                  variant={previewMode === mode ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode(mode as any)}
                  className={previewMode === mode ? "bg-white/20 text-white" : "text-gray-400 hover:text-white"}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
              />
              <label htmlFor="view-mode" className="text-sm text-gray-300 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </div>
            
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-900 to-black">
          {isCodeView ? (
            <div className="h-full p-6">
              <div className="h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="ml-4 text-sm text-gray-300 font-mono">premium-website.html</span>
                  </div>
                </div>
                <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-full bg-transparent text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"
                  style={{ 
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(20,20,30,0.9) 100%)',
                    fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div 
                className="bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-500 border-4 border-white/20"
                style={getPreviewDimensions()}
              >
                <iframe
                  srcDoc={sourceCode}
                  className="w-full h-full border-0"
                  title="Premium Website Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Premium Footer */}
        <div className="h-12 border-t border-white/10 bg-black/30 backdrop-blur-md flex items-center justify-between px-6">
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
              <span>Premium AI Active</span>
            </div>
            <div className="w-1 h-4 bg-gray-600"></div>
            <span>Model: {aiModel.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {projectId && (
              <>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-gray-400 hover:text-white">
                  <Github className="h-3 w-3 mr-1" />
                  Export to GitHub
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-gray-400 hover:text-white">
                  <Globe className="h-3 w-3 mr-1" />
                  Deploy Live
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumWorkspace;
