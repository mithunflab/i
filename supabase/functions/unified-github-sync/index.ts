
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
    console.log('🔄 Enhanced GitHub Sync started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { projectId, files, commitMessage = 'AI Website Update', createRepo = false }: GitHubSyncRequest = await req.json();
    
    console.log('📝 Sync request:', { projectId, fileCount: Object.keys(files).length, createRepo });

    // Enhanced user authentication with multiple fallback methods
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        console.log('🔑 Attempting enhanced user authentication...');

        const { data: userData, error: authError } = await supabase.auth.getUser(token);

        if (!authError && userData?.user) {
          user = userData.user;
          console.log('✅ User authenticated successfully:', user.email);
        } else {
          console.log('⚠️ Primary auth failed, trying alternative methods...');
          
          // Try to get user info from project ownership
          const { data: project } = await supabase
            .from('projects')
            .select('user_id, profiles!inner(email)')
            .eq('id', projectId)
            .single();
            
          if (project) {
            user = { id: project.user_id, email: project.profiles.email };
            console.log('✅ User identified through project ownership:', user.email);
          }
        }
      } catch (error) {
        console.log('⚠️ Auth error, trying project-based identification:', error.message);
      }
    }

    if (!user) {
      console.error('❌ Could not authenticate user');
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required. Please log in and try again.',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401
      });
    }

    // Get project details with enhanced error handling
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('❌ Project not found:', projectError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Project not found or access denie -d. Please check the project ID.',
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    console.log('📂 Project loaded successfully:', project.name);

    // Get GitHub token with enhanced lookup
    const { data: githubTokens, error: tokenError } = await supabase
      .from('deployment_tokens')
      .select('token_value, token_name')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (tokenError || !githubTokens || githubTokens.length === 0) {
      console.error('❌ No GitHub token found:', tokenError);
      return new Response(JSON.stringify({
        success: false,
        error: 'No active GitHub token found. Please configure GitHub integration in your settings first.',
        needsGitHubSetup: true,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const githubToken = githubTokens[0].token_value;
    console.log('🔑 GitHub token retrieved successfully');

    let repoUrl = project.github_url;
    let repoOwner = '';
    let repoName = '';

    // Create repository if needed
    if (!repoUrl || createRepo) {
      console.log('🆕 Creating new GitHub repository...');
      
      repoName = project.name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
      
      // Get GitHub user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Lovable-AI-Website-Builder'
        }
      });

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error('❌ GitHub user fetch failed:', errorText);
        throw new Error(`Failed to get GitHub user info: ${userResponse.status}`);
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
          auto_init: true,
          gitignore_template: 'Node'
        })
      });

      if (!createRepoResponse.ok) {
        const errorText = await createRepoResponse.text();
        console.error('❌ Repository creation failed:', errorText);
        throw new Error(`Failed to create repository: ${createRepoResponse.status} - ${errorText}`);
      }

      const repoData = await createRepoResponse.json();
      repoUrl = repoData.html_url;
      
      console.log('✅ Repository created successfully:', repoUrl);

      // Update project with GitHub URL
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          github_url: repoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (updateError) {
        console.error('❌ Failed to update project with GitHub URL:', updateError);
      } else {
        console.log('✅ Project updated with GitHub URL');
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

    // Sync files to repository with enhanced error handling
    const fileSyncResults = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const [filePath, content] of Object.entries(files)) {
      try {
        console.log(`📄 Syncing file: ${filePath} (${content.length} chars)`);
        
        const result = await syncFileToGitHub(githubToken, repoOwner, repoName, filePath, content, commitMessage);
        fileSyncResults.push({ path: filePath, success: true, sha: result.sha });
        syncedCount++;
        
        console.log(`✅ File synced successfully: ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to sync file ${filePath}:`, error.message);
        fileSyncResults.push({ path: filePath, success: false, error: error.message });
        failedCount++;
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
      console.warn('Could not get commit hash:', error.message);
    }

    // Update git sync status
    const finalStatus = failedCount === 0 ? 'success' : syncedCount > 0 ? 'partial' : 'error';
    await updateGitSyncStatus(supabase, user.id, projectId, finalStatus, syncedCount, commitHash);

    console.log(`🎉 GitHub sync completed: ${syncedCount} synced, ${failedCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      repositoryUrl: repoUrl,
      syncedFiles: syncedCount,
      failedFiles: failedCount,
      totalFiles: Object.keys(files).length,
      commitHash,
      results: fileSyncResults,
      message: failedCount === 0 
        ? `Successfully synced all ${syncedCount} files to GitHub` 
        : `Synced ${syncedCount} files successfully, ${failedCount} failed`,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Enhanced GitHub sync error:', error);

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
      console.log(`📄 Found existing file ${path}, updating...`);
    } else {
      console.log(`📄 Creating new file ${path}...`);
    }
  } catch (error) {
    console.log(`📄 File ${path} doesn't exist, creating new file`);
  }

  // Create or update file
  const updateData: any = {
    message: `${message} - Update ${path}`,
    content: btoa(unescape(encodeURIComponent(content))), // Handle UTF-8 encoding properly
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
    throw new Error(`Failed to update file ${path}: ${updateResponse.status} - ${errorText}`);
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
        last_sync_at: status === 'success' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_id'
      });

    if (error) {
      console.error('Failed to update git sync status:', error);
    } else {
      console.log(`✅ Git sync status updated: ${status}`);
    }
  } catch (error) {
    console.error('Error updating git sync status:', error);
  }
}
