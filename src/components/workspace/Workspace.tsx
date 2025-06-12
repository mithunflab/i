
import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Tablet, Code, Eye, Github, Globe, ArrowLeft, Settings } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PreviewFrame from './PreviewFrame';
import OptimizedCodePreview from './OptimizedCodePreview';
import SuperEnhancedChatbot from './SuperEnhancedChatbot';
import ProjectVerificationDialog from './ProjectVerificationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useGitHubReconnection } from '@/hooks/useGitHubReconnection';

const Workspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { checkRepositoryConnection } = useGitHubReconnection();
  
  // Get URL parameters
  const youtubeUrl = searchParams.get('url') || '';
  const projectIdea = searchParams.get('idea') || '';
  const channelDataParam = searchParams.get('channelData');
  
  let channelData = null;
  try {
    channelData = channelDataParam ? JSON.parse(decodeURIComponent(channelDataParam)) : null;
  } catch (error) {
    console.error('Error parsing channel data:', error);
  }

  // Load existing project data
  useEffect(() => {
    const loadProject = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      if (!youtubeUrl) {
        setError('No YouTube URL provided');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Loading project for URL:', youtubeUrl);
        
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('youtube_url', youtubeUrl)
          .single();
        
        if (projectError) {
          if (projectError.code === 'PGRST116') {
            // No project found - this is OK for new projects
            console.log('ℹ️ No existing project found - will create new one');
            setProjectData(null);
          } else {
            throw projectError;
          }
        } else {
          console.log('📂 Project found:', project.name);
          setProjectData(project);
          
          if (project.source_code) {
            setGeneratedCode(project.source_code);
          }
          
          // Check repository connection
          if (project.id) {
            checkRepositoryConnection(project.id);
          }
        }
      } catch (error) {
        console.error('❌ Error loading project:', error);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [user, youtubeUrl, checkRepositoryConnection]);

  const handleCodeGenerated = (code: string) => {
    console.log('🔄 Code generated in workspace, updating preview...');
    setGeneratedCode(code);
  };

  const handleBackToDashboard = () => {
    navigate('/user-dashboard');
  };

  const handleProjectUpdate = (updatedProject: any) => {
    setProjectData(updatedProject);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={handleBackToDashboard} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Enhanced Header */}
      <div className="h-14 border-b border-purple-500/30 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} className="mr-2" />
            Dashboard
          </Button>
          
          <div className="flex items-center gap-3">
            {channelData?.thumbnail && (
              <img 
                src={channelData.thumbnail} 
                alt={channelData.title}
                className="w-8 h-8 rounded-full object-cover border border-cyan-400"
              />
            )}
            <div>
              <h1 className="text-lg font-semibold text-white">
                {projectData?.name || channelData?.title || 'AI Website Builder'}
              </h1>
              <p className="text-xs text-gray-400">
                {channelData ? `${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers` : 'Enhanced Workspace'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Project Status */}
          {projectData && (
            <div className="flex items-center gap-2 mr-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                {projectData.status || 'Active'}
              </Badge>
              {projectData.verified && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  Verified
                </Badge>
              )}
            </div>
          )}

          {/* External Links */}
          {projectData?.github_url && (
            <a
              href={projectData.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Open GitHub Repository"
            >
              <Github size={16} />
            </a>
          )}
          
          {projectData?.netlify_url && (
            <a
              href={projectData.netlify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
              title="Open Live Site"
            >
              <Globe size={16} />
            </a>
          )}

          {/* Verification Button */}
          {projectData && (
            <ProjectVerificationDialog
              projectId={projectData.id}
              projectName={projectData.name}
              projectData={projectData}
              isVerified={projectData.verified}
            />
          )}

          {/* Preview Mode Controls */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="p-2"
            >
              <Smartphone size={16} />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="p-2"
            >
              <Tablet size={16} />
            </Button>
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="p-2"
            >
              <Monitor size={16} />
            </Button>
          </div>

          {/* View Toggle */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'code')} className="w-auto">
            <TabsList className="bg-black/30">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye size={16} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code size={16} />
                Code
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-3.5rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Enhanced Chatbot Panel */}
          <ResizablePanel defaultSize={35} minSize={30} maxSize={50}>
            <SuperEnhancedChatbot
              youtubeUrl={youtubeUrl}
              projectIdea={projectIdea}
              channelData={channelData}
              onCodeGenerated={handleCodeGenerated}
              projectData={projectData}
              onProjectUpdate={handleProjectUpdate}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Preview/Code Panel */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <Tabs value={activeTab} className="h-full">
              <TabsContent value="preview" className="h-full m-0">
                <PreviewFrame
                  youtubeUrl={youtubeUrl}
                  projectIdea={projectIdea}
                  previewMode={previewMode}
                  generatedCode={generatedCode}
                  channelData={channelData}
                />
              </TabsContent>
              
              <TabsContent value="code" className="h-full m-0">
                <OptimizedCodePreview
                  generatedCode={generatedCode}
                  isLiveTyping={false}
                  projectData={projectData}
                />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Workspace;
