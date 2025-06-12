
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiKeyManager } from '@/utils/apiKeyManager';
import { useToast } from '@/hooks/use-toast';

interface GitHubRepo {
  name: string;
  html_url: string;
  clone_url: string;
}

export const useGitHubIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createGitHubRepo = async (projectName: string, description: string, code: string, readme: string) => {
    setLoading(true);
    try {
      console.log('🐙 Creating GitHub repository:', projectName);
      
      const githubToken = await apiKeyManager.getGitHubToken();
      if (!githubToken) {
        throw new Error('GitHub API key not available');
      }

      // Create repository
      const repoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          description: description,
          private: false,
          auto_init: false
        })
      });

      if (!repoResponse.ok) {
        const error = await repoResponse.json();
        throw new Error(`Failed to create repository: ${error.message}`);
      }

      const repo: GitHubRepo = await repoResponse.json();
      console.log('✅ Repository created:', repo.html_url);

      // Upload files
      await uploadToGitHub(githubToken, repo.name, [
        { path: 'index.html', content: code },
        { path: 'README.md', content: readme }
      ]);

      toast({
        title: "GitHub Repository Created",
        description: `Project uploaded to ${repo.html_url}`,
      });

      return repo;
    } catch (error) {
      console.error('❌ GitHub integration error:', error);
      toast({
        title: "GitHub Error",
        description: error instanceof Error ? error.message : "Failed to create repository",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadToGitHub = async (token: string, repoName: string, files: Array<{path: string, content: string}>) => {
    for (const file of files) {
      const fileResponse = await fetch(`https://api.github.com/repos/${await getUsername(token)}/${repoName}/contents/${file.path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Add ${file.path}`,
          content: btoa(unescape(encodeURIComponent(file.content)))
        })
      });

      if (!fileResponse.ok) {
        const error = await fileResponse.json();
        throw new Error(`Failed to upload ${file.path}: ${error.message}`);
      }
    }
  };

  const getUsername = async (token: string) => {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
      }
    });
    const userData = await userResponse.json();
    return userData.login;
  };

  return {
    createGitHubRepo,
    loading
  };
};
