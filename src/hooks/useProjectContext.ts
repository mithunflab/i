
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectContext {
  id: string;
  name: string;
  description: string;
  currentStructure: {
    components: string[];
    styling: Record<string, any>;
    layout: string;
  };
  designPrinciples: string[];
  chatHistory: any[];
  githubUrl?: string;
  netlifyUrl?: string;
  lastModified: Date;
}

export const useProjectContext = (projectId: string, youtubeUrl: string) => {
  const [context, setContext] = useState<ProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProjectContext = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      // Load project from database
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (project) {
        // Load chat history
        const { data: chatHistory } = await supabase
          .from('project_chat_history')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        // Parse current structure from source code
        const structure = parseProjectStructure(project.source_code);

        setContext({
          id: project.id,
          name: project.name,
          description: project.description,
          currentStructure: structure,
          designPrinciples: extractDesignPrinciples(project.source_code, project.channel_data),
          chatHistory: chatHistory || [],
          githubUrl: project.github_url,
          netlifyUrl: project.netlify_url,
          lastModified: new Date(project.updated_at)
        });
      }
    } catch (error) {
      console.error('Error loading project context:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const updateProjectContext = useCallback(async (updates: Partial<ProjectContext>) => {
    if (!context) return;

    const updatedContext = { ...context, ...updates, lastModified: new Date() };
    setContext(updatedContext);

    // Save to database
    try {
      await supabase
        .from('projects')
        .update({
          name: updatedContext.name,
          description: updatedContext.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
    } catch (error) {
      console.error('Error updating project context:', error);
    }
  }, [context, projectId]);

  const parseProjectStructure = (sourceCode: string) => {
    if (!sourceCode) return { components: [], styling: {}, layout: 'default' };

    const components = [];
    const styling = {};

    // Extract components from HTML
    const componentMatches = sourceCode.match(/<(\w+)[^>]*class="([^"]*)"[^>]*>/g) || [];
    componentMatches.forEach(match => {
      const tagMatch = match.match(/<(\w+)/);
      const classMatch = match.match(/class="([^"]*)"/);
      if (tagMatch && classMatch) {
        components.push({
          tag: tagMatch[1],
          classes: classMatch[1].split(' '),
          type: inferComponentType(tagMatch[1], classMatch[1])
        });
      }
    });

    // Extract color scheme
    const colorMatches = sourceCode.match(/background[^;]*:\s*([^;]+)/g) || [];
    colorMatches.forEach(match => {
      const color = match.split(':')[1]?.trim();
      if (color) styling.colors = [...(styling.colors || []), color];
    });

    return {
      components: [...new Set(components.map(c => c.type))],
      styling,
      layout: inferLayout(sourceCode)
    };
  };

  const inferComponentType = (tag: string, classes: string) => {
    if (classes.includes('hero')) return 'hero';
    if (classes.includes('nav') || tag === 'nav') return 'navigation';
    if (classes.includes('footer') || tag === 'footer') return 'footer';
    if (classes.includes('gallery') || classes.includes('video')) return 'video-gallery';
    if (classes.includes('stats') || classes.includes('counter')) return 'stats';
    if (classes.includes('cta') || classes.includes('button')) return 'call-to-action';
    return tag;
  };

  const inferLayout = (sourceCode: string) => {
    if (sourceCode.includes('grid-template-columns')) return 'grid';
    if (sourceCode.includes('flex-direction: column')) return 'vertical';
    if (sourceCode.includes('display: flex')) return 'horizontal';
    return 'default';
  };

  const extractDesignPrinciples = (sourceCode: string, channelData: any) => {
    const principles = [];
    
    if (channelData?.title) {
      principles.push(`Brand consistency with ${channelData.title}`);
    }
    
    if (sourceCode?.includes('gradient')) {
      principles.push('Modern gradient design');
    }
    
    if (sourceCode?.includes('responsive') || sourceCode?.includes('@media')) {
      principles.push('Mobile-responsive design');
    }
    
    if (sourceCode?.includes('youtube') || sourceCode?.includes('subscribe')) {
      principles.push('YouTube integration focus');
    }
    
    principles.push('Professional and clean aesthetics');
    
    return principles;
  };

  useEffect(() => {
    loadProjectContext();
  }, [loadProjectContext]);

  return {
    context,
    loading,
    updateProjectContext,
    refreshContext: loadProjectContext
  };
};
