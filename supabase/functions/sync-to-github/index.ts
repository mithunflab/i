
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getActiveGitHubToken() {
  try {
    const { data, error } = await supabase
      .from('github_api_keys')
      .select('api_token')
      .eq('is_active', true)
      .limit(1)
      .single();
    
    if (error || !data) return null;
    return data.api_token;
  } catch (error) {
    console.error('Error getting GitHub token:', error);
    return null;
  }
}

async function updateGitSyncStatus(projectId: string, userId: string, status: string, data: any = {}) {
  try {
    await supabase
      .from('git_sync_status')
      .upsert({
        user_id: userId,
        project_id: projectId,
        sync_status: status,
        ...data
      }, {
        onConflict: 'user_id,project_id',
        ignoreDuplicates: false
      });
  } catch (error) {
    console.error('Error updating git sync status:', error);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, files, commitMessage } = await req.json();
    
    console.log('🔄 Starting GitHub sync for project:', projectId);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    if (!project.github_url) {
      throw new Error('Project not connected to GitHub');
    }

    // Update sync status to syncing
    await updateGitSyncStatus(projectId, user.id, 'syncing', {
      files_synced: 0
    });

    // Get GitHub token
    const githubToken = await getActiveGitHubToken();
    if (!githubToken) {
      throw new Error('No active GitHub token found');
    }

    // Extract owner and repo from GitHub URL
    const urlMatch = project.github_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub URL format');
    }

    const [, owner, repo] = urlMatch;

    // Get the current commit SHA
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/main`, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!repoResponse.ok) {
      throw new Error('Failed to get repository information');
    }

    const repoData = await repoResponse.json();
    const currentSha = repoData.object.sha;

    // Create blobs for each file
    const blobs = [];
    for (const [fileName, content] of Object.entries(files)) {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: btoa(unescape(encodeURIComponent(content))),
          encoding: 'base64'
        })
      });

      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob for ${fileName}`);
      }

      const blobData = await blobResponse.json();
      blobs.push({
        path: fileName,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      });
    }

    // Create tree
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base_tree: currentSha,
        tree: blobs
      })
    });

    if (!treeResponse.ok) {
      throw new Error('Failed to create tree');
    }

    const treeData = await treeResponse.json();

    // Create commit
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [currentSha]
      })
    });

    if (!commitResponse.ok) {
      throw new Error('Failed to create commit');
    }

    const commitData = await commitResponse.json();

    // Update reference
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sha: commitData.sha
      })
    });

    if (!refResponse.ok) {
      throw new Error('Failed to update reference');
    }

    // Update sync status to success
    await updateGitSyncStatus(projectId, user.id, 'success', {
      files_synced: Object.keys(files).length,
      commit_hash: commitData.sha,
      last_sync_at: new Date().toISOString()
    });

    console.log('✅ GitHub sync completed successfully');

    return new Response(JSON.stringify({
      success: true,
      commitHash: commitData.sha,
      filesSynced: Object.keys(files).length,
      message: 'Files synced to GitHub successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ GitHub sync error:', error);

    // Update sync status to error
    const { projectId } = await req.json().catch(() => ({}));
    if (projectId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          await updateGitSyncStatus(projectId, user.id, 'error', {
            error_message: error.message
          });
        }
      }
    }

    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
