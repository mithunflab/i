import React, { useState, useEffect } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Monitor, Smartphone, Tablet, Code, Eye, ArrowLeft, FileText } from 'lucide-react';
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

const Workspace = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [previewMode, setPreviewMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'files'>('preview');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get URL parameters
  const youtubeUrl = searchParams.get('url') || '';
  const projectIdea = searchParams.get('idea') || '';
  const channelDataParam = searchParams.get('channelData');
  const projectId = searchParams.get('projectId');
  
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
        if (projectId) {
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

          // Initialize file system for existing project
          if (project.github_url) {
            console.log('📁 Loading project files from GitHub...');
            await loadProjectFromGitHub(project.github_url);
          } else {
            await initializeProjectFiles(project.id, channelData);
          }
          
          return;
        }
        
        // If we have a YouTube URL, try to find existing project or prepare for new one
        if (youtubeUrl) {
          console.log('🔍 Loading project for URL:', youtubeUrl);
          
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .eq('youtube_url', youtubeUrl)
            .maybeSingle();
          
          if (projectError) {
            console.error('❌ Error loading project:', projectError);
            setError('Failed to load project data');
            return;
          }
          
          if (project) {
            console.log('📂 Project found:', project.name);
            setProjectData(project);
            
            if (project.source_code) {
              setGeneratedCode(project.source_code);
            }

            // Load files for existing project
            await initializeProjectFiles(project.id, channelData);
          } else {
            console.log('ℹ️ No existing project found - ready to create new one');
            setProjectData(null);
            // Initialize files for new project
            const tempId = crypto.randomUUID();
            await initializeProjectFiles(tempId, channelData);
          }
          return;
        }
        
        // If no URL parameters, check if user has any projects and redirect to most recent
        console.log('🔍 No URL parameters, checking for user projects...');
        
        const { data: userProjects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);
        
        if (projectsError) {
          console.error('❌ Error loading user projects:', projectsError);
          setError('Failed to load projects');
          return;
        }
        
        if (userProjects && userProjects.length > 0) {
          const latestProject = userProjects[0];
          console.log('📂 Loading latest project:', latestProject.name);
          setProjectData(latestProject);
          
          if (latestProject.source_code) {
            setGeneratedCode(latestProject.source_code);
          }

          await initializeProjectFiles(latestProject.id, latestProject.channel_data);
        } else {
          console.log('ℹ️ No projects found, user can create new one');
          setProjectData(null);
          // Initialize empty file system
          const tempId = crypto.randomUUID();
          await initializeProjectFiles(tempId, null);
        }
        
      } catch (error) {
        console.error('❌ Error in loadProject:', error);
        setError('Failed to load workspace data');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [user, youtubeUrl, projectId, initializeProjectFiles, loadProjectFromGitHub]);

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
          <Button onClick={handleBackToDashboard} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Enhanced Header - Rearranged for better fit */}
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
          
          {/* Channel Info Display - Compact */}
          <div className="min-w-0 flex-1">
            <ChannelInfo channelData={channelData || projectData?.channel_data} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Real-time API Status Indicators - Only dots with tooltips */}
          <RealTimeApiStatusIndicators />

          {/* Real-time Git Indicator */}
          <RealTimeGitIndicator 
            projectId={projectData?.id} 
            projectData={projectData} 
          />

          {/* Project Status - Compact */}
          {projectData && (
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
          )}

          {/* Compact Verification Button */}
          {projectData && (
            <CompactProjectVerificationDialog
              projectData={projectData}
              onProjectUpdate={handleProjectUpdate}
            />
          )}

          {/* Preview Mode Controls - Compact */}
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

          {/* Enhanced View Toggle - Compact */}
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

      {/* Enhanced Main Content */}
      <div className="h-[calc(100vh-3.5rem)]">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Enhanced Chatbot Panel */}
          <ResizablePanel defaultSize={35} minSize={30} maxSize={50}>
            <UnifiedChatbot
              projectData={projectData}
              channelData={channelData || projectData?.channel_data}
              onCodeGenerated={handleCodeGenerated}
              onProjectUpdate={handleProjectUpdate}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Enhanced Preview/Code/Files Panel */}
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
