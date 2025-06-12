
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Get GitHub token from Supabase tables
      console.log('🔍 Fetching GitHub token from Supabase tables...');
      
      const { data: githubKeys, error: githubError } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (githubError) {
        console.error('❌ Error fetching GitHub keys:', githubError);
        throw new Error('Failed to fetch GitHub API keys from database');
      }

      if (!githubKeys || githubKeys.length === 0) {
        console.error('❌ No active GitHub API keys found in database');
        throw new Error('No active GitHub API keys found in database');
      }

      const githubToken = githubKeys[0].api_token;
      console.log('✅ Found GitHub token in database');

      // Get username first
      const username = await getUsername(githubToken);
      console.log('✅ GitHub username retrieved:', username);

      // Create repository
      const repoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Website-Builder'
        },
        body: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          description: description,
          private: false,
          auto_init: false
        })
      });

      if (!repoResponse.ok) {
        const error = await repoResponse.text();
        console.error('❌ GitHub repo creation failed:', error);
        throw new Error(`Failed to create repository: ${repoResponse.status} - ${error}`);
      }

      const repo: GitHubRepo = await repoResponse.json();
      console.log('✅ Repository created:', repo.html_url);

      // Upload files
      console.log('📤 Uploading files to repository...');
      await uploadToGitHub(githubToken, username, repo.name, [
        { path: 'index.html', content: code },
        { path: 'README.md', content: readme }
      ]);

      console.log('✅ Files uploaded successfully');

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

  const uploadToGitHub = async (token: string, username: string, repoName: string, files: Array<{path: string, content: string}>) => {
    for (const file of files) {
      console.log(`📤 Uploading ${file.path}...`);
      
      const fileResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Website-Builder'
        },
        body: JSON.stringify({
          message: `Add ${file.path}`,
          content: btoa(unescape(encodeURIComponent(file.content)))
        })
      });

      if (!fileResponse.ok) {
        const error = await fileResponse.text();
        console.error(`❌ Failed to upload ${file.path}:`, error);
        throw new Error(`Failed to upload ${file.path}: ${fileResponse.status} - ${error}`);
      }
      
      console.log(`✅ ${file.path} uploaded successfully`);
    }
  };

  const getUsername = async (token: string) => {
    console.log('🔍 Getting GitHub username...');
    
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Website-Builder'
      }
    });
    
    if (!userResponse.ok) {
      const error = await userResponse.text();
      console.error('❌ Failed to get GitHub user:', error);
      throw new Error(`Failed to get GitHub user: ${userResponse.status} - ${error}`);
    }
    
    const userData = await userResponse.json();
    return userData.login;
  };

  return {
    createGitHubRepo,
    loading
  };
};
