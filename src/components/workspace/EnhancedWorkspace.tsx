
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Github, 
  Globe, 
  Shield, 
  MessageSquare, 
  Code, 
  FileText, 
  CheckCircle,
  Clock,
  Zap,
  Eye
} from 'lucide-react';
import { useProjectContext } from '@/hooks/useProjectContext';
import { useEnhancedProjectChat } from '@/hooks/useEnhancedProjectChat';
import { useEnhancedRepositoryManager } from '@/hooks/useEnhancedRepositoryManager';
import SuperEnhancedChatbot from './SuperEnhancedChatbot';
import ProjectVerificationDialog from '../user/ProjectVerificationDialog';

interface EnhancedWorkspaceProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: any;
}

const EnhancedWorkspace: React.FC<EnhancedWorkspaceProps> = ({
  youtubeUrl,
  projectIdea,
  channelData
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [previewKey, setPreviewKey] = useState(0);

  const { 
    messages, 
    loading: chatLoading, 
    projectId, 
    currentProject, 
    deploymentStatus 
  } = useEnhancedProjectChat(youtubeUrl, projectIdea, channelData);

  const { 
    context, 
    loading: contextLoading 
  } = useProjectContext(projectId, youtubeUrl);

  const { 
    checkRepositoryStatus, 
    syncProgress 
  } = useEnhancedRepositoryManager();

  const [repositoryStatus, setRepositoryStatus] = useState<any>(null);

  useEffect(() => {
    if (projectId) {
      loadRepositoryStatus();
    }
  }, [projectId]);

  useEffect(() => {
    // Force preview refresh when code is generated
    const hasNewCode = messages.some(m => m.generatedCode && 
      new Date(m.timestamp).getTime() > Date.now() - 5000
    );
    
    if (hasNewCode) {
      setPreviewKey(prev => prev + 1);
    }
  }, [messages]);

  const loadRepositoryStatus = async () => {
    const status = await checkRepositoryStatus(projectId);
    setRepositoryStatus(status);
  };

  const handleCodeGenerated = (code: string) => {
    setPreviewKey(prev => prev + 1);
  };

  const handleProjectUpdate = (project: any) => {
    // Project updated callback
    loadRepositoryStatus();
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading enhanced workspace...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing file structure and project context</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900">
      {/* Enhanced Header */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {channelData?.thumbnail && (
                <div className="relative">
                  <img 
                    src={channelData.thumbnail} 
                    alt={channelData.title}
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
                  />
                  {currentProject?.verified && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-white">
                  {channelData?.title || 'YouTube Channel'} Website
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>Project ID: {projectId}</span>
                  {currentProject?.verified && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Repository Status */}
              {repositoryStatus?.isConnected && (
                <div className="flex items-center gap-2">
                  <a
                    href={repositoryStatus.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span className="text-sm">Repository</span>
                  </a>
                  {repositoryStatus.netlifyUrl && (
                    <a
                      href={repositoryStatus.netlifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span className="text-sm">Live Site</span>
                    </a>
                  )}
                </div>
              )}

              {/* Verification Button */}
              {currentProject && !currentProject.verified && (
                <ProjectVerificationDialog
                  project={currentProject}
                  onVerificationSubmitted={loadRepositoryStatus}
                />
              )}

              {/* Sync Progress */}
              {syncProgress > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 rounded-lg">
                  <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
                  <span className="text-sm text-purple-300">Syncing {syncProgress}%</span>
                </div>
              )}
            </div>
          </div>

          {/* Deployment Status */}
          {deploymentStatus.status !== 'idle' && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-center gap-2">
                {deploymentStatus.status === 'deploying' && (
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                )}
                {deploymentStatus.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {deploymentStatus.status === 'failed' && (
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                )}
                <span className="text-sm text-blue-300">{deploymentStatus.message}</span>
              </div>
              {deploymentStatus.status === 'deploying' && (
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${deploymentStatus.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-black/30 border border-purple-500/30">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Chat
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              File Manager
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code Editor
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[800px]">
            {/* Left Panel */}
            <Card className="bg-black/30 border-purple-500/30">
              <TabsContent value="chat" className="h-full mt-0">
                <SuperEnhancedChatbot
                  youtubeUrl={youtubeUrl}
                  projectIdea={projectIdea}
                  channelData={channelData}
                  onCodeGenerated={handleCodeGenerated}
                  projectData={currentProject}
                  onProjectUpdate={handleProjectUpdate}
                />
              </TabsContent>

              <TabsContent value="files" className="h-full mt-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Project Files
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full overflow-auto">
                  {context?.currentStructure ? (
                    <div className="space-y-3">
                      {Object.entries(context.currentStructure).map(([filename, content]) => (
                        <div key={filename} className="p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-sm text-cyan-400">{filename}</span>
                            <Badge variant="outline" className="text-xs">
                              {typeof content === 'string' ? content.length : 0} chars
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-400 max-h-20 overflow-hidden">
                            {filename.endsWith('.json') ? 
                              <pre>{typeof content === 'string' ? content.substring(0, 200) : ''}...</pre> :
                              typeof content === 'string' ? content.substring(0, 200) : ''
                            }...
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No files generated yet</p>
                      <p className="text-sm">Start chatting to generate project files</p>
                    </div>
                  )}
                </CardContent>
              </TabsContent>

              <TabsContent value="code" className="h-full mt-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Code Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-full">
                  <div className="h-full bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-auto">
                    <pre className="text-green-400">
                      {currentProject?.source_code || '// No code generated yet\n// Start chatting to generate website code'}
                    </pre>
                  </div>
                </CardContent>
              </TabsContent>
            </Card>

            {/* Right Panel - Preview */}
            <Card className="bg-black/30 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Live Preview
                  {repositoryStatus?.netlifyUrl && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto">
                      Live Deployed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full p-0">
                <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                  {currentProject?.source_code ? (
                    <iframe
                      key={previewKey}
                      srcDoc={currentProject.source_code}
                      className="w-full h-full border-0"
                      title="Website Preview"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">Website Preview</h3>
                        <p>Your generated website will appear here</p>
                        <p className="text-sm mt-2">Start chatting with the AI to build your site</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedWorkspace;
