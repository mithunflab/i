import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Github, 
  ExternalLink, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Code,
  Eye,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createProject, getProject, updateProject } from '@/utils/projectCreation';
import ProjectVerificationDialog from './ProjectVerificationDialog';
import SimpleChatbot from './SimpleChatbot';

interface Project {
  id: string;
  name: string;
  description: string;
  github_url?: string;
  netlify_url?: string;
  youtube_url?: string;
  channel_data?: any;
  source_code?: string;
  status: 'active' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  is_verified?: boolean;
  verification_status?: string;
}

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [sourceCode, setSourceCode] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [netlifyUrl, setNetlifyUrl] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paramProjectId = params.get('projectId');

    if (location.state?.channelData) {
      setChannelData(location.state.channelData);
      setYoutubeUrl(location.state.youtubeUrl);
    }

    const loadProject = async (id: string) => {
      try {
        setIsLoading(true);
        const fetchedProject = await getProject(id);
        setProject(fetchedProject);
        setProjectId(fetchedProject.id);
        setProjectName(fetchedProject.name);
        setProjectDescription(fetchedProject.description);
        setSourceCode(fetchedProject.source_code || '');
        setGithubUrl(fetchedProject.github_url || '');
        setNetlifyUrl(fetchedProject.netlify_url || '');
        setIsVerified(fetchedProject.is_verified || false);
        setVerificationStatus(fetchedProject.status);
      } catch (error: any) {
        console.error("Error loading project:", error.message);
        toast({
          title: "Error",
          description: `Failed to load project: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (location.state?.projectId) {
      loadProject(location.state.projectId);
    } else if (paramProjectId) {
      loadProject(paramProjectId);
    } else if (location.state?.projectIdea) {
      setProjectName(location.state.projectIdea);
    }
  }, [location, toast]);

  const handleCodeUpdate = (newCode: string) => {
    setSourceCode(newCode);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save.",
        variant: "destructive",
      });
      return;
    }

    if (!projectId) {
      try {
        setIsLoading(true);
        const newProject = await createProject({
          name: projectName,
          description: projectDescription,
          youtubeUrl: youtubeUrl || null,
          channelData: channelData || null,
          sourceCode: sourceCode,
        });
        setProjectId(newProject.id);
        setProject(newProject);
        toast({
          title: "Success",
          description: "Project saved successfully!",
        });
        navigate(`/workspace?projectId=${newProject.id}`, { replace: true, state: { ...location.state, projectId: newProject.id } });
      } catch (error: any) {
        console.error("Error creating project:", error);
        toast({
          title: "Error",
          description: `Failed to create project: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        setIsLoading(true);
        await updateProject(projectId, {
          name: projectName,
          description: projectDescription,
          sourceCode: sourceCode,
          githubUrl: githubUrl,
          netlifyUrl: netlifyUrl,
        });
        toast({
          title: "Success",
          description: "Project updated successfully!",
        });
      } catch (error: any) {
        console.error("Error updating project:", error);
        toast({
          title: "Error",
          description: `Failed to update project: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      // Simulate deployment process
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast({
        title: "Deployment Successful",
        description: "Your website has been successfully deployed!",
      });
    } catch (error) {
      console.error("Deployment error:", error);
      toast({
        title: "Deployment Failed",
        description: "There was an error during deployment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">Workspace</h1>
          <p className="text-sm text-gray-400">
            {projectId ? 'Edit your project' : 'Create something new'}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="project-name" className="text-sm text-gray-300">
            Project Name
          </Label>
          <Input
            id="project-name"
            placeholder="My Awesome Website"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />

          <Label htmlFor="project-description" className="text-sm text-gray-300">
            Description
          </Label>
          <Textarea
            id="project-description"
            placeholder="A brief description of your project"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white resize-none"
          />

          <Label htmlFor="github-url" className="text-sm text-gray-300">
            GitHub URL
          </Label>
          <Input
            id="github-url"
            placeholder="https://github.com/your-repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />

          <Label htmlFor="netlify-url" className="text-sm text-gray-300">
            Netlify URL
          </Label>
          <Input
            id="netlify-url"
            placeholder="https://your-site.netlify.app"
            value={netlifyUrl}
            onChange={(e) => setNetlifyUrl(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>

        <div className="mt-auto space-y-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Project"
            )}
          </Button>

          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy Project"
            )}
          </Button>
          {projectId && (
            <ProjectVerificationDialog
              projectId={projectId}
              projectName={projectName}
              projectData={{
                github_url: githubUrl,
                netlify_url: netlifyUrl,
                description: projectDescription,
              }}
              isVerified={isVerified}
              verificationStatus={verificationStatus}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Chat */}
        <div className="w-1/3 border-r border-gray-700 flex flex-col">
          <div className="border-b border-gray-700 p-4">
            <h2 className="text-white font-semibold">AI Assistant</h2>
            {channelData && (
              <p className="text-sm text-gray-400 mt-1">
                Building for: {channelData.title}
              </p>
            )}
          </div>
          
          <div className="flex-1">
            <SimpleChatbot
              projectId={projectId || 'temp'}
              sourceCode={sourceCode}
              channelData={channelData}
              onCodeUpdate={setSourceCode}
            />
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="preview" className="flex flex-col h-full">
            <TabsList className="border-b border-gray-700">
              <TabsTrigger value="preview" className="text-white data-[state=active]:bg-gray-700">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="text-white data-[state=active]:bg-gray-700">
                <Code className="mr-2 h-4 w-4" />
                Code Editor
              </TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="flex-1 p-4">
              <iframe
                srcDoc={sourceCode}
                title="Website Preview"
                className="w-full h-full bg-white rounded-md"
              />
            </TabsContent>
            <TabsContent value="code" className="flex-1 p-4">
              <Textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="w-full h-full bg-gray-800 border-gray-600 text-white resize-none"
              />
            </TabsContent>
          </Tabs>

          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {githubUrl && (
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <Github className="mr-2 h-4 w-4" />
                    <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                      GitHub Repo
                    </a>
                  </Button>
                )}
                {netlifyUrl && (
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    <a href={netlifyUrl} target="_blank" rel="noopener noreferrer">
                      Netlify Site
                    </a>
                  </Button>
                )}
              </div>
              <Badge variant="secondary">
                {projectId ? (
                  <>
                    Project ID: {projectId}
                  </>
                ) : (
                  "Unsaved Project"
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
