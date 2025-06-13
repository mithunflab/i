
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Eye, 
  Save, 
  Settings,
  Globe,
  Github,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createProject, getProject, updateProject } from '@/utils/projectCreation';
import SimpleChatbot from './SimpleChatbot';
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
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-4xl font-bold text-center text-gray-800 mb-8">Welcome to Your AI Website</h1>
        <p class="text-lg text-center text-gray-600">Start chatting with the AI to build your dream website!</p>
    </div>
</body>
</html>`);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<any>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('My AI Website');

  // Initialize from location state
  React.useEffect(() => {
    if (location.state?.channelData) {
      setChannelData(location.state.channelData);
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

  return (
    <div className="h-screen bg-background flex">
      {/* Left Panel - AI Chat */}
      <div className="w-1/2 border-r border-border flex flex-col">
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="font-semibold text-foreground">AI Assistant</h2>
            {channelData && (
              <Badge variant="secondary" className="text-xs">
                {channelData.title}
              </Badge>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
        </div>

        {/* Chat Content */}
        <div className="flex-1">
          <SimpleChatbot
            projectId={projectId || 'temp'}
            sourceCode={sourceCode}
            channelData={channelData}
            onCodeUpdate={handleCodeUpdate}
          />
        </div>
      </div>

      {/* Right Panel - Preview/Code */}
      <div className="w-1/2 flex flex-col">
        {/* Preview Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
              />
              <label htmlFor="view-mode" className="text-sm text-muted-foreground cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              <Code className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {projectId ? `Project: ${projectId.slice(0, 8)}...` : 'Unsaved'}
            </Badge>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview/Code Content */}
        <div className="flex-1 bg-background">
          {isCodeView ? (
            <div className="h-full p-4">
              <Textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                className="w-full h-full resize-none font-mono text-sm bg-muted/50 border-0"
                placeholder="Your generated code will appear here..."
              />
            </div>
          ) : (
            <div className="h-full">
              <iframe
                srcDoc={sourceCode}
                title="Website Preview"
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-10 border-t border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            Live Preview Active
          </div>
          <div className="flex items-center gap-2">
            {projectId && (
              <>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <Github className="h-3 w-3 mr-1" />
                  Push to GitHub
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
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
