
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Code, 
  Eye, 
  Youtube,
  Monitor,
  Smartphone,
  Tablet,
  Send,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SimplifiedChatbot from './SimplifiedChatbot';
import CodePreview from './CodePreview';
import { useProjectFileManager } from '@/hooks/useProjectFileManager';

const YouTubeWorkspace: React.FC = () => {
  const location = useLocation();
  const { youtubeUrl, projectIdea, channelData } = location.state || {};
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeView, setIsCodeView] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [ytUrl, setYtUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(!channelData);
  const { toast } = useToast();
  
  const {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    generateWebsiteCode
  } = useProjectFileManager();

  useEffect(() => {
    if (channelData) {
      const initialCode = generateWebsiteCode(channelData);
      setGeneratedCode(initialCode);
    }
  }, [channelData, generateWebsiteCode]);

  const handleCodeUpdate = (newCode: string, targetFile?: string) => {
    setGeneratedCode(newCode);
    if (targetFile) {
      updateFileContent(targetFile, newCode);
    } else {
      updateFileContent('index.html', newCode);
    }
    toast({
      title: "Website Updated",
      description: "Your changes have been applied successfully",
    });
  };

  const handleYouTubeUrlSubmit = async () => {
    if (!ytUrl.trim()) return;
    
    try {
      const data = await fetchYouTubeData(ytUrl);
      setShowUrlInput(false);
      const newCode = generateWebsiteCode(data);
      setGeneratedCode(newCode);
      toast({
        title: "YouTube Data Fetched",
        description: `Successfully loaded data for ${data.title}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch YouTube data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVerificationRequest = () => {
    toast({
      title: "Verification Request Sent",
      description: "Your project has been submitted for developer verification.",
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-red-950 via-red-900 to-black flex overflow-hidden relative">
      {/* Premium Red Shiny Texture Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 via-red-800/20 to-black/40"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(220,38,38,0.3),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(239,68,68,0.3),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-noise opacity-10"></div>
      
      {/* Left Panel - Chat (2/6 ratio) */}
      <div className="w-1/3 relative overflow-hidden border-r border-red-500/20 backdrop-blur-sm">
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-red-500/20 bg-red-950/30 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-3 h-3 bg-red-400 rounded-full animate-ping opacity-75"></div>
                </div>
                <h2 className="font-semibold text-white">AI Workspace</h2>
                <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-500/30">
                  Active
                </Badge>
              </div>
              <Button
                onClick={handleVerificationRequest}
                size="sm"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Send for Verification
              </Button>
            </div>
          </div>

          {/* YouTube URL Input */}
          {showUrlInput && (
            <div className="p-4 bg-red-900/20 border-b border-red-500/20 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Enter YouTube channel URL..."
                  className="flex-1 bg-red-950/50 border-red-500/30 text-white placeholder-red-300/60"
                />
                <Button
                  onClick={handleYouTubeUrlSubmit}
                  size="sm"
                  disabled={!ytUrl.trim()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Youtube className="w-4 h-4 mr-1" />
                  Fetch
                </Button>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 min-h-0">
            <SimplifiedChatbot
              projectId="youtube-workspace"
              sourceCode={generatedCode}
              channelData={channelData || youtubeData}
              onCodeUpdate={handleCodeUpdate}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Preview/Code (4/6 ratio) */}
      <div className="w-2/3 flex flex-col bg-red-950/20 backdrop-blur-sm relative">
        {/* Header */}
        <div className="h-14 border-b border-red-500/20 flex items-center justify-between px-4 bg-red-950/30 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-white">
                {channelData?.title || youtubeData?.title || 'Workspace'}
              </div>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className={previewMode === 'desktop' ? "bg-red-600/50 text-white" : "text-red-300 hover:text-white hover:bg-red-600/30"}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className={previewMode === 'tablet' ? "bg-red-600/50 text-white" : "text-red-300 hover:text-white hover:bg-red-600/30"}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className={previewMode === 'mobile' ? "bg-red-600/50 text-white" : "text-red-300 hover:text-white hover:bg-red-600/30"}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
              />
              <label htmlFor="view-mode" className="text-sm text-red-200 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-4 w-4 text-red-300" /> : <Eye className="h-4 w-4 text-red-300" />}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isCodeView ? (
            <CodePreview
              generatedCode={generatedCode}
              projectFiles={projectFiles}
              isLiveTyping={true}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              {generatedCode ? (
                <div 
                  className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-red-500/30"
                  style={getPreviewDimensions()}
                >
                  <iframe
                    srcDoc={generatedCode}
                    className="w-full h-full border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                <div className="text-center text-red-200">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No content to preview</p>
                  <p className="text-sm">Generate code using the AI chat or enter a YouTube URL</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-8 border-t border-red-500/20 bg-red-950/30 backdrop-blur-md flex items-center justify-between px-4 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            Live Preview Active
          </div>
          <div>
            Ready to build
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeWorkspace;
