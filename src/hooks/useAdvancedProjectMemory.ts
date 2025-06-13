
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ComponentMapper } from '../utils/componentMapper';

interface ProjectMemoryState {
  projectId: string;
  componentMap: any;
  designTokens: any;
  fileStructure: {
    'index.html': string;
    'style.css': string;
    'script.js': string;
    'design.json': string;
    'componentMap.json': string;
  };
  changeHistory: Array<{
    timestamp: Date;
    component: string;
    change: string;
    beforeCode: string;
    afterCode: string;
  }>;
  preservationRules: string[];
}

export const useAdvancedProjectMemory = (projectId: string) => {
  const [memory, setMemory] = useState<ProjectMemoryState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProjectMemory = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      console.log('🧠 Loading advanced project memory for:', projectId);

      // Load project data
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) return;

      // Parse existing code to build memory
      const sourceCode = project.source_code || '';
      const mapper = new ComponentMapper({
        colors: { primary: '#ff0000', secondary: '#666666', background: '#ffffff', text: '#333333', accent: '#0066cc' },
        typography: { fontFamily: 'Arial, sans-serif', headingFont: 'Arial, sans-serif', fontSize: { small: '14px', medium: '16px', large: '20px', xlarge: '28px' } },
        spacing: { small: '8px', medium: '16px', large: '24px', xlarge: '48px' },
        breakpoints: { mobile: '768px', tablet: '1024px', desktop: '1200px' }
      });

      const componentMap = mapper.parseHTMLStructure(sourceCode);
      const designTokens = mapper.extractDesignTokens(sourceCode);

      // Load change history
      const { data: chatHistory } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      const projectMemory: ProjectMemoryState = {
        projectId,
        componentMap,
        designTokens,
        fileStructure: {
          'index.html': extractHTML(sourceCode),
          'style.css': extractCSS(sourceCode),
          'script.js': extractJS(sourceCode),
          'design.json': JSON.stringify(designTokens, null, 2),
          'componentMap.json': JSON.stringify(componentMap, null, 2)
        },
        changeHistory: (chatHistory || []).map(msg => ({
          timestamp: new Date(msg.created_at),
          component: msg.metadata?.component || 'unknown',
          change: msg.content,
          beforeCode: msg.metadata?.beforeCode || '',
          afterCode: msg.metadata?.afterCode || ''
        })),
        preservationRules: [
          '🚫 NEVER modify unrelated components',
          '🚫 NEVER change overall layout structure',
          '🚫 NEVER alter design token system',
          '🚫 NEVER remove YouTube integration',
          '✅ ONLY modify requested component',
          '✅ PRESERVE existing design consistency',
          '✅ MAINTAIN responsive breakpoints'
        ]
      };

      setMemory(projectMemory);
      console.log('✅ Advanced project memory loaded with', Object.keys(componentMap).length, 'components');

    } catch (error) {
      console.error('❌ Error loading project memory:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const saveChange = useCallback(async (
    component: string,
    change: string,
    beforeCode: string,
    afterCode: string
  ) => {
    if (!memory) return;

    try {
      // Save change to database
      await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message_type: 'component_edit',
          content: change,
          metadata: {
            component,
            beforeCode,
            afterCode,
            timestamp: new Date().toISOString()
          }
        });

      // Update local memory
      setMemory(prev => prev ? {
        ...prev,
        changeHistory: [...prev.changeHistory, {
          timestamp: new Date(),
          component,
          change,
          beforeCode,
          afterCode
        }]
      } : null);

    } catch (error) {
      console.error('❌ Error saving change:', error);
    }
  }, [memory, projectId]);

  const generateContextualPrompt = useCallback((
    userRequest: string,
    currentCode: string
  ): string => {
    if (!memory) return '';

    const mapper = new ComponentMapper(memory.designTokens);
    const targetComponent = mapper.identifyTargetComponent(userRequest);
    
    if (!targetComponent) {
      return `Unable to identify target component from request: "${userRequest}"`;
    }

    const recentChanges = memory.changeHistory
      .slice(-5)
      .map(change => `- ${change.component}: ${change.change}`)
      .join('\n');

    return `
# 🎯 ADVANCED COMPONENT-LEVEL EDITING

## PROJECT MEMORY CONTEXT
- Project ID: ${memory.projectId}
- Total Components: ${Object.keys(memory.componentMap).length}
- Recent Changes: 
${recentChanges}

## USER REQUEST
"${userRequest}"

## TARGET COMPONENT IDENTIFIED
Component: ${targetComponent}
Type: ${memory.componentMap[targetComponent]?.type || 'unknown'}
Selector: ${memory.componentMap[targetComponent]?.selector || 'unknown'}

## CURRENT FILE STRUCTURE
- index.html: ${memory.fileStructure['index.html'].length} chars
- style.css: ${memory.fileStructure['style.css'].length} chars  
- script.js: ${memory.fileStructure['script.js'].length} chars

## DESIGN TOKENS TO PRESERVE
\`\`\`json
${memory.fileStructure['design.json']}
\`\`\`

## COMPONENT MAP
\`\`\`json
${memory.fileStructure['componentMap.json']}
\`\`\`

## PRESERVATION RULES
${memory.preservationRules.map(rule => rule).join('\n')}

## CURRENT COMPONENT CODE
\`\`\`html
${extractComponentCode(currentCode, memory.componentMap[targetComponent])}
\`\`\`

## CRITICAL INSTRUCTIONS
1. **MODIFY ONLY** the ${targetComponent} component
2. **PRESERVE ALL** other components exactly as they are
3. **USE EXISTING** design tokens and CSS classes
4. **MAINTAIN** file structure and organization
5. **KEEP** all JavaScript functionality intact

Generate the complete modified code with ONLY the requested component changed.
Use existing design patterns and maintain consistency.
`;
  }, [memory]);

  useEffect(() => {
    loadProjectMemory();
  }, [loadProjectMemory]);

  return {
    memory,
    loading,
    generateContextualPrompt,
    saveChange,
    refreshMemory: loadProjectMemory
  };
};

// Helper functions
const extractHTML = (sourceCode: string): string => {
  return sourceCode;
};

const extractCSS = (sourceCode: string): string => {
  const cssMatch = sourceCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
  return cssMatch ? cssMatch[1] : '';
};

const extractJS = (sourceCode: string): string => {
  const jsMatch = sourceCode.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  return jsMatch ? jsMatch[1] : '';
};

const extractComponentCode = (html: string, component: any): string => {
  if (!component?.selector) return 'Component not found';
  
  const selector = component.selector;
  let regex: RegExp;
  
  if (selector.startsWith('#')) {
    regex = new RegExp(`<[^>]*id\\s*=\\s*["']${selector.slice(1)}["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
  } else if (selector.startsWith('.')) {
    const className = selector.slice(1);
    regex = new RegExp(`<[^>]*class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
  } else {
    regex = new RegExp(`<${selector}[^>]*>[\\s\\S]*?</${selector}>`, 'i');
  }
  
  const match = html.match(regex);
  return match ? match[0] : 'Component not found';
};
