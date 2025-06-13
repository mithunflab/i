
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GitHubFile {
  path: string;
  content: string;
  message?: string;
}

export const useRealTimeGitHub = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const uploadToGitHub = useCallback(async (
    projectId: string,
    projectName: string,
    files: GitHubFile[],
    existingRepoUrl?: string
  ): Promise<string | null> => {
    if (!user) return null;

    setUploading(true);
    
    try {
      console.log('📤 Starting real-time GitHub upload...');
      
      // Get GitHub API token directly from database
      const { data: githubKeys, error: keyError } = await supabase
        .from('github_api_keys')
        .select('api_token, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (keyError || !githubKeys || githubKeys.length === 0) {
        throw new Error('No active GitHub API keys found. Please configure GitHub integration.');
      }

      const githubToken = githubKeys[0].api_token;
      console.log('✅ Using GitHub API key:', githubKeys[0].name);

      let repoUrl = existingRepoUrl;
      let repoName = projectName.toLowerCase().replace(/\s+/g, '-');
      let username: string;

      // Get GitHub username
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Website-Builder'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to authenticate with GitHub');
      }

      const userData = await userResponse.json();
      username = userData.login;

      // Create repository if it doesn't exist
      if (!repoUrl) {
        console.log('🆕 Creating new GitHub repository...');
        
        const repoResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Website-Builder'
          },
          body: JSON.stringify({
            name: repoName,
            description: `AI-generated website project`,
            private: false,
            auto_init: false
          })
        });

        if (!repoResponse.ok) {
          const error = await repoResponse.text();
          throw new Error(`Failed to create repository: ${error}`);
        }

        const repo = await repoResponse.json();
        repoUrl = repo.html_url;
        
        // Update project with GitHub URL
        await supabase
          .from('projects')
          .update({ github_url: repoUrl })
          .eq('id', projectId);
      } else {
        // Extract repo name from existing URL
        const urlParts = repoUrl.replace('https://github.com/', '').split('/');
        username = urlParts[0];
        repoName = urlParts[1];
      }

      // Upload files in real-time
      console.log('📁 Uploading files to GitHub...');
      for (const file of files) {
        await uploadFileToGitHub(githubToken, username, repoName, file);
      }

      console.log('✅ Real-time GitHub upload completed:', repoUrl);
      
      toast({
        title: "🚀 GitHub Upload Complete!",
        description: `Files uploaded to ${repoUrl}`,
      });

      return repoUrl;

    } catch (error) {
      console.error('❌ GitHub upload error:', error);
      toast({
        title: "GitHub Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload to GitHub",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [user, toast]);

  const uploadFileToGitHub = async (
    token: string,
    username: string,
    repoName: string,
    file: GitHubFile
  ) => {
    // Check if file exists to get SHA
    let sha: string | undefined;
    
    try {
      const getResponse = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'AI-Website-Builder'
          }
        }
      );

      if (getResponse.ok) {
        const fileData = await getResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log(`File ${file.path} doesn't exist, creating new`);
    }

    // Upload or update file
    const uploadResponse = await fetch(
      `https://api.github.com/repos/${username}/${repoName}/contents/${file.path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Website-Builder'
        },
        body: JSON.stringify({
          message: file.message || `Update ${file.path} - Real-time AI Generated`,
          content: btoa(unescape(encodeURIComponent(file.content))),
          sha
        })
      }
    );

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Failed to upload ${file.path}: ${error}`);
    }

    console.log(`✅ Uploaded: ${file.path}`);
  };

  return {
    uploadToGitHub,
    uploading
  };
};
