
import { useState, useCallback } from 'react';
import { intentParser } from '@/utils/intentParser';
import { aiEditor } from '@/utils/aiEditor';
import { projectFileManager } from '@/utils/projectFiles';

interface ParsedIntent {
  success: boolean;
  targetComponent?: string;
  action?: string;
  changes?: string;
  prompt?: string;
  error?: string;
  suggestions?: string[];
  parseResult?: 'success' | 'failed' | 'error';
}

export const useIntelligentChatParser = (projectId: string) => {
  const [loading, setLoading] = useState(false);
  const fileManager = projectFileManager(projectId);

  const parseUserChat = useCallback(async (
    userInput: string,
    currentCode: string,
    channelData?: any
  ): Promise<ParsedIntent> => {
    setLoading(true);

    try {
      // Load or create component map
      let componentMap = {};
      const componentMapFile = fileManager.getFile('componentMap.json');
      if (componentMapFile) {
        componentMap = JSON.parse(componentMapFile.content);
      } else {
        componentMap = fileManager.createComponentMap(currentCode);
      }

      // Load or create design tokens
      let designTokens = {};
      const designFile = fileManager.getFile('design.json');
      if (designFile) {
        designTokens = JSON.parse(designFile.content);
      } else {
        const cssContent = extractCSS(currentCode);
        designTokens = fileManager.extractDesignTokens(cssContent);
      }

      // Parse user intent
      const parseResult = intentParser.parseUserRequest(userInput, componentMap, designTokens);

      if (!parseResult.success) {
        // Save failed parse attempt
        fileManager.saveChatMessage('user', userInput, { 
          parseResult: 'failed',
          error: parseResult.error 
        });

        return {
          success: false,
          error: parseResult.error,
          suggestions: parseResult.suggestions,
          parseResult: 'failed'
        };
      }

      const intent = parseResult.intent!;

      // Generate enhanced prompt for AI
      const enhancedPrompt = intentParser.generateTargetedPrompt(
        intent,
        channelData,
        currentCode
      );

      // Save successful parse
      fileManager.saveChatMessage('user', userInput, {
        parseResult: 'success',
        targetComponent: intent.targetComponentId,
        action: intent.action,
        confidence: intent.confidence
      });

      // Log the intended change
      fileManager.logChange(
        intent.targetComponentId,
        intent.action,
        `User requested: ${userInput}`
      );

      return {
        success: true,
        targetComponent: intent.targetComponentId,
        action: intent.action,
        changes: JSON.stringify(intent.updates),
        prompt: enhancedPrompt,
        parseResult: 'success'
      };

    } catch (error) {
      console.error('Chat parsing error:', error);
      
      fileManager.saveChatMessage('user', userInput, {
        parseResult: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        error: 'Failed to parse your request. Please try being more specific.',
        suggestions: [
          'Mention the specific component you want to change',
          'Describe the exact change you want to make',
          'Example: "Change the subscribe button color to red"'
        ],
        parseResult: 'error'
      };
    } finally {
      setLoading(false);
    }
  }, [projectId, fileManager]);

  const validateAndApplyEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    componentId: string,
    userRequest: string
  ): boolean => {
    // Validate the edit
    const isValid = aiEditor.validateEdit(originalCode, modifiedCode);
    
    if (isValid) {
      // Log successful change
      fileManager.logChange(
        componentId,
        'AI Edit Applied',
        `Successfully modified based on: ${userRequest}`
      );

      // Save AI response
      fileManager.saveChatMessage('assistant', 'Changes applied successfully', {
        componentId,
        userRequest,
        validated: true
      });
    } else {
      // Log validation failure
      fileManager.saveChatMessage('assistant', 'Edit validation failed', {
        componentId,
        userRequest,
        validated: false
      });
    }

    return isValid;
  }, [fileManager]);

  const getChatHistory = useCallback(() => {
    return fileManager.loadChatHistory();
  }, [fileManager]);

  const getProjectFiles = useCallback(() => {
    return fileManager.getAllFiles();
  }, [fileManager]);

  const initializeProjectFiles = useCallback((
    htmlContent: string,
    cssContent: string = '',
    jsContent: string = ''
  ) => {
    fileManager.initializeProject(htmlContent, cssContent, jsContent);
  }, [fileManager]);

  return {
    parseUserChat,
    validateAndApplyEdit,
    getChatHistory,
    getProjectFiles,
    initializeProjectFiles,
    loading
  };
};

// Helper function to extract CSS from HTML
function extractCSS(html: string): string {
  const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
  return styleMatches
    .map(match => match.replace(/<\/?style[^>]*>/gi, ''))
    .join('\n');
}
