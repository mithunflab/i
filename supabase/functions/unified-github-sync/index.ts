
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GitHubSyncRequest {
  projectId: string;
  files: Record<string, string>;
  commitMessage?: string;
  createRepo?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Unified GitHub Sync started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, files, commitMessage = 'AI Website Update', createRepo = false }: GitHubSyncRequest = await req.json();
    
    console.log('📝 Sync request:', { projectId, fileCount: Object.keys(files).length, createRepo });

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    console.log('✅ User authenticated:', user.email);

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found or access denied');
    }

    console.log('📂 Project loaded:', project.name);

    // Get GitHub token
    const { data: githubTokens, error: tokenError } = await supabase
      .from('deployment_tokens')
      .select('token_value')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .eq('is_active', true)
      .limit(1);

    if (tokenError || !githubTokens || githubTokens.length === 0) {
      throw new Error('No active GitHub token found. Please configure GitHub integration first.');
    }

    const githubToken = githubTokens[0].token_value;
    console.log('🔑 GitHub token retrieved');

    let repoUrl = project.github_url;
    let repoOwner = '';
    let repoName = '';

    // Create repository if needed
    if (!repoUrl || createRepo) {
      console.log('🆕 Creating new GitHub repository...');
      
      repoName = project.name.replace(/\s+/g, '-').toLowerCase();
      
      // Get GitHub user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-AI-Website-Builder'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get GitHub user info');
      }

      const githubUser = await userResponse.json();
      repoOwner = githubUser.login;

      // Create repository
      const createRepoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Lovable-AI-Website-Builder'
        },
        body: JSON.stringify({
          name: repoName,
          description: project.description || `AI-generated website for ${project.name}`,
          private: false,
          auto_init: true
        })
      });

      if (!createRepoResponse.ok) {
        const errorText = await createRepoResponse.text();
        throw new Error(`Failed to create repository: ${errorText}`);
      }

      const repoData = await createRepoResponse.json();
      repoUrl = repoData.html_url;
      
      console.log('✅ Repository created:', repoUrl);

      // Update project with GitHub URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ github_url: repoUrl })
        .eq('id', projectId);

      if (updateError) {
        console.error('❌ Failed to update project with GitHub URL:', updateError);
      }
    } else {
      // Parse existing repository URL
      const urlParts = repoUrl.replace('https://github.com/', '').split('/');
      repoOwner = urlParts[0];
      repoName = urlParts[1];
    }

    console.log('📁 Repository info:', { owner: repoOwner, name: repoName });

    // Update git sync status to syncing
    await updateGitSyncStatus(supabase, user.id, projectId, 'syncing', 0);

    // Sync files to repository
    const fileSyncResults = [];
    let syncedCount = 0;

    for (const [filePath, content] of Object.entries(files)) {
      try {
        console.log(`📄 Syncing file: ${filePath}`);
        
        const result = await syncFileToGitHub(githubToken, repoOwner, repoName, filePath, content, commitMessage);
        fileSyncResults.push({ path: filePath, success: true, sha: result.sha });
        syncedCount++;
        
        console.log(`✅ File synced: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to sync file ${filePath}:`, error);
        fileSyncResults.push({ path: filePath, success: false, error: error.message });
      }
    }

    // Get latest commit hash
    let commitHash = '';
    try {
      const commitsResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits`, {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-AI-Website-Builder'
        }
      });

      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        if (commits.length > 0) {
          commitHash = commits[0].sha.substring(0, 7);
        }
      }
    } catch (error) {
      console.warn('Could not get commit hash:', error);
    }

    // Update git sync status to success
    await updateGitSyncStatus(supabase, user.id, projectId, 'success', syncedCount, commitHash);

    console.log('🎉 GitHub sync completed successfully');

    return new Response(JSON.stringify({
      success: true,
      repositoryUrl: repoUrl,
      syncedFiles: syncedCount,
      totalFiles: Object.keys(files).length,
      commitHash,
      results: fileSyncResults,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GitHub sync error:', error);

    // Try to update sync status to error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          const body = await req.json();
          await updateGitSyncStatus(supabase, user.id, body.projectId, 'error', 0, '', error.message);
        }
      }
    } catch (statusError) {
      console.error('Failed to update error status:', statusError);
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

async function syncFileToGitHub(token: string, owner: string, repo: string, path: string, content: string, message: string) {
  // Get current file (if exists) to get SHA
  let sha = '';
  try {
    const getFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Lovable-AI-Website-Builder'
      }
    });

    if (getFileResponse.ok) {
      const fileData = await getFileResponse.json();
      sha = fileData.sha;
    }
  } catch (error) {
    // File doesn't exist, which is fine for new files
    console.log(`File ${path} doesn't exist, creating new file`);
  }

  // Create or update file
  const updateData: any = {
    message: `${message} - Update ${path}`,
    content: btoa(content),
  };

  if (sha) {
    updateData.sha = sha;
  }

  const updateResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Lovable-AI-Website-Builder'
    },
    body: JSON.stringify(updateData)
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update file ${path}: ${errorText}`);
  }

  return await updateResponse.json();
}

async function updateGitSyncStatus(supabase: any, userId: string, projectId: string, status: string, filesSynced: number, commitHash?: string, errorMessage?: string) {
  try {
    const { error } = await supabase
      .from('git_sync_status')
      .upsert({
        user_id: userId,
        project_id: projectId,
        sync_status: status,
        files_synced: filesSynced,
        commit_hash: commitHash,
        error_message: errorMessage,
        last_sync_at: status === 'success' ? new Date().toISOString() : null
      }, {
        onConflict: 'user_id,project_id'
      });

    if (error) {
      console.error('Failed to update git sync status:', error);
    }
  } catch (error) {
    console.error('Error updating git sync status:', error);
  }
}
