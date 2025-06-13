
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  youtube_url: string;
  channel_data: any;
  source_code: string | null;
  github_url: string | null;
  netlify_url: string | null;
  created_at: string;
  updated_at: string;
  status: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface DeploymentStatus {
  status: 'idle' | 'deploying' | 'success' | 'failed';
  message: string;
  progress: number;
}

interface ProjectContextType {
  project: Project | null;
  loading: boolean;
  error: string | null;
  updateProject: (updates: Partial<Project>) => Promise<void>;
  refreshProject: () => Promise<void>;
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChatHistory: () => void;
  deploymentStatus: DeploymentStatus;
  deployProject: () => Promise<void>;
  syncToGitHub: () => Promise<void>;
  isDeploying: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProjectContext = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProjectContext must be used within a ProjectProvider");
  }
  return context;
};

interface ProjectProviderProps {
  projectId: string;
  children: React.ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ projectId, children }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'idle',
    message: '',
    progress: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData(projectId);
      fetchChatHistory(projectId);
    }
  }, [projectId, user]);

  const fetchProjectData = useCallback(async (projectId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        setError(error.message);
        console.error("Error fetching project:", error);
      } else if (data) {
        setProject(data);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Unexpected error fetching project:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProject = useCallback(async (updates: Partial<Project>) => {
    if (!project) {
      console.warn("Attempted to update project before it was loaded.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', project.id)
        .select('*')
        .single();

      if (error) {
        console.error("Error updating project:", error);
        toast({
          title: "Update Failed",
          description: "Failed to update project details.",
          variant: "destructive"
        });
      } else if (data) {
        setProject(data);
        toast({
          title: "Project Updated",
          description: "Project details updated successfully.",
        });
      }
    } catch (err: any) {
      console.error("Unexpected error updating project:", err);
      toast({
        title: "Update Error",
        description: "An unexpected error occurred during update.",
        variant: "destructive"
      });
    }
  }, [project, toast]);

  const refreshProject = useCallback(async () => {
    if (project) {
      await fetchProjectData(project.id);
    }
  }, [project, fetchProjectData]);

  const fetchChatHistory = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching chat history:", error);
      } else if (data) {
        const messages: ChatMessage[] = data.map(item => ({
          id: item.id,
          type: item.message_type,
          content: item.content,
          timestamp: new Date(item.created_at)
        }));
        setChatHistory(messages);
      }
    } catch (err: any) {
      console.error("Unexpected error fetching chat history:", err);
    }
  }, []);

  const addChatMessage = (message: ChatMessage) => {
    setChatHistory(prevHistory => [...prevHistory, message]);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  const deployProject = useCallback(async () => {
    if (!project) {
      console.warn("Attempted to deploy project before it was loaded.");
      return;
    }

    setDeploymentStatus({ status: 'deploying', message: 'Deployment started...', progress: 10 });

    // Simulate deployment process
    setTimeout(() => {
      setDeploymentStatus(prevState => ({ ...prevState, message: 'Building project...', progress: 40 }));
    }, 2000);

    setTimeout(() => {
      setDeploymentStatus(prevState => ({ ...prevState, message: 'Optimizing assets...', progress: 70 }));
    }, 4000);

    setTimeout(() => {
      setDeploymentStatus({ status: 'success', message: 'Project deployed successfully!', progress: 100 });
    }, 6000);

    // Reset status after a delay
    setTimeout(() => {
      setDeploymentStatus({ status: 'idle', message: '', progress: 0 });
    }, 10000);
  }, [project]);

  const syncToGitHub = useCallback(async () => {
    if (!project) {
      console.warn("Attempted to sync project before it was loaded.");
      return;
    }

    setDeploymentStatus({ status: 'deploying', message: 'Syncing with GitHub...', progress: 10 });

    // Simulate GitHub sync process
    setTimeout(() => {
      setDeploymentStatus(prevState => ({ ...prevState, message: 'Committing changes...', progress: 50 }));
    }, 3000);

    setTimeout(() => {
      setDeploymentStatus({ status: 'success', message: 'GitHub sync complete!', progress: 100 });
    }, 6000);

    // Reset status after a delay
    setTimeout(() => {
      setDeploymentStatus({ status: 'idle', message: '', progress: 0 });
    }, 10000);
  }, [project]);

  const contextValue = {
    project,
    loading,
    error,
    updateProject,
    refreshProject,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    deploymentStatus,
    deployProject,
    syncToGitHub,
    isDeploying: deploymentStatus.status === 'deploying'
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
};
