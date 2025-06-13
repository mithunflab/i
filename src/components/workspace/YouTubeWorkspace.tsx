
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
import FileTreeViewer from './FileTreeViewer';
import { useProjectFileManager } from '@/hooks/useProjectFileManager';

const YouTubeWorkspace: React.FC = () => {
  const location = useLocation();
  const { youtubeUrl, projectIdea, channelData } = location.state || {};
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeView, setIsCodeView] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [ytUrl, setYtUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(!channelData);
  const { toast } = useToast();
  
  const {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    getFileByName,
    generateWebsiteCode
  } = useProjectFileManager();

  useEffect(() => {
    if (channelData) {
      const initialCode = generateWebsiteCode(channelData);
      setGeneratedCode(initialCode);
    }
  }, [channelData, generateWebsiteCode]);

  const handleCodeUpdate = (newCode: string) => {
    setGeneratedCode(newCode);
    // Update the HTML file content
    updateFileContent('index.html', newCode);
    toast({
      title: "Website Updated",
      description: "Your changes have been applied successfully",
    });
  };

  const handleFileSelect = (file: any) => {
    setSelectedFile(file);
    if (file.content) {
      setGeneratedCode(file.content);
      setIsCodeView(true);
    }
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
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Panel - Chat & Files (2/6 ratio) */}
      <div className="w-1/3 relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="font-semibold text-white">AI Workspace</h2>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  Active
                </Badge>
              </div>
              <Button
                onClick={handleVerificationRequest}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify
              </Button>
            </div>
          </div>

          {/* YouTube URL Input */}
          {showUrlInput && (
            <div className="p-4 bg-blue-900/20 border-b border-white/10">
              <div className="flex gap-2">
                <Input
                  value={ytUrl}
                  onChange={(e) => setYtUrl(e.target.value)}
                  placeholder="Enter YouTube channel URL..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder-gray-400"
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

          {/* Chat Area - Takes 60% */}
          <div className="flex-1 min-h-0" style={{ height: '60%' }}>
            <SimplifiedChatbot
              projectId="youtube-workspace"
              sourceCode={generatedCode}
              channelData={channelData || youtubeData}
              onCodeUpdate={handleCodeUpdate}
            />
          </div>

          {/* File Tree - Takes 40% */}
          <div className="border-t border-white/10" style={{ height: '40%' }}>
            <FileTreeViewer
              projectFiles={projectFiles}
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Preview/Code (4/6 ratio) */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-600">
                {selectedFile ? selectedFile.name : (channelData?.title || youtubeData?.title || 'Workspace')}
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
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
              <label htmlFor="view-mode" className="text-sm text-gray-600 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isCodeView ? (
            <div className="h-full p-4">
              <div className="h-full bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {selectedFile?.content || generatedCode || '// Your code will appear here...'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              {generatedCode ? (
                <div 
                  className="bg-white rounded-lg shadow-xl overflow-hidden"
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
                  <p>No content to preview</p>
                  <p className="text-sm">Generate code using the AI chat or enter a YouTube URL</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-8 border-t border-gray-200 bg-white flex items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            Live Preview Active
          </div>
          <div>
            {selectedFile ? `Viewing: ${selectedFile.name}` : 'Ready to build'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeWorkspace;
