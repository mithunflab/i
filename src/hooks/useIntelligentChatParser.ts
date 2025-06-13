
import { useState, useCallback } from 'react';

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

export const useIntelligentChatParser = (projectId: string) => {
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});

  const parseUserChat = useCallback(async (
    userInput: string,
    sourceCode: string,
    channelData: any
  ): Promise<ParseResult> => {
    try {
      // Simple intent parsing logic
      const lowerInput = userInput.toLowerCase();
      
      // Determine target component
      let targetComponent = 'general';
      if (lowerInput.includes('button')) targetComponent = 'button';
      else if (lowerInput.includes('header')) targetComponent = 'header';
      else if (lowerInput.includes('title')) targetComponent = 'title';
      else if (lowerInput.includes('navigation') || lowerInput.includes('nav')) targetComponent = 'navigation';
      else if (lowerInput.includes('footer')) targetComponent = 'footer';
      
      // Determine action
      let action = 'modify';
      if (lowerInput.includes('change') || lowerInput.includes('update')) action = 'update';
      else if (lowerInput.includes('add') || lowerInput.includes('create')) action = 'add';
      else if (lowerInput.includes('remove') || lowerInput.includes('delete')) action = 'remove';
      else if (lowerInput.includes('style') || lowerInput.includes('color')) action = 'style';
      
      // Generate changes description
      const changes = `Applied ${action} to ${targetComponent} based on: "${userInput}"`;
      
      // Create targeted prompt
      const prompt = `Update the ${targetComponent} component by ${action}: ${userInput}. Maintain existing functionality and design consistency.`;
      
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
          'Be more specific about the component you want to change',
          'Mention the specific action you want (change, update, add, remove)',
          'Include details about what exactly you want modified'
        ],
        parseResult: 'error'
      };
    }
  }, []);

  const validateAndApplyEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    targetComponent: string,
    userRequest: string
  ): boolean => {
    // Simple validation - check if code is different and valid
    if (originalCode === modifiedCode) {
      console.warn('No changes detected in code');
      return false;
    }
    
    // Basic syntax validation
    if (!modifiedCode.includes('export') || modifiedCode.length < 50) {
      console.error('Modified code appears invalid');
      return false;
    }
    
    return true;
  }, []);

  const getChatHistory = useCallback(() => {
    return chatHistory;
  }, [chatHistory]);

  const initializeProjectFiles = useCallback((sourceCode: string) => {
    try {
      setProjectFiles({ 'main.tsx': sourceCode });
    } catch (error) {
      console.error('Error initializing project files:', error);
    }
  }, []);

  return {
    parseUserChat,
    validateAndApplyEdit,
    getChatHistory,
    initializeProjectFiles
  };
};
