
import { useState, useCallback, useEffect } from 'react';
import { SmartProjectManager, type ChatHistoryEntry, type ComponentMapEntry } from '@/utils/smartProjectManager';

interface ParseResult {
  success: boolean;
  targetComponent?: string;
  action?: string;
  changes?: string;
  prompt?: string;
  error?: string;
  suggestions?: string[];
}

export const useIntelligentChatParser = (projectId: string) => {
  const [projectManager] = useState(() => new SmartProjectManager(projectId));
  const [componentMap, setComponentMap] = useState<Record<string, ComponentMapEntry>>({});
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  const parseUserChat = useCallback(async (
    userInput: string,
    currentCode: string,
    channelData?: any
  ): Promise<ParseResult> => {
    try {
      console.log('🧠 Parsing user intent:', userInput);

      // Update project manager with latest code
      if (currentCode) {
        projectManager.updateFile('index.html', currentCode);
        projectManager.parseAndMapComponents(currentCode);
      }

      // Identify target component
      const targetComponent = projectManager.identifyTargetComponent(userInput);
      
      if (!targetComponent) {
        return {
          success: false,
          error: 'Could not identify which component to modify',
          suggestions: [
            'Try being more specific: "Change the subscribe button color"',
            'Mention specific elements: "Update the hero title"',
            'Use component names: "Modify the header background"'
          ]
        };
      }

      // Determine action type
      const input = userInput.toLowerCase();
      let action = 'modify';
      if (input.includes('add') || input.includes('create')) action = 'add';
      if (input.includes('remove') || input.includes('delete')) action = 'remove';
      if (input.includes('change') || input.includes('update')) action = 'modify';

      // Generate changes description
      const changes = generateChangesDescription(userInput, targetComponent);

      // Create enhanced prompt
      const prompt = generateEnhancedPrompt(userInput, targetComponent, currentCode, channelData);

      console.log('✅ Successfully parsed user intent:', { targetComponent, action, changes });

      return {
        success: true,
        targetComponent,
        action,
        changes,
        prompt
      };

    } catch (error) {
      console.error('❌ Error parsing user intent:', error);
      return {
        success: false,
        error: 'Failed to parse user request',
        suggestions: ['Please try rephrasing your request', 'Be more specific about what you want to change']
      };
    }
  }, [projectManager]);

  const generateChangesDescription = (userInput: string, targetComponent: string): string => {
    const input = userInput.toLowerCase();
    const changes = [];

    if (input.includes('color')) changes.push('color modification');
    if (input.includes('size') || input.includes('bigger') || input.includes('smaller')) changes.push('size adjustment');
    if (input.includes('text') || input.includes('content')) changes.push('content update');
    if (input.includes('animation')) changes.push('animation effects');
    if (input.includes('background')) changes.push('background styling');

    return changes.length > 0 ? changes.join(', ') : 'visual styling';
  };

  const generateEnhancedPrompt = (
    userInput: string,
    targetComponent: string,
    currentCode: string,
    channelData?: any
  ): string => {
    return `
# 🎯 INTELLIGENT COMPONENT-LEVEL EDITING

## TARGET IDENTIFICATION
**Component**: ${targetComponent}
**User Request**: "${userInput}"

## SMART EDITING RULES
1. **PRECISION TARGETING** - Modify ONLY the ${targetComponent} component
2. **PRESERVE EVERYTHING ELSE** - Keep all other elements unchanged
3. **MAINTAIN YOUTUBE INTEGRATION** - Preserve real channel data
4. **FOLLOW DESIGN SYSTEM** - Use consistent styling patterns

## COMPONENT CONTEXT
${channelData ? `
**Channel**: ${channelData.title}
**Branding**: YouTube red (#ff0000), cyan accents (#00cfff)
**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
` : ''}

## CURRENT CODE STRUCTURE
\`\`\`html
${currentCode.substring(0, 1200)}...
\`\`\`

## MODIFICATION INSTRUCTIONS
- Apply the requested change to ${targetComponent} only
- Preserve all existing functionality and styling for other components
- Maintain responsive design and accessibility
- Use inline styles or existing CSS classes
- Keep YouTube integration intact

**Generate code that makes ONLY the requested change to ${targetComponent} while preserving everything else.**
`;
  };

  const validateAndApplyEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    targetComponent: string,
    userRequest: string
  ): boolean => {
    try {
      // Log the change
      projectManager.logChange(targetComponent, 'Smart Edit', userRequest, 'Component-level modification applied');
      
      // Update project files
      projectManager.updateFile('index.html', modifiedCode);
      projectManager.parseAndMapComponents(modifiedCode);
      
      return true;
    } catch (error) {
      console.error('❌ Edit validation failed:', error);
      return false;
    }
  }, [projectManager]);

  const getChatHistory = useCallback((): ChatHistoryEntry[] => {
    return projectManager.getChatHistory();
  }, [projectManager]);

  const initializeProjectFiles = useCallback((htmlContent: string) => {
    projectManager.updateFile('index.html', htmlContent);
    projectManager.parseAndMapComponents(htmlContent);
    projectManager.extractDesignTokens(htmlContent);
    
    // Update state
    const files = projectManager.exportProject();
    setProjectFiles(files);
    
    const components = Object.fromEntries(projectManager['componentMap']);
    setComponentMap(components);
  }, [projectManager]);

  return {
    parseUserChat,
    validateAndApplyEdit,
    getChatHistory,
    initializeProjectFiles,
    componentMap,
    projectFiles,
    projectManager
  };
};
