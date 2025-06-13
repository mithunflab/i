
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ChatHistoryMetadata {
  component?: string;
  beforeCode?: string;
  afterCode?: string;
  timestamp?: string;
}

interface ProjectMemory {
  id: string;
  currentDesign: {
    colors: string[];
    fonts: string[];
    layout: string;
    branding: any;
  };
  components: {
    header: any;
    hero: any;
    videos: any;
    footer: any;
    navigation: any;
  };
  codeStructure: {
    html: string;
    css: string;
    js: string;
    pages: string[];
  };
  chatHistory: any[];
  lastModified: Date;
  preservationRules: string[];
}

export const useAdvancedAIMemory = (projectId: string) => {
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadProjectMemory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      console.log('🧠 Loading advanced AI memory for project:', projectId);

      // Load project with all data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) return;

      // Load chat history
      const { data: chatHistory } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      // Parse existing code structure
      const codeStructure = parseCodeStructure(project.source_code || '');
      const designElements = extractDesignElements(project.source_code || '');
      const components = extractComponents(project.source_code || '');

      const projectMemory: ProjectMemory = {
        id: projectId,
        currentDesign: designElements,
        components: components,
        codeStructure: codeStructure,
        chatHistory: chatHistory || [],
        lastModified: new Date(project.updated_at),
        preservationRules: generatePreservationRules(project.source_code || '', project.channel_data)
      };

      setMemory(projectMemory);
      console.log('✅ Advanced AI memory loaded successfully');

    } catch (error) {
      console.error('❌ Error loading AI memory:', error);
    } finally {
      setLoading(false);
    }
  }, [user, projectId]);

  const updateMemory = useCallback(async (updates: Partial<ProjectMemory>) => {
    if (!memory) return;

    const updatedMemory = {
      ...memory,
      ...updates,
      lastModified: new Date()
    };

    setMemory(updatedMemory);

    // Save to database
    try {
      await supabase
        .from('projects')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
    } catch (error) {
      console.error('❌ Error updating memory:', error);
    }
  }, [memory, projectId]);

  const generateTargetedPrompt = useCallback((
    userRequest: string,
    channelData: any,
    currentCode: string
  ) => {
    if (!memory) return '';

    // Analyze user request to identify target
    const targetElement = identifyTargetElement(userRequest);
    const changeScope = determineChangeScope(userRequest);

    return `
# 🎯 CRITICAL: ENHANCED AI MEMORY & TARGETED MODIFICATION

## MANDATORY PRESERVATION SYSTEM
**NEVER MODIFY ANYTHING EXCEPT THE SPECIFIC ELEMENT REQUESTED**

### Current Project Memory (PRESERVE EXACTLY)
- **Design Colors**: ${memory.currentDesign.colors.join(', ')}
- **Layout Style**: ${memory.currentDesign.layout}
- **Branding Elements**: Channel logo, YouTube integration
- **Component Structure**: ${Object.keys(memory.components).join(', ')}
- **File Structure**: ${memory.codeStructure.pages.join(', ')}

### User Request Analysis
- **Request**: "${userRequest}"
- **Target Element**: ${targetElement}
- **Change Scope**: ${changeScope}
- **Preservation Level**: MAXIMUM (95% of code unchanged)

### STRICT MODIFICATION RULES
1. 🚫 **NEVER** rewrite the entire website
2. 🚫 **NEVER** change existing color schemes or layout
3. 🚫 **NEVER** remove YouTube branding or channel data
4. 🚫 **NEVER** modify components not mentioned in request
5. ✅ **ONLY** change the specific ${targetElement} as requested

### Real Channel Data (USE EXACTLY)
${channelData ? `
- Channel: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(channelData.videoCount || '0').toLocaleString()}
- Thumbnail: ${channelData.thumbnail}
- Real Video Data: Use actual video thumbnails and titles
` : 'No channel data available'}

### Current Code Structure (PRESERVE)
\`\`\`html
${currentCode.substring(0, 500)}...
\`\`\`

### PRESERVATION RULES
${memory.preservationRules.map(rule => `- ${rule}`).join('\n')}

## OUTPUT REQUIREMENTS
1. **Minimal Change**: Modify ONLY the requested ${targetElement}
2. **Preserve Design**: Keep ALL existing styling and colors
3. **Real Data**: Use actual YouTube channel information
4. **Professional Quality**: Generate clean, production-ready code
5. **Multi-File Structure**: Create separate HTML, CSS, JS files
6. **Component Modularity**: Header, Footer, Pages as separate files

**CRITICAL**: This is a TARGETED modification. Change ONLY what the user specifically requested while preserving EVERYTHING else exactly as it was.
`;
  }, [memory]);

  useEffect(() => {
    loadProjectMemory();
  }, [loadProjectMemory]);

  return {
    memory,
    loading,
    updateMemory,
    generateTargetedPrompt,
    refreshMemory: loadProjectMemory
  };
};

// Helper functions
const parseCodeStructure = (sourceCode: string) => {
  return {
    html: sourceCode,
    css: extractCSS(sourceCode),
    js: extractJavaScript(sourceCode),
    pages: ['index', 'about', 'videos', 'contact']
  };
};

const extractDesignElements = (sourceCode: string) => {
  const colors = [];
  const fonts = [];
  
  // Extract colors from CSS
  const colorMatches = sourceCode.match(/(?:color|background)[^;]*:\s*([^;]+)/g) || [];
  colorMatches.forEach(match => {
    const color = match.split(':')[1]?.trim();
    if (color && !colors.includes(color)) {
      colors.push(color);
    }
  });

  // Extract fonts
  const fontMatches = sourceCode.match(/font-family[^;]*:\s*([^;]+)/g) || [];
  fontMatches.forEach(match => {
    const font = match.split(':')[1]?.trim();
    if (font && !fonts.includes(font)) {
      fonts.push(font);
    }
  });

  return {
    colors: colors.slice(0, 10), // Limit to prevent memory bloat
    fonts: fonts.slice(0, 5),
    layout: detectLayout(sourceCode),
    branding: extractBranding(sourceCode)
  };
};

const extractComponents = (sourceCode: string) => {
  return {
    header: extractComponent(sourceCode, 'header'),
    hero: extractComponent(sourceCode, 'hero'),
    videos: extractComponent(sourceCode, 'video'),
    footer: extractComponent(sourceCode, 'footer'),
    navigation: extractComponent(sourceCode, 'nav')
  };
};

const extractComponent = (sourceCode: string, componentType: string) => {
  // Extract component-specific HTML and styling
  const regex = new RegExp(`<[^>]*class="[^"]*${componentType}[^"]*"[^>]*>.*?</[^>]*>`, 'gis');
  const matches = sourceCode.match(regex);
  return matches ? matches[0] : null;
};

const extractCSS = (sourceCode: string) => {
  const cssMatch = sourceCode.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
  return cssMatch ? cssMatch.map(match => match.replace(/<\/?style[^>]*>/gi, '')).join('\n') : '';
};

const extractJavaScript = (sourceCode: string) => {
  const jsMatch = sourceCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  return jsMatch ? jsMatch.map(match => match.replace(/<\/?script[^>]*>/gi, '')).join('\n') : '';
};

const detectLayout = (sourceCode: string) => {
  if (sourceCode.includes('grid-template-columns')) return 'grid';
  if (sourceCode.includes('flex-direction: column')) return 'vertical';
  if (sourceCode.includes('display: flex')) return 'flexbox';
  return 'standard';
};

const extractBranding = (sourceCode: string) => {
  return {
    hasLogo: sourceCode.includes('logo') || sourceCode.includes('brand'),
    hasYouTubeIntegration: sourceCode.includes('youtube') || sourceCode.includes('subscribe'),
    colorScheme: 'professional'
  };
};

const generatePreservationRules = (sourceCode: string, channelData: any) => {
  const rules = [
    '🚫 NEVER modify the overall page layout structure',
    '🚫 NEVER change existing color schemes or typography',
    '🚫 NEVER remove YouTube branding or channel integration',
    '🚫 NEVER alter navigation functionality',
    '🚫 NEVER modify footer content unless specifically requested',
    '🚫 NEVER change responsive design breakpoints'
  ];

  if (channelData?.title) {
    rules.push(`🚫 NEVER change channel name: ${channelData.title}`);
  }

  if (sourceCode.includes('logo')) {
    rules.push('🚫 NEVER remove or modify channel logo positioning');
  }

  return rules;
};

const identifyTargetElement = (userRequest: string): string => {
  const request = userRequest.toLowerCase();
  
  const elementMap = {
    'header': ['header', 'top', 'navigation', 'nav', 'menu'],
    'hero': ['hero', 'title', 'main title', 'banner', 'heading'],
    'videos': ['video', 'gallery', 'content', 'thumbnails'],
    'footer': ['footer', 'bottom', 'contact'],
    'about': ['about', 'description', 'channel info'],
    'styling': ['color', 'style', 'background', 'theme'],
    'content': ['text', 'content', 'description']
  };

  for (const [element, keywords] of Object.entries(elementMap)) {
    if (keywords.some(keyword => request.includes(keyword))) {
      return element;
    }
  }

  return 'specific-element';
};

const determineChangeScope = (userRequest: string): 'minimal' | 'component' | 'page' => {
  const request = userRequest.toLowerCase();
  
  if (request.includes('word') || request.includes('text') || request.includes('title')) {
    return 'minimal';
  }
  
  if (request.includes('page') || request.includes('entire') || request.includes('whole')) {
    return 'page';
  }
  
  return 'component';
};
