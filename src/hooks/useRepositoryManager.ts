
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface RepositoryInfo {
  githubUrl: string;
  netlifyUrl: string;
  lastCommit: string;
  deploymentStatus: 'pending' | 'success' | 'failed';
}

export const useRepositoryManager = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const getOrCreateRepository = useCallback(async (
    projectId: string,
    projectName: string,
    channelData: any
  ): Promise<RepositoryInfo | null> => {
    if (!user) return null;

    try {
      setLoading(true);

      // Check if project already has a repository
      const { data: project } = await supabase
        .from('projects')
        .select('github_url, netlify_url')
        .eq('id', projectId)
        .single();

      if (project?.github_url) {
        console.log('✅ Using existing repository:', project.github_url);
        return {
          githubUrl: project.github_url,
          netlifyUrl: project.netlify_url || '',
          lastCommit: 'existing',
          deploymentStatus: 'success'
        };
      }

      // Create new repository only if none exists
      console.log('🆕 Creating new repository for project:', projectName);
      
      const { data: githubKeys } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .limit(1);

      if (!githubKeys || githubKeys.length === 0) {
        throw new Error('No GitHub API keys configured');
      }

      const repoName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      const repoDescription = `AI-generated website for ${channelData?.title || 'content creator'}`;

      // Create GitHub repository
      const repoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubKeys[0].api_token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          name: repoName,
          description: repoDescription,
          private: false,
          auto_init: false
        })
      });

      if (!repoResponse.ok) {
        throw new Error(`Failed to create repository: ${repoResponse.statusText}`);
      }

      const repo = await repoResponse.json();
      
      // Update project with repository URL
      await supabase
        .from('projects')
        .update({ github_url: repo.html_url })
        .eq('id', projectId);

      console.log('✅ Repository created successfully:', repo.html_url);

      return {
        githubUrl: repo.html_url,
        netlifyUrl: '',
        lastCommit: 'initial',
        deploymentStatus: 'pending'
      };

    } catch (error) {
      console.error('❌ Repository management error:', error);
      toast({
        title: "Repository Error",
        description: error instanceof Error ? error.message : "Failed to manage repository",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateRepository = useCallback(async (
    githubUrl: string,
    files: Array<{ path: string; content: string; message?: string }>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('🔄 Updating existing repository:', githubUrl);

      const { data: githubKeys } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .limit(1);

      if (!githubKeys || githubKeys.length === 0) {
        throw new Error('No GitHub API keys configured');
      }

      // Extract repo info from URL
      const urlParts = githubUrl.replace('https://github.com/', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];

      // Update each file
      for (const file of files) {
        await updateFileInRepository(
          githubKeys[0].api_token,
          owner,
          repo,
          file.path,
          file.content,
          file.message || `Update ${file.path} - AI Generated Changes`
        );
      }

      console.log('✅ Repository updated successfully');
      
      toast({
        title: "Repository Updated",
        description: "Your code changes have been pushed to GitHub",
      });

      return true;
    } catch (error) {
      console.error('❌ Repository update error:', error);
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : "Failed to update repository",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateFileInRepository = async (
    token: string,
    owner: string,
    repo: string,
    filePath: string,
    content: string,
    message: string
  ) => {
    // Get current file SHA if it exists
    let sha: string | undefined;
    
    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log(`File ${filePath} doesn't exist, will create new`);
    }

    // Update or create file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message,
          content: btoa(unescape(encodeURIComponent(content))),
          sha
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update ${filePath}: ${error}`);
    }
  };

  return {
    getOrCreateRepository,
    updateRepository,
    loading
  };
};
