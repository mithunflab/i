
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  CheckCircle,
  Github,
  ArrowLeft,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SimplifiedChatbot from './SimplifiedChatbot';
import CodePreview from './CodePreview';
import { useProjectFileManager } from '@/hooks/useProjectFileManager';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

const YouTubeWorkspace: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  // Convert ProjectFile[] to FileNode[]
  const convertProjectFilesToFileNodes = (files: any[]): FileNode[] => {
    return files.map(file => ({
      name: file.name,
      type: 'file' as const,
      content: file.content,
      extension: file.type
    }));
  };

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
      // Create a simple project structure for upload
      const projectData = {
        name: channelData?.title || 'YouTube Website',
        description: `AI-generated website for ${channelData?.title || 'YouTube channel'}`,
        files: [
          {
            name: 'index.html',
            content: generatedCode
          },
          {
            name: 'chat-history.json',
            content: JSON.stringify(chatHistory, null, 2)
          },
          {
            name: 'README.md',
            content: `# ${channelData?.title || 'YouTube Website'}\n\nAI-generated website with full project files and chat history.`
          }
        ]
      };

      // For now, just show success message
      toast({
        title: "GitHub Upload Simulated",
        description: "Project would be uploaded to GitHub (feature in development)",
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
    <div className="h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex overflow-hidden relative">
      {/* Red and White YouTube-style Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-100/40 via-white to-red-50/60"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(220,38,38,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(239,68,68,0.1),transparent_60%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_26%,rgba(255,255,255,0.1)_27%,transparent_28%)] bg-[length:20px_20px]"></div>
      </div>
      
      {/* Left Panel - Chat (1/3 ratio) */}
      <div className="w-1/3 relative overflow-hidden border-r border-red-200/50 backdrop-blur-sm">
        <div className="relative z-10 h-full flex flex-col bg-white/80 backdrop-blur-md border-r border-red-100">
          {/* YouTube URL Input */}
          {showUrlInput && (
            <div className="p-4 bg-red-50/80 border-b border-red-200/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Enter YouTube channel URL..."
                  className="flex-1 bg-white/90 border-red-200 text-gray-800 placeholder-red-400 text-sm h-10"
                />
                <Button
                  onClick={handleYouTubeUrlSubmit}
                  size="sm"
                  disabled={!ytUrl.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 h-10"
                >
                  <Youtube className="w-4 h-4 mr-2" />
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
      <div className="w-2/3 flex flex-col bg-white/60 backdrop-blur-sm relative">
        {/* Header */}
        <div className="h-16 border-b border-red-200/50 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold text-gray-800">
              {channelData?.title || youtubeData?.title || 'Workspace'}
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-2 bg-red-50/80 rounded-lg p-1">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
                className={`h-8 px-3 ${previewMode === 'desktop' ? "bg-red-600 text-white" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
                className={`h-8 px-3 ${previewMode === 'tablet' ? "bg-red-600 text-white" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
                className={`h-8 px-3 ${previewMode === 'mobile' ? "bg-red-600 text-white" : "text-red-600 hover:text-red-700 hover:bg-red-100"}`}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            <Button
              onClick={handleVerificationRequest}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 h-8"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Send for Verification
            </Button>
            
            <Button
              onClick={handleGitHubUpload}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 h-8"
            >
              <Github className="w-4 h-4 mr-1" />
              GitHub
            </Button>

            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
                className="scale-90"
              />
              <label htmlFor="view-mode" className="text-sm text-gray-700 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-4 w-4 text-gray-600" /> : <Eye className="h-4 w-4 text-gray-600" />}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isCodeView ? (
            <CodePreview
              generatedCode={generatedCode}
              projectFiles={convertProjectFilesToFileNodes(projectFiles)}
              isLiveTyping={true}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-6 bg-gray-50">
              {generatedCode ? (
                <div 
                  className="bg-white rounded-xl shadow-2xl overflow-hidden border border-red-200"
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
                <div className="text-center text-gray-500">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No content to preview</p>
                  <p className="text-sm opacity-70">Generate code using the AI chat or enter a YouTube URL</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-8 border-t border-red-200/50 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            Live Preview Active
          </div>
          <div className="flex items-center gap-2">
            <Upload className="w-3 h-3" />
            Ready to build
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeWorkspace;
