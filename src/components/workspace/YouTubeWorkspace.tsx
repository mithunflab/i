
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
  CheckCircle,
  Github,
  GitBranch,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SimplifiedChatbot from './SimplifiedChatbot';
import CodePreview from './CodePreview';
import { useProjectFileManager } from '@/hooks/useProjectFileManager';
import { useGitHubIntegration } from '@/hooks/useGitHubIntegration';

const YouTubeWorkspace: React.FC = () => {
  const location = useLocation();
  const { youtubeUrl, projectIdea, channelData } = location.state || {};
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeView, setIsCodeView] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [ytUrl, setYtUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(!channelData);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const { toast } = useToast();
  
  const {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    generateWebsiteCode
  } = useProjectFileManager();

  const { createGitHubRepo, updateGitHubRepo, loading: githubLoading } = useGitHubIntegration();

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

  const handleGitHubUpload = async () => {
    try {
      const projectName = channelData?.title || 'YouTube Website';
      const description = `AI-generated website for ${channelData?.title || 'YouTube channel'}`;
      
      // Prepare all files for upload
      const allFiles = projectFiles.map(file => ({
        path: file.name,
        content: file.content || '',
        action: 'create' as const
      }));

      // Add chat history file
      allFiles.push({
        path: 'chat-history.json',
        content: JSON.stringify(chatHistory, null, 2),
        action: 'create' as const
      });

      const repo = await createGitHubRepo(
        projectName,
        description,
        generatedCode,
        `# ${projectName}\n\nAI-generated website with full project files and chat history.`
      );

      toast({
        title: "GitHub Repository Created",
        description: `Project uploaded to ${repo.html_url}`,
      });
    } catch (error) {
      console.error('GitHub upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload project to GitHub",
        variant: "destructive"
      });
    }
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
      {/* Premium YouTube-style Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/40 via-red-800/30 to-black/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(220,38,38,0.4),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.3),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_26%,rgba(255,255,255,0.02)_27%,transparent_28%)] bg-[length:20px_20px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
      </div>
      
      {/* Left Panel - Chat (1/3 ratio) */}
      <div className="w-1/3 relative overflow-hidden border-r border-red-500/30 backdrop-blur-sm">
        <div className="relative z-10 h-full flex flex-col">
          {/* Chat Header with Status Indicators */}
          <div className="p-3 border-b border-red-500/30 bg-red-950/40 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-200"></div>
                  <div className="w-2 h-2 bg-red-700 rounded-full animate-pulse delay-300"></div>
                </div>
                <h2 className="font-semibold text-white text-sm">AI Workspace</h2>
                <Badge variant="secondary" className="bg-red-600/30 text-red-200 border-red-500/40 text-xs">
                  Live
                </Badge>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={handleVerificationRequest}
                size="sm"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-xs px-2 py-1 h-7"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Verify
              </Button>
              <Button
                onClick={handleGitHubUpload}
                disabled={githubLoading}
                size="sm"
                className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white text-xs px-2 py-1 h-7"
              >
                <Github className="w-3 h-3 mr-1" />
                {githubLoading ? 'Uploading...' : 'GitHub'}
              </Button>
            </div>
          </div>

          {/* YouTube URL Input */}
          {showUrlInput && (
            <div className="p-3 bg-red-900/30 border-b border-red-500/30 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Enter YouTube channel URL..."
                  className="flex-1 bg-red-950/60 border-red-500/40 text-white placeholder-red-300/70 text-sm h-8"
                />
                <Button
                  onClick={handleYouTubeUrlSubmit}
                  size="sm"
                  disabled={!ytUrl.trim()}
                  className="bg-red-600 hover:bg-red-700 text-xs px-2 h-8"
                >
                  <Youtube className="w-3 h-3 mr-1" />
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
              onChatHistoryUpdate={setChatHistory}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Preview/Code (2/3 ratio) */}
      <div className="w-2/3 flex flex-col bg-red-950/20 backdrop-blur-sm relative">
        {/* Header */}
        <div className="h-12 border-b border-red-500/30 flex items-center justify-between px-4 bg-red-950/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-white">
                {channelData?.title || youtubeData?.title || 'Workspace'}
              </div>
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className={`h-7 px-2 ${previewMode === 'desktop' ? "bg-red-600/60 text-white" : "text-red-300 hover:text-white hover:bg-red-600/40"}`}
              >
                <Monitor className="h-3 w-3" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className={`h-7 px-2 ${previewMode === 'tablet' ? "bg-red-600/60 text-white" : "text-red-300 hover:text-white hover:bg-red-600/40"}`}
              >
                <Tablet className="h-3 w-3" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className={`h-7 px-2 ${previewMode === 'mobile' ? "bg-red-600/60 text-white" : "text-red-300 hover:text-white hover:bg-red-600/40"}`}
              >
                <Smartphone className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
                className="scale-75"
              />
              <label htmlFor="view-mode" className="text-xs text-red-200 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-3 w-3 text-red-300" /> : <Eye className="h-3 w-3 text-red-300" />}
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
                  className="bg-white rounded-lg shadow-2xl overflow-hidden border-4 border-red-500/40"
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
                  <p className="text-lg">No content to preview</p>
                  <p className="text-sm opacity-70">Generate code using the AI chat or enter a YouTube URL</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-6 border-t border-red-500/30 bg-red-950/40 backdrop-blur-md flex items-center justify-between px-4 text-xs text-red-200">
          <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
            Live Preview Active
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="w-3 h-3" />
            Ready to build
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeWorkspace;
