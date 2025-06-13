
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GitHubRepo {
  name: string;
  html_url: string;
  clone_url: string;
}

interface FileChange {
  path: string;
  content: string;
  action: 'create' | 'update' | 'delete';
}

export const useGitHubIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createGitHubRepo = async (projectName: string, description: string, code: string, readme: string): Promise<GitHubRepo> => {
    setLoading(true);
    try {
      console.log('🐙 Creating GitHub repository:', projectName);
      
      // Get GitHub token from Supabase tables
      const { data: githubKeys, error: githubError } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (githubError || !githubKeys || githubKeys.length === 0) {
        throw new Error('No active GitHub API keys found in database');
      }

      const githubToken = githubKeys[0].api_token;
      const username = await getUsername(githubToken);

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
        throw new Error(`Failed to create repository: ${repoResponse.status} - ${error}`);
      }

      const repo: GitHubRepo = await repoResponse.json();

      // Upload files
      const filesToUpload = [
        { path: 'index.html', content: code },
        { path: 'README.md', content: readme },
        { path: 'style.css', content: extractCSSFromHTML(code) },
        { path: 'script.js', content: extractJSFromHTML(code) },
        { path: 'package.json', content: generatePackageJson(projectName, description) }
      ];

      await uploadToGitHub(githubToken, username, repo.name, filesToUpload);

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

  const updateGitHubRepo = async (repoUrl: string, fileChanges: FileChange[]) => {
    setLoading(true);
    try {
      console.log('🔄 Updating existing GitHub repository:', repoUrl);
      
      // Extract username and repo name from URL
      const urlParts = repoUrl.replace('https://github.com/', '').split('/');
      const username = urlParts[0];
      const repoName = urlParts[1];

      // Get GitHub token
      const { data: githubKeys, error: githubError } = await supabase
        .from('github_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (githubError || !githubKeys || githubKeys.length === 0) {
        throw new Error('No active GitHub API keys found');
      }

      const githubToken = githubKeys[0].api_token;

      // Update files
      console.log('📝 Updating files in existing repository...');
      for (const change of fileChanges) {
        if (change.action === 'delete') {
          await deleteFromGitHub(githubToken, username, repoName, change.path);
        } else {
          await updateFileInGitHub(githubToken, username, repoName, change.path, change.content);
        }
      }

      console.log('✅ Repository updated successfully');
      
      toast({
        title: "Repository Updated",
        description: "Your code changes have been pushed to GitHub",
      });

    } catch (error) {
      console.error('❌ GitHub update error:', error);
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : "Failed to update repository",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const extractCSSFromHTML = (html: string): string => {
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    return styleMatch ? styleMatch[1].trim() : '/* No CSS found */';
  };

  const extractJSFromHTML = (html: string): string => {
    const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    return scriptMatch && !scriptMatch[0].includes('cdn.') ? scriptMatch[1].trim() : '/* No JavaScript found */';
  };

  const generatePackageJson = (name: string, description: string): string => {
    return JSON.stringify({
      name: name.toLowerCase().replace(/\s+/g, '-'),
      version: "1.0.0",
      description: description,
      main: "index.html",
      scripts: {
        start: "python -m http.server 8000",
        deploy: "gh-pages -d ."
      },
      keywords: ["youtube", "website", "ai-generated"],
      author: "AI Website Builder",
      license: "MIT",
      devDependencies: {
        "gh-pages": "^3.2.3"
      }
    }, null, 2);
  };

  const updateFileInGitHub = async (token: string, username: string, repoName: string, filePath: string, content: string) => {
    // First, try to get the current file to get its SHA
    let sha = undefined;
    try {
      const getFileResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'AI-Website-Builder'
        }
      });
      
      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log(`File ${filePath} doesn't exist, will create new`);
    }

    // Update or create the file
    const updateResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Website-Builder'
      },
      body: JSON.stringify({
        message: `Update ${filePath} - AI Generated Content`,
        content: btoa(unescape(encodeURIComponent(content))),
        sha: sha
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Failed to update ${filePath}: ${updateResponse.status} - ${error}`);
    }
  };

  const deleteFromGitHub = async (token: string, username: string, repoName: string, filePath: string) => {
    // Get file SHA first
    const getFileResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Website-Builder'
      }
    });

    if (!getFileResponse.ok) {
      console.log(`File ${filePath} doesn't exist, skipping deletion`);
      return;
    }

    const fileData = await getFileResponse.json();
    
    // Delete the file
    const deleteResponse = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'AI-Website-Builder'
      },
      body: JSON.stringify({
        message: `Delete ${filePath}`,
        sha: fileData.sha
      })
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      throw new Error(`Failed to delete ${filePath}: ${deleteResponse.status} - ${error}`);
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
    updateGitHubRepo,
    loading
  };
};
