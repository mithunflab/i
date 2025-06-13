
import { supabase } from '@/integrations/supabase/client';

interface CreateProjectParams {
  name: string;
  description?: string;
  youtubeUrl?: string;
  channelData?: any;
  sourceCode?: string;
  github_url?: string;
  netlify_url?: string;
}

export const createProject = async (params: CreateProjectParams) => {
  try {
    console.log('🚀 Creating new project:', params.name);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Prepare project data
    const projectData = {
      name: params.name,
      description: params.description || '',
      user_id: user.id,
      youtube_url: params.youtubeUrl || null,
      channel_data: params.channelData || null,
      source_code: params.sourceCode || null,
      github_url: params.github_url || null,
      netlify_url: params.netlify_url || null,
      status: 'active' as const,
      verified: false
    };

    console.log('💾 Inserting project data...');

    // Insert project
    const { data: project, error: insertError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Database error:', insertError);
      throw new Error(`Failed to create project: ${insertError.message}`);
    }

    console.log('✅ Project created successfully:', project.id);
    return project;

  } catch (error) {
    console.error('❌ Error in createProject:', error);
    throw error;
  }
};

export const updateProject = async (projectId: string, updates: Partial<CreateProjectParams>) => {
  try {
    console.log('🔄 Updating project:', projectId);

    const { data: project, error: updateError } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description,
        source_code: updates.sourceCode,
        github_url: updates.github_url,
        netlify_url: updates.netlify_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    console.log('✅ Project updated successfully');
    return project;

  } catch (error) {
    console.error('❌ Error in updateProject:', error);
    throw error;
  }
};

export const getProject = async (projectId: string) => {
  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      throw new Error(`Failed to get project: ${error.message}`);
    }

    return project;
  } catch (error) {
    console.error('❌ Error in getProject:', error);
    throw error;
  }
};
