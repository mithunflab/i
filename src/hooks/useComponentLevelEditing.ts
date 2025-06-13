
import { useCallback } from 'react';
import { aiEditor } from '@/utils/aiEditor';

interface ComponentEditResult {
  success: boolean;
  targetComponent: string;
  preservationRules: string[];
  prompt?: string;
  error?: string;
}

interface EditContext {
  projectId: string;
  currentCode: string;
  channelData?: any;
}

export const useComponentLevelEditing = () => {
  const parseUserIntent = useCallback((userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Identify action type
    let action = 'modify';
    if (input.includes('add') || input.includes('create')) action = 'add';
    if (input.includes('remove') || input.includes('delete')) action = 'remove';
    if (input.includes('change') || input.includes('update')) action = 'modify';

    // Identify target component
    let targetComponent = 'unknown';
    if (input.includes('button') || input.includes('subscribe')) targetComponent = 'subscribe-button';
    if (input.includes('header') || input.includes('top')) targetComponent = 'header';
    if (input.includes('hero') || input.includes('title')) targetComponent = 'hero-section';
    if (input.includes('video') || input.includes('thumbnail')) targetComponent = 'video-gallery';
    if (input.includes('footer') || input.includes('bottom')) targetComponent = 'footer';

    // Identify properties to change
    const properties = [];
    if (input.includes('color') || input.includes('background')) properties.push('color');
    if (input.includes('size') || input.includes('bigger') || input.includes('smaller')) properties.push('size');
    if (input.includes('text') || input.includes('content')) properties.push('content');
    if (input.includes('animation') || input.includes('effect')) properties.push('animation');

    return {
      action,
      targetComponent,
      properties,
      confidence: targetComponent !== 'unknown' ? 'high' : 'low'
    };
  }, []);

  const generateComponentEditPrompt = useCallback((
    userRequest: string,
    context: EditContext
  ): ComponentEditResult => {
    const intent = parseUserIntent(userRequest);
    
    if (intent.confidence === 'low') {
      return {
        success: false,
        targetComponent: 'unknown',
        preservationRules: [],
        error: 'Could not identify specific component to edit. Please be more specific.'
      };
    }

    const preservationRules = [
      '• Preserve all other HTML elements exactly as they are',
      '• Maintain existing CSS classes and IDs for other components', 
      '• Keep YouTube integration and real data intact',
      '• Preserve responsive design breakpoints',
      '• Maintain accessibility attributes',
      '• Keep existing JavaScript functionality',
      `• Only modify the ${intent.targetComponent} component`
    ];

    return {
      success: true,
      targetComponent: intent.targetComponent,
      preservationRules,
      prompt: `Make targeted changes to ${intent.targetComponent} based on: "${userRequest}"`
    };
  }, [parseUserIntent]);

  const validateEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    targetComponent: string,
    userRequest: string
  ): boolean => {
    try {
      // Use the AI editor to validate
      return aiEditor.validateEdit(originalCode, modifiedCode);
    } catch (error) {
      console.error('Edit validation failed:', error);
      return false;
    }
  }, []);

  return {
    parseUserIntent,
    generateComponentEditPrompt,
    validateEdit
  };
};
