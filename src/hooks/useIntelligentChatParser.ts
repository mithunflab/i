
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ParseResult {
  success: boolean;
  error?: string;
  suggestions?: string[];
  targetComponent?: string;
  action?: string;
  changes?: string;
  prompt?: string;
  parseResult?: 'success' | 'failed' | 'error';
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    component?: string;
    parseResult?: 'success' | 'failed' | 'error';
  };
}

interface ComponentMapping {
  [key: string]: {
    selector: string;
    type: string;
    file: string;
  };
}

export const useIntelligentChatParser = (projectId: string) => {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const [componentMap, setComponentMap] = useState<ComponentMapping>({});

  const parseUserChat = useCallback(async (
    userInput: string,
    sourceCode: string,
    channelData: any
  ): Promise<ParseResult> => {
    try {
      const lowerInput = userInput.toLowerCase();
      
      // Initialize component map from source code
      const parsedComponents = parseHTMLForComponents(sourceCode);
      setComponentMap(parsedComponents);
      
      // Determine target component with improved accuracy
      let targetComponent = identifyTargetComponent(lowerInput, parsedComponents);
      
      if (!targetComponent) {
        return {
          success: false,
          error: 'Could not identify target component',
          suggestions: [
            'Try being more specific: "change the header background color"',
            'Mention specific elements: "make the subscribe button bigger"',
            'Use component names: "update the hero section title"'
          ],
          parseResult: 'failed'
        };
      }
      
      // Determine action type
      let action = determineAction(lowerInput);
      
      // Generate enhanced prompt for AI
      const prompt = generateEnhancedPrompt(userInput, targetComponent, sourceCode, channelData, parsedComponents);
      
      // Create change description
      const changes = `Target: ${targetComponent} | Action: ${action} | Request: "${userInput}"`;
      
      return {
        success: true,
        targetComponent,
        action,
        changes,
        prompt,
        parseResult: 'success'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
        suggestions: [
          'Check your internet connection',
          'Try a simpler request',
          'Be more specific about what you want to change'
        ],
        parseResult: 'error'
      };
    }
  }, []);

  const parseHTMLForComponents = (htmlContent: string): ComponentMapping => {
    const components: ComponentMapping = {};
    
    // Extract components with IDs
    const idMatches = htmlContent.match(/<[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/g) || [];
    idMatches.forEach(match => {
      const idMatch = match.match(/id\s*=\s*["']([^"']+)["']/);
      if (idMatch) {
        const id = idMatch[1];
        const tagMatch = match.match(/<(\w+)/);
        const tag = tagMatch ? tagMatch[1] : 'div';
        
        components[id] = {
          selector: `#${id}`,
          type: determineComponentType(id, tag),
          file: 'index.html'
        };
      }
    });
    
    // Extract semantic components
    const semanticComponents = [
      { pattern: /<header[^>]*>/gi, type: 'header', name: 'main-header' },
      { pattern: /<nav[^>]*>/gi, type: 'navigation', name: 'main-nav' },
      { pattern: /<footer[^>]*>/gi, type: 'footer', name: 'main-footer' },
      { pattern: /<button[^>]*>/gi, type: 'button', name: 'button' },
      { pattern: /class\s*=\s*["'][^"']*hero[^"']*["']/gi, type: 'hero', name: 'hero-section' },
      { pattern: /class\s*=\s*["'][^"']*video[^"']*["']/gi, type: 'video', name: 'video-section' }
    ];
    
    semanticComponents.forEach(({ pattern, type, name }) => {
      const matches = htmlContent.match(pattern);
      if (matches && matches.length > 0) {
        components[name] = {
          selector: type === 'button' ? 'button' : type,
          type,
          file: 'index.html'
        };
      }
    });
    
    return components;
  };

  const identifyTargetComponent = (input: string, components: ComponentMapping): string | null => {
    const componentKeywords = {
      'header': ['header', 'top', 'navigation bar', 'navbar', 'logo area', 'title bar'],
      'hero-section': ['hero', 'main title', 'banner', 'hero section', 'welcome', 'intro'],
      'button': ['button', 'subscribe', 'cta', 'call to action', 'click here'],
      'video-section': ['video', 'gallery', 'video section', 'thumbnails', 'content'],
      'main-nav': ['nav', 'menu', 'navigation', 'links'],
      'main-footer': ['footer', 'bottom', 'contact', 'social links']
    };
    
    // Check for exact component mentions
    for (const [componentId] of Object.entries(components)) {
      if (input.includes(componentId.toLowerCase())) {
        return componentId;
      }
    }
    
    // Check for keyword matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [componentId, keywords] of Object.entries(componentKeywords)) {
      if (components[componentId]) {
        const matches = keywords.filter(keyword => input.includes(keyword));
        const score = matches.length / keywords.length;
        
        if (score > bestScore && score > 0) {
          bestScore = score;
          bestMatch = componentId;
        }
      }
    }
    
    return bestMatch;
  };

  const determineComponentType = (id: string, tag: string): string => {
    const lowerIdTag = (id + tag).toLowerCase();
    
    if (lowerIdTag.includes('header')) return 'header';
    if (lowerIdTag.includes('hero') || lowerIdTag.includes('banner')) return 'hero';
    if (lowerIdTag.includes('nav')) return 'navigation';
    if (lowerIdTag.includes('footer')) return 'footer';
    if (lowerIdTag.includes('btn') || lowerIdTag.includes('button')) return 'button';
    if (lowerIdTag.includes('video')) return 'video';
    
    return 'content';
  };

  const determineAction = (input: string): string => {
    if (input.includes('change') || input.includes('update') || input.includes('modify')) {
      return 'update';
    }
    if (input.includes('add') || input.includes('create') || input.includes('insert')) {
      return 'add';
    }
    if (input.includes('remove') || input.includes('delete') || input.includes('hide')) {
      return 'remove';
    }
    if (input.includes('color') || input.includes('style') || input.includes('background')) {
      return 'style';
    }
    
    return 'modify';
  };

  const generateEnhancedPrompt = (
    userRequest: string,
    targetComponent: string,
    sourceCode: string,
    channelData: any,
    components: ComponentMapping
  ): string => {
    const component = components[targetComponent];
    
    return `
# 🎯 SMART COMPONENT EDITING REQUEST

## USER REQUEST
"${userRequest}"

## TARGET COMPONENT ANALYSIS
- **Component ID**: ${targetComponent}
- **Selector**: ${component?.selector || 'unknown'}
- **Type**: ${component?.type || 'unknown'}
- **File**: ${component?.file || 'index.html'}

## CHANNEL CONTEXT
- **Channel**: ${channelData?.title || 'Unknown'}
- **Subscribers**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Content Type**: ${channelData?.description?.substring(0, 100) || 'General content'}

## COMPONENT MAP
\`\`\`json
${JSON.stringify(components, null, 2)}
\`\`\`

## EDITING RULES
1. **PRECISION**: Edit ONLY the ${targetComponent} component
2. **PRESERVATION**: Keep all other components exactly the same
3. **CONSISTENCY**: Use existing design patterns and colors
4. **VALIDATION**: Ensure changes don't break layout or functionality

## CURRENT CODE CONTEXT
\`\`\`html
${sourceCode.substring(0, 1500)}${sourceCode.length > 1500 ? '...' : ''}
\`\`\`

## OUTPUT REQUIREMENTS
- Return complete modified HTML with ONLY the requested component changed
- Use comments to mark unchanged sections: <!-- ... existing code ... -->
- Maintain responsive design and accessibility
- Preserve all JavaScript functionality

**CRITICAL**: This is a targeted edit. Change ONLY what was specifically requested.
`;
  };

  const validateAndApplyEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    targetComponent: string,
    userRequest: string
  ): boolean => {
    try {
      // Basic validation checks
      if (originalCode === modifiedCode) {
        console.warn('⚠️ No changes detected in code');
        return false;
      }
      
      // Check if code is valid HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(modifiedCode, 'text/html');
      const parserErrors = doc.querySelector('parsererror');
      
      if (parserErrors) {
        console.error('❌ Invalid HTML structure');
        return false;
      }
      
      // Check if target component still exists
      const targetExists = modifiedCode.includes(targetComponent) || 
                          modifiedCode.includes(`id="${targetComponent}"`) ||
                          modifiedCode.includes(`class="${targetComponent}"`);
      
      if (!targetExists) {
        console.error('❌ Target component was removed during edit');
        return false;
      }
      
      // Save successful edit to history
      saveChatEntry('assistant', `Successfully applied changes to ${targetComponent}`, {
        component: targetComponent,
        parseResult: 'success'
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error validating edit:', error);
      return false;
    }
  }, []);

  const getChatHistory = useCallback(() => {
    return chatHistory;
  }, [chatHistory]);

  const initializeProjectFiles = useCallback((sourceCode: string) => {
    try {
      // Initialize project files structure
      const files = {
        'index.html': sourceCode,
        'componentMap.json': JSON.stringify(componentMap, null, 2),
        'design.json': JSON.stringify(extractDesignTokens(sourceCode), null, 2),
        'changelog.md': '# Project Changelog\n\nThis file tracks all AI edits made to the project.\n'
      };
      
      setProjectFiles(files);
      
      // Load existing chat history from database
      loadChatHistoryFromDB();
      
      console.log('✅ Project files initialized');
    } catch (error) {
      console.error('❌ Error initializing project files:', error);
    }
  }, [componentMap]);

  const extractDesignTokens = (sourceCode: string) => {
    const tokens = {
      colors: {
        primary: '#ff0000',
        secondary: '#666666',
        background: '#ffffff',
        text: '#333333'
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          small: '14px',
          medium: '16px',
          large: '20px'
        }
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px'
      }
    };
    
    // Extract CSS custom properties if they exist
    const styleMatch = sourceCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (styleMatch) {
      const css = styleMatch[1];
      const colorMatches = css.match(/--[\w-]*color[\w-]*:\s*([^;]+)/g) || [];
      
      colorMatches.forEach((match, index) => {
        const value = match.split(':')[1].trim();
        if (index === 0) tokens.colors.primary = value;
        if (index === 1) tokens.colors.secondary = value;
      });
    }
    
    return tokens;
  };

  const loadChatHistoryFromDB = async () => {
    try {
      const { data: history } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (history) {
        const chatEntries: ChatEntry[] = history.map(entry => ({
          id: entry.id,
          role: entry.message_type as 'user' | 'assistant',
          content: entry.content,
          timestamp: new Date(entry.created_at),
          metadata: entry.metadata as any
        }));
        
        setChatHistory(chatEntries);
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
    }
  };

  const saveChatEntry = async (role: 'user' | 'assistant', content: string, metadata?: any) => {
    const entry: ChatEntry = {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date(),
      metadata
    };
    
    setChatHistory(prev => [...prev, entry]);
    
    // Save to database with user_id
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('project_chat_history')
          .insert({
            project_id: projectId,
            user_id: user.id,
            message_type: role,
            content,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
          });
      }
    } catch (error) {
      console.error('❌ Error saving chat entry:', error);
    }
  };

  return {
    parseUserChat,
    validateAndApplyEdit,
    getChatHistory,
    initializeProjectFiles,
    componentMap,
    projectFiles
  };
};
