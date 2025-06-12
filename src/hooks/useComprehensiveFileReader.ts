
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectFile {
  path: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'markdown' | 'other';
}

interface ProjectStructure {
  files: ProjectFile[];
  components: string[];
  styles: string[];
  layout: string;
  chatHistory: any[];
  readmeContent?: string;
}

export const useComprehensiveFileReader = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const readProjectFiles = useCallback(async (projectId: string): Promise<ProjectStructure | null> => {
    if (!user || !projectId) return null;

    try {
      setLoading(true);
      console.log('🔍 Reading comprehensive project files for:', projectId);

      // Get project data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) return null;

      // Get chat history
      const { data: chatHistory } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Parse project files
      const files: ProjectFile[] = [];
      
      if (project.source_code) {
        files.push({
          path: 'index.html',
          content: project.source_code,
          type: 'html'
        });

        // Extract CSS from HTML
        const cssMatch = project.source_code.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (cssMatch) {
          const cssContent = cssMatch.map(match => 
            match.replace(/<\/?style[^>]*>/gi, '')
          ).join('\n');
          
          files.push({
            path: 'styles.css',
            content: cssContent,
            type: 'css'
          });
        }

        // Extract JS from HTML
        const jsMatch = project.source_code.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (jsMatch) {
          const jsContent = jsMatch.map(match => 
            match.replace(/<\/?script[^>]*>/gi, '')
          ).join('\n');
          
          files.push({
            path: 'scripts.js',
            content: jsContent,
            type: 'js'
          });
        }
      }

      // Generate README if exists
      if (project.description) {
        const readmeContent = generateReadmeFromProject(project);
        files.push({
          path: 'README.md',
          content: readmeContent,
          type: 'markdown'
        });
      }

      // Analyze structure
      const components = extractComponents(project.source_code || '');
      const styles = extractStyles(project.source_code || '');
      const layout = detectLayout(project.source_code || '');

      console.log('✅ Project files read successfully:', {
        filesCount: files.length,
        componentsCount: components.length,
        chatHistoryCount: chatHistory?.length || 0
      });

      return {
        files,
        components,
        styles,
        layout,
        chatHistory: chatHistory || [],
        readmeContent: files.find(f => f.path === 'README.md')?.content
      };

    } catch (error) {
      console.error('❌ Error reading project files:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    readProjectFiles,
    loading
  };
};

const extractComponents = (sourceCode: string): string[] => {
  const components = [];
  
  // Extract major sections
  if (sourceCode.includes('hero') || sourceCode.includes('header')) {
    components.push('hero-section');
  }
  if (sourceCode.includes('nav') || sourceCode.includes('navigation')) {
    components.push('navigation');
  }
  if (sourceCode.includes('gallery') || sourceCode.includes('video')) {
    components.push('video-gallery');
  }
  if (sourceCode.includes('stats') || sourceCode.includes('counter')) {
    components.push('stats-section');
  }
  if (sourceCode.includes('footer')) {
    components.push('footer');
  }
  if (sourceCode.includes('cta') || sourceCode.includes('subscribe')) {
    components.push('call-to-action');
  }

  return components;
};

const extractStyles = (sourceCode: string): string[] => {
  const styles = [];
  
  // Extract color schemes
  const colorMatches = sourceCode.match(/background[^;]*:\s*([^;]+)/g) || [];
  colorMatches.forEach(match => {
    const color = match.split(':')[1]?.trim();
    if (color) styles.push(color);
  });

  return [...new Set(styles)];
};

const detectLayout = (sourceCode: string): string => {
  if (sourceCode.includes('grid-template-columns')) return 'grid';
  if (sourceCode.includes('flex-direction: column')) return 'vertical';
  if (sourceCode.includes('display: flex')) return 'horizontal';
  return 'default';
};

const generateReadmeFromProject = (project: any): string => {
  return `# ${project.name}

${project.description}

## Project Details
- Created: ${new Date(project.created_at).toLocaleDateString()}
- Last Updated: ${new Date(project.updated_at).toLocaleDateString()}
- Status: ${project.status}

## Features
- YouTube Channel Integration
- Responsive Design
- Real-time Updates

## Links
${project.github_url ? `- [GitHub Repository](${project.github_url})` : ''}
${project.netlify_url ? `- [Live Site](${project.netlify_url})` : ''}

## Channel Data
${project.channel_data ? `
- Channel: ${project.channel_data.title || 'N/A'}
- Subscribers: ${parseInt(project.channel_data.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(project.channel_data.videoCount || '0').toLocaleString()}
` : ''}

Generated with AI Website Builder
`;
};
