
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Eye, 
  Save, 
  Settings,
  Globe,
  Github,
  Loader2,
  ArrowLeft,
  Monitor,
  Smartphone,
  Tablet,
  Play,
  Users,
  Video
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createProject, getProject, updateProject } from '@/utils/projectCreation';
import Chatbot from './Chatbot';
import { Textarea } from '@/components/ui/textarea';

const ModernWorkspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // State management
  const [sourceCode, setSourceCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Generated Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        .hero-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: white;
            text-align: center;
            padding: 2rem;
        }
        .profile-img {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 4px solid rgba(255, 255, 255, 0.3);
            margin-bottom: 2rem;
        }
        .channel-name {
            font-size: 4rem;
            font-weight: 700;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #00d4ff, #00ff88);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .welcome-text {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        .subscribe-btn {
            background: #ff0000;
            color: white;
            padding: 1rem 2rem;
            border: none;
            border-radius: 50px;
            font-size: 1.2rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            items: center;
            gap: 0.5rem;
        }
        .subscribe-btn:hover {
            background: #cc0000;
            transform: translateY(-2px);
        }
        .dots {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        .dot {
            position: absolute;
            width: 8px;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }
        .dot:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
        .dot:nth-child(2) { top: 60%; left: 80%; animation-delay: 2s; }
        .dot:nth-child(3) { top: 40%; left: 40%; animation-delay: 4s; }
        .dot:nth-child(4) { top: 80%; left: 20%; animation-delay: 1s; }
        @keyframes float {
            0%, 100% { transform: translateY(0px); opacity: 0.3; }
            50% { transform: translateY(-20px); opacity: 0.8; }
        }
    </style>
</head>
<body>
    <div class="hero-section">
        <div class="dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
        <img src="https://via.placeholder.com/120" alt="Channel Avatar" class="profile-img">
        <h1 class="channel-name">CHANNEL NAME</h1>
        <p class="welcome-text">Hi guys welcome 👋 to our new channel SUBSCRIBE to get satisfying vedio$</p>
        <button class="subscribe-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Subscribe Now
        </button>
    </div>
</body>
</html>`);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('My AI Website');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Initialize from location state
  React.useEffect(() => {
    if (location.state?.channelData) {
      setChannelData(location.state.channelData);
      // Update the default HTML with channel data
      if (location.state.channelData.title && location.state.channelData.thumbnail) {
        const updatedCode = sourceCode
          .replace('CHANNEL NAME', location.state.channelData.title)
          .replace('https://via.placeholder.com/120', location.state.channelData.thumbnail)
          .replace('Hi guys welcome 👋 to our new channel SUBSCRIBE to get satisfying vedio$', 
            `Hi guys welcome 👋 to ${location.state.channelData.title} SUBSCRIBE to get amazing content!`);
        setSourceCode(updatedCode);
      }
    }
    if (location.state?.projectId) {
      setProjectId(location.state.projectId);
      loadProject(location.state.projectId);
    }
    if (location.state?.projectIdea) {
      setProjectName(location.state.projectIdea);
    }
  }, [location.state]);

  const loadProject = async (id: string) => {
    try {
      const project = await getProject(id);
      setProjectName(project.name);
      setSourceCode(project.source_code || sourceCode);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const handleCodeUpdate = (newCode: string) => {
    setSourceCode(newCode);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save your project.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (projectId) {
        await updateProject(projectId, {
          name: projectName,
          sourceCode: sourceCode,
        });
        toast({
          title: "Project Saved",
          description: "Your project has been saved successfully.",
        });
      } else {
        const newProject = await createProject({
          name: projectName,
          description: "AI Generated Website",
          sourceCode: sourceCode,
          channelData: channelData,
        });
        setProjectId(newProject.id);
        toast({
          title: "Project Created",
          description: "Your new project has been created and saved.",
        });
      }
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

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Left Panel - AI Chat (Narrower) */}
      <div className="w-80 border-r border-purple-500/30 flex flex-col bg-gradient-to-b from-slate-800/50 to-purple-900/50 backdrop-blur-sm">
        {/* Chat Header with Status Dots */}
        <div className="h-16 border-b border-purple-500/30 flex items-center justify-between px-4 bg-black/20">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/user-dashboard')}
              variant="ghost"
              size="sm"
              className="gap-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
          
          {/* Status Indicator Dots */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{animationDelay: '1.5s'}}></div>
            </div>
            <span className="text-xs text-cyan-400 font-medium">AI Assistant</span>
          </div>
        </div>

        {/* Channel Info Bar */}
        {channelData && (
          <div className="p-3 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <img 
                src={channelData.thumbnail} 
                alt={channelData.title}
                className="w-10 h-10 rounded-full border-2 border-cyan-400/50"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-cyan-400 text-sm truncate">{channelData.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Users size={10} />
                  <span>{parseInt(channelData.subscriberCount).toLocaleString()}</span>
                  <Video size={10} />
                  <span>{parseInt(channelData.videoCount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Content */}
        <div className="flex-1">
          <Chatbot
            youtubeUrl={location.state?.youtubeUrl || ''}
            projectIdea={projectName}
            channelData={channelData}
          />
        </div>
      </div>

      {/* Right Panel - Preview/Code */}
      <div className="flex-1 flex flex-col">
        {/* Header with colorful gradient */}
        <div className="h-16 border-b border-purple-500/30 flex items-center justify-between px-6 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Project Info */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
              <div>
                <h2 className="font-semibold text-white text-sm">Building for: {channelData?.title || 'Unknown Channel'}</h2>
                <p className="text-xs text-gray-300">Desktop Preview • Live</p>
              </div>
            </div>

            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1 ml-4">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className="h-8 w-8 p-0"
              >
                <Monitor size={14} />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className="h-8 w-8 p-0"
              >
                <Tablet size={14} />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className="h-8 w-8 p-0"
              >
                <Smartphone size={14} />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2 bg-black/20 rounded-full px-3 py-1">
              <Eye className="h-4 w-4 text-cyan-400" />
              <Switch
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
                className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-cyan-500 data-[state=checked]:to-blue-500"
              />
              <Code className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-white ml-2">
                {isCodeView ? 'Code' : 'Preview'}
              </span>
            </div>

            {/* Action Buttons */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gradient-to-br from-slate-900 to-purple-900">
          {isCodeView ? (
            <div className="h-full p-6">
              <div className="h-full bg-slate-900/80 backdrop-blur-sm rounded-lg border border-purple-500/30 overflow-hidden">
                <div className="p-4 border-b border-purple-500/30 bg-black/20">
                  <h3 className="text-sm font-medium text-cyan-400">Source Code</h3>
                </div>
                <Textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-full resize-none font-mono text-sm bg-transparent border-0 text-green-400 p-4 rounded-none"
                  placeholder="Your generated code will appear here..."
                />
              </div>
            </div>
          ) : (
            <div className="h-full p-6 flex items-center justify-center">
              <div 
                className="bg-white rounded-lg shadow-2xl border-4 border-purple-500/20 overflow-hidden"
                style={{ 
                  width: getPreviewWidth(),
                  height: previewMode === 'mobile' ? '667px' : previewMode === 'tablet' ? '1024px' : '80vh',
                  maxWidth: '100%',
                  maxHeight: '100%'
                }}
              >
                <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  Live Preview
                </div>
                
                <iframe
                  srcDoc={sourceCode}
                  title="Website Preview"
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-purple-500/30 bg-gradient-to-r from-slate-800/50 to-purple-900/50 backdrop-blur-sm flex items-center justify-between px-6">
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></div>
            </div>
            Live Preview Active • {channelData?.title || 'Building...'}
          </div>
          
          <div className="flex items-center gap-2">
            {projectId && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Github className="h-3 w-3 mr-1" />
                  GitHub
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <Globe className="h-3 w-3 mr-1" />
                  Deploy
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernWorkspace;
