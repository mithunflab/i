
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RepositoryStatus {
  isConnected: boolean;
  githubUrl?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'checking' | 'error';
}

export const useGitHubReconnection = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checkRepositoryConnection = useCallback(async (projectId: string): Promise<RepositoryStatus> => {
    if (!user || !projectId) {
      return { isConnected: false, status: 'disconnected' };
    }

    try {
      setLoading(true);
      console.log('🔍 Checking GitHub repository connection for project:', projectId);

      // Get project data
      const { data: project } = await supabase
        .from('projects')
        .select('github_url, updated_at')
        .eq('id', projectId)
        .single();

      if (!project?.github_url) {
        return { isConnected: false, status: 'disconnected' };
      }

      // Verify repository still exists and is accessible
      const { data: githubKeys } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .limit(1);

      if (!githubKeys || githubKeys.length === 0) {
        return { 
          isConnected: false, 
          status: 'error',
          githubUrl: project.github_url 
        };
      }

      // Extract repo info from URL
      const urlParts = project.github_url.replace('https://github.com/', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];

      // Check if repository exists
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${githubKeys[0].api_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (repoResponse.ok) {
        console.log('✅ Repository connection verified');
        return {
          isConnected: true,
          githubUrl: project.github_url,
          lastSync: project.updated_at,
          status: 'connected'
        };
      } else {
        console.log('❌ Repository not accessible');
        return {
          isConnected: false,
          githubUrl: project.github_url,
          status: 'error'
        };
      }

    } catch (error) {
      console.error('❌ Error checking repository connection:', error);
      return { isConnected: false, status: 'error' };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const reconnectRepository = useCallback(async (projectId: string): Promise<boolean> => {
    if (!user || !projectId) return false;

    try {
      setLoading(true);
      console.log('🔄 Attempting to reconnect repository for project:', projectId);

      // Get project data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      // If no GitHub URL, create new repository
      if (!project.github_url) {
        const { data: githubKeys } = await supabase
          .from('github_api_keys')
          .select('api_token')
          .eq('is_active', true)
          .limit(1);

        if (!githubKeys || githubKeys.length === 0) {
          throw new Error('No GitHub API keys configured');
        }

        const repoName = `${project.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        
        // Create new repository
        const repoResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubKeys[0].api_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            description: project.description,
            private: false,
            auto_init: false
          })
        });

        if (!repoResponse.ok) {
          throw new Error('Failed to create new repository');
        }

        const repo = await repoResponse.json();

        // Update project with new repository URL
        await supabase
          .from('projects')
          .update({ github_url: repo.html_url })
          .eq('id', projectId);

        console.log('✅ New repository created and connected');
        
        toast({
          title: "Repository Connected",
          description: `New repository created at ${repo.html_url}`,
        });

        return true;
      }

      // Repository URL exists, verify connection
      const connectionStatus = await checkRepositoryConnection(projectId);
      
      if (connectionStatus.isConnected) {
        toast({
          title: "Repository Connected",
          description: "GitHub repository is properly connected",
        });
        return true;
      } else {
        toast({
          title: "Connection Error",
          description: "Unable to connect to existing repository",
          variant: "destructive"
        });
        return false;
      }

    } catch (error) {
      console.error('❌ Error reconnecting repository:', error);
      toast({
        title: "Reconnection Failed",
        description: error instanceof Error ? error.message : "Failed to reconnect repository",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, toast, checkRepositoryConnection]);

  return {
    checkRepositoryConnection,
    reconnectRepository,
    loading
  };
};
