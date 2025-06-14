
import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Tablet, Code, Eye, ArrowLeft, FileText, Plus } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PreviewFrame from './PreviewFrame';
import CompactProjectVerificationDialog from './CompactProjectVerificationDialog';
import UnifiedChatbot from './UnifiedChatbot';
import EnhancedFileManager from './EnhancedFileManager';
import RealTimeCodePreview from './RealTimeCodePreview';
import ChannelInfo from './ChannelInfo';
import RealTimeApiStatusIndicators from './RealTimeApiStatusIndicators';
import RealTimeGitIndicator from './RealTimeGitIndicator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useFileManager } from '@/hooks/useFileManager';
import { useEnhancedGitHubSync } from '@/hooks/useEnhancedGitHubSync';
import { useToast } from '@/hooks/use-toast';

const Workspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'files'>('preview');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  
  // Get URL parameters
  const youtubeUrl = searchParams.get('url') || '';
  const projectIdea = searchParams.get('idea') || '';
  const channelDataParam = searchParams.get('channelData');
  const projectId = searchParams.get('projectId');
  const forceNew = searchParams.get('new') === 'true';
  
  let channelData = null;
  try {
    channelData = channelDataParam ? JSON.parse(decodeURIComponent(channelDataParam)) : null;
  } catch (error) {
    console.error('Error parsing channel data:', error);
  }

  const { 
    files, 
    initializeProjectFiles
  } = useFileManager();

  const { 
    loadProjectFromGitHub,
    syncProjectFiles 
  } = useEnhancedGitHubSync();

  const createNewProject = async (channelData: any, youtubeUrl: string, projectIdea: string) => {
    if (!user) return null;

    try {
      setIsCreatingNew(true);
      console.log('🆕 Creating new project...');

      const projectName = channelData?.title 
        ? `${channelData.title}-website-${Date.now()}`
        : `new-project-${Date.now()}`;

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          description: projectIdea || `Website for ${channelData?.title || 'content creator'}`,
          youtube_url: youtubeUrl,
          channel_data: channelData,
          status: 'active',
          verified: false
        })
        .select()
        .single();

      if (projectError) {
        throw new Error(`Failed to create project: ${projectError.message}`);
      }

      console.log('✅ New project created:', newProject.name);
      
      toast({
        title: "New Project Created",
        description: `Project "${newProject.name}" has been created successfully`,
      });

      return newProject;
    } catch (error) {
      console.error('❌ Error creating new project:', error);
      toast({
        title: "Project Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create new project",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingNew(false);
    }
  };
  
  // Load existing project data
  useEffect(() => {
    const loadProject = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // If we have a project ID, load that specific project
        if (projectId && !forceNew) {
          console.log('🔍 Loading project by ID:', projectId);
          
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single();
          
          if (projectError) {
            console.error('❌ Error loading project by ID:', projectError);
            setError('Project not found or access denied');
            return;
          }
          
          console.log('📂 Project loaded by ID:', project.name);
          setProjectData(project);
          
          if (project.source_code) {
            setGeneratedCode(project.source_code);
          }

          await initializeProjectFiles(project.id, project.channel_data);
          return;
        }
        
        // If forceNew is true, create a new project regardless of existing ones
        if (forceNew || (youtubeUrl && channelData)) {
          console.log('🆕 Creating new project (forced or with channel data)');
          
          const newProject = await createNewProject(channelData, youtubeUrl, projectIdea);
          if (newProject) {
            setProjectData(newProject);
            await initializeProjectFiles(newProject.id, channelData);
          }
          return;
        }
        
        // If we have a YouTube URL, check for existing project but don't auto-load
        if (youtubeUrl) {
          console.log('🔍 Checking for existing project with URL:', youtubeUrl);
          
          const { data: existingProject, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .eq('youtube_url', youtubeUrl)
            .maybeSingle();
          
          if (projectError) {
            console.error('❌ Error checking for existing project:', projectError);
          }
          
          if (existingProject) {
            console.log('📂 Found existing project, but allowing user to choose');
            // Show option to load existing or create new
            setProjectData(null); // Don't auto-load, let user decide
          } else {
            console.log('ℹ️ No existing project found - ready to create new one');
            setProjectData(null);
          }
          
          // Initialize temporary file system for preview
          const tempId = crypto.randomUUID();
          await initializeProjectFiles(tempId, channelData);
          return;
        }
        
        // If no specific parameters, show empty workspace for new project creation
        console.log('ℹ️ No specific parameters - ready for new project creation');
        setProjectData(null);
        
        // Initialize empty file system
        const tempId = crypto.randomUUID();
        await initializeProjectFiles(tempId, null);
        
      } catch (error) {
        console.error('❌ Error in loadProject:', error);
        setError('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [user, youtubeUrl, projectId, forceNew, initializeProjectFiles]);

  const handleCodeGenerated = (code: string) => {
    console.log('🔄 Code generated in workspace, updating preview...');
    setGeneratedCode(code);
  };

  const handleBackToDashboard = () => {
    navigate('/user-dashboard');
  };

  const handleCreateNew = async () => {
    if (!user) return;
    
    const newProject = await createNewProject(channelData, youtubeUrl, projectIdea);
    if (newProject) {
      setProjectData(newProject);
      await initializeProjectFiles(newProject.id, channelData);
    }
  };

  const handleProjectUpdate = (updatedProject: any) => {
    setProjectData(updatedProject);
  };

  const handleFileChange = (fileName: string, content: string) => {
    console.log('📝 File changed:', fileName);
    
    // Auto-sync to GitHub if repository exists
    if (projectData?.github_url) {
      syncProjectFiles(projectData.github_url, { [fileName]: content });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading enhanced workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={handleBackToDashboard} variant="outline">
              Back to Dashboard
            </Button>
            <Button onClick={handleCreateNew} className="ml-2">
              <Plus size={16} className="mr-2" />
              Create New Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Enhanced Header */}
      <div className="h-14 border-b border-purple-500/30 bg-black/50 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Button>
          
          {/* Project Creation or Info Display */}
          <div className="min-w-0 flex-1">
            {!projectData && channelData ? (
              <div className="flex items-center gap-2">
                <ChannelInfo channelData={channelData} />
                <Button 
                  onClick={handleCreateNew} 
                  size="sm" 
                  disabled={isCreatingNew}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCreatingNew ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-1" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <ChannelInfo channelData={channelData || projectData?.channel_data} />
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <RealTimeApiStatusIndicators />
          <RealTimeGitIndicator 
            projectId={projectData?.id} 
            projectData={projectData} 
          />

          {projectData && (
            <>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs px-1 py-0">
                  {projectData.status || 'Active'}
                </Badge>
                {projectData.verified && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs px-1 py-0">
                    ✓
                  </Badge>
                )}
              </div>
              <CompactProjectVerificationDialog
                projectData={projectData}
                onProjectUpdate={handleProjectUpdate}
              />
            </>
          )}

          {/* Preview Mode Controls */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
              className="p-1 h-6 w-6"
            >
              <Smartphone size={12} />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
              className="p-1 h-6 w-6"
            >
              <Tablet size={12} />
            </Button>
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
              className="p-1 h-6 w-6"
            >
              <Monitor size={12} />
            </Button>
          </div>

          {/* View Toggle */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'code' | 'files')} className="w-auto">
            <TabsList className="bg-black/30 h-8">
              <TabsTrigger value="preview" className="flex items-center gap-1 px-2 py-1 text-xs">
                <Eye size={12} />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-1 px-2 py-1 text-xs">
                <Code size={12} />
                Code
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-1 px-2 py-1 text-xs">
                <FileText size={12} />
                Files
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-3.5rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chatbot Panel */}
          <ResizablePanel defaultSize={35} minSize={30} maxSize={50}>
            <UnifiedChatbot
              projectData={projectData}
              channelData={channelData || projectData?.channel_data}
              onCodeGenerated={handleCodeGenerated}
              onProjectUpdate={handleProjectUpdate}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Preview/Code/Files Panel */}
          <ResizablePanel defaultSize={65} minSize={50}>
            <Tabs value={activeTab} className="h-full">
              <TabsContent value="preview" className="h-full m-0">
                <PreviewFrame
                  youtubeUrl={youtubeUrl || projectData?.youtube_url || ''}
                  projectIdea={projectIdea || projectData?.description || ''}
                  previewMode={previewMode}
                  generatedCode={generatedCode}
                  channelData={channelData || projectData?.channel_data}
                />
              </TabsContent>
              
              <TabsContent value="code" className="h-full m-0">
                <RealTimeCodePreview
                  code={generatedCode}
                  isStreaming={false}
                  onCodeUpdate={handleCodeGenerated}
                />
              </TabsContent>

              <TabsContent value="files" className="h-full m-0">
                <EnhancedFileManager
                  projectData={projectData}
                  onFileChange={handleFileChange}
                  onCodeUpdate={handleCodeGenerated}
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
