
import { useState, useCallback } from 'react';

interface ProjectStructure {
  components: string[];
  styling: {
    colors: string[];
  };
  layout: string;
}

interface ProjectContext {
  currentStructure: ProjectStructure;
  designPrinciples: string[];
  userPreferences: Record<string, any>;
}

export const useProjectContext = (projectId: string, youtubeUrl: string) => {
  const [context, setContext] = useState<ProjectContext>({
    currentStructure: {
      components: ['header', 'hero', 'stats', 'videos', 'footer'],
      styling: {
        colors: ['red', 'white', 'gray']
      },
      layout: 'modern'
    },
    designPrinciples: ['responsive', 'clean', 'youtube-branded'],
    userPreferences: {}
  });

  const updateProjectContext = useCallback(async (updates: Partial<ProjectContext>) => {
    setContext(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  return {
    context,
    updateProjectContext
  };
};
