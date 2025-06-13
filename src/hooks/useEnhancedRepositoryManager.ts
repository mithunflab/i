
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FileUpload {
  path: string;
  content: string;
  message: string;
  encoding?: string;
}

interface RepositoryStatus {
  isConnected: boolean;
  githubUrl?: string;
  netlifyUrl?: string;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  filesCount?: number;
}

export const useEnhancedRepositoryManager = () => {
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const createOrUpdateRepository = useCallback(async (
    projectId: string,
    projectName: string,
    files: Record<string, string>,
    channelData: any
  ): Promise<RepositoryStatus | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      setSyncProgress(10);

      // Check if project already has a repository
      const { data: project } = await supabase
        .from('projects')
        .select('github_url, netlify_url')
        .eq('id', projectId)
        .single();

      setSyncProgress(20);

      const { data: githubKeys } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .limit(1);

      if (!githubKeys || githubKeys.length === 0) {
        throw new Error('No GitHub API keys configured');
      }

      setSyncProgress(30);

      let repoUrl = project?.github_url;
      let owner: string, repo: string;

      if (repoUrl) {
        // Extract repo info from existing URL
        const urlParts = repoUrl.replace('https://github.com/', '').split('/');
        owner = urlParts[0];
        repo = urlParts[1];
        
        console.log('✅ Using existing repository:', repoUrl);
      } else {
        // Create new repository
        const repoName = `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
        const repoDescription = `AI-generated website for ${channelData?.title || 'content creator'} with structured file management`;

        setSyncProgress(40);

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

        const repoData = await repoResponse.json();
        repoUrl = repoData.html_url;
        owner = repoData.owner.login;
        repo = repoData.name;

        // Update project with repository URL
        await supabase
          .from('projects')
          .update({ github_url: repoUrl })
          .eq('id', projectId);

        console.log('✅ Repository created successfully:', repoUrl);
      }

      setSyncProgress(50);

      // Upload all files to repository
      const fileUploads: FileUpload[] = Object.entries(files).map(([filename, content]) => ({
        path: filename,
        content,
        message: `Update ${filename} - AI Generated Changes`,
        encoding: 'utf-8'
      }));

      // Upload files in batches to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < fileUploads.length; i += batchSize) {
        const batch = fileUploads.slice(i, i + batchSize);
        
        await Promise.all(batch.map(file => 
          uploadFileToRepository(githubKeys[0].api_token, owner, repo, file)
        ));
        
        setSyncProgress(50 + ((i + batchSize) / fileUploads.length) * 40);
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSyncProgress(95);

      // Deploy to Netlify if configured
      let netlifyUrl = project?.netlify_url;
      if (!netlifyUrl) {
        netlifyUrl = await deployToNetlify(projectId, repoUrl, projectName);
      }

      setSyncProgress(100);

      toast({
        title: "Repository Updated",
        description: `Successfully synced ${fileUploads.length} files to GitHub`,
      });

      return {
        isConnected: true,
        githubUrl: repoUrl,
        netlifyUrl,
        lastSync: new Date().toISOString(),
        status: 'connected',
        filesCount: fileUploads.length
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
      setSyncProgress(0);
    }
  }, [user, toast]);

  const uploadFileToRepository = async (
    token: string,
    owner: string,
    repo: string,
    file: FileUpload
  ) => {
    // Get current file SHA if it exists
    let sha: string | undefined;
    
    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
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
      console.log(`File ${file.path} doesn't exist, will create new`);
    }

    // Create base64 encoded content
    const encodedContent = btoa(unescape(encodeURIComponent(file.content)));

    // Update or create file
    const updateResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: file.message,
          content: encodedContent,
          sha
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update ${file.path}: ${error}`);
    }

    console.log(`✅ Uploaded ${file.path} to repository`);
  };

  const deployToNetlify = async (projectId: string, githubUrl: string, projectName: string): Promise<string | undefined> => {
    try {
      const { data: netlifyKeys } = await supabase
        .from('netlify_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .limit(1);

      if (!netlifyKeys || netlifyKeys.length === 0) {
        console.log('No Netlify API keys configured, skipping deployment');
        return undefined;
      }

      // Create Netlify site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyKeys[0].api_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${projectName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          repo: {
            provider: 'github',
            repo: githubUrl.replace('https://github.com/', ''),
            branch: 'main'
          },
          build_settings: {
            cmd: '',
            dir: '.',
            env: {}
          }
        })
      });

      if (siteResponse.ok) {
        const siteData = await siteResponse.json();
        const netlifyUrl = siteData.ssl_url || siteData.url;

        // Update project with Netlify URL
        await supabase
          .from('projects')
          .update({ netlify_url: netlifyUrl })
          .eq('id', projectId);

        console.log('✅ Deployed to Netlify:', netlifyUrl);
        return netlifyUrl;
      }
    } catch (error) {
      console.error('❌ Netlify deployment error:', error);
    }

    return undefined;
  };

  const checkRepositoryStatus = useCallback(async (projectId: string): Promise<RepositoryStatus> => {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('github_url, netlify_url, updated_at')
        .eq('id', projectId)
        .single();

      if (!project?.github_url) {
        return { isConnected: false, status: 'disconnected' };
      }

      // Verify repository still exists
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

      const urlParts = project.github_url.replace('https://github.com/', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${githubKeys[0].api_token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (repoResponse.ok) {
        return {
          isConnected: true,
          githubUrl: project.github_url,
          netlifyUrl: project.netlify_url,
          lastSync: project.updated_at,
          status: 'connected'
        };
      } else {
        return {
          isConnected: false,
          githubUrl: project.github_url,
          status: 'error'
        };
      }

    } catch (error) {
      console.error('❌ Error checking repository status:', error);
      return { isConnected: false, status: 'error' };
    }
  }, []);

  return {
    createOrUpdateRepository,
    checkRepositoryStatus,
    loading,
    syncProgress
  };
};
