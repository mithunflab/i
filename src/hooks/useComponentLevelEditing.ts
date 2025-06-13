
import { useCallback, useState } from 'react';
import { ComponentMapper, DesignTokens } from '../utils/componentMapper';

interface EditingContext {
  projectId: string;
  currentCode: string;
  channelData: any;
}

interface ComponentEditResult {
  success: boolean;
  modifiedCode?: string;
  targetComponent?: string;
  preservationRules?: string[];
  error?: string;
}

export const useComponentLevelEditing = () => {
  const [mapper, setMapper] = useState<ComponentMapper | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initializeMapper = useCallback((code: string) => {
    try {
      // Extract CSS to get design tokens
      const cssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      const css = cssMatch ? cssMatch[1] : '';
      
      // Create mapper with design context
      const newMapper = new ComponentMapper({
        colors: {
          primary: '#ff0000',
          secondary: '#666666',
          background: '#ffffff',
          text: '#333333',
          accent: '#0066cc'
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          headingFont: 'Arial, sans-serif',
          fontSize: {
            small: '14px',
            medium: '16px',
            large: '20px',
            xlarge: '28px'
          }
        },
        spacing: {
          small: '8px',
          medium: '16px',
          large: '24px',
          xlarge: '48px'
        },
        breakpoints: {
          mobile: '768px',
          tablet: '1024px',
          desktop: '1200px'
        }
      });

      // Parse HTML structure to build component map
      newMapper.parseHTMLStructure(code);
      setMapper(newMapper);
      
      console.log('🗺️ Component mapper initialized with', Object.keys(newMapper['componentMap']).length, 'components');
      return newMapper;
    } catch (error) {
      console.error('❌ Error initializing component mapper:', error);
      return null;
    }
  }, []);

  const generateComponentEditPrompt = useCallback((
    userRequest: string,
    context: EditingContext
  ): ComponentEditResult => {
    try {
      setIsProcessing(true);
      
      // Initialize mapper if not exists
      const currentMapper = mapper || initializeMapper(context.currentCode);
      if (!currentMapper) {
        return {
          success: false,
          error: 'Failed to initialize component mapper'
        };
      }

      // Identify target component
      const targetComponent = currentMapper.identifyTargetComponent(userRequest);
      if (!targetComponent) {
        return {
          success: false,
          error: 'Could not identify target component from request'
        };
      }

      // Generate targeted instructions
      const instructions = currentMapper.generateTargetedInstructions(
        userRequest,
        targetComponent,
        context.currentCode
      );

      // Get preservation rules
      const preservationRules = currentMapper.getPreservationRules(targetComponent);

      console.log('🎯 Generated component-level edit instructions for:', targetComponent);

      return {
        success: true,
        targetComponent,
        preservationRules,
        modifiedCode: instructions // This will be used as the prompt
      };

    } catch (error) {
      console.error('❌ Error generating component edit prompt:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [mapper, initializeMapper]);

  const parseUserIntent = useCallback((userRequest: string) => {
    const intent = {
      action: 'modify',
      target: 'unknown',
      property: 'content',
      value: ''
    };

    const request = userRequest.toLowerCase();

    // Identify action
    if (request.includes('change') || request.includes('update') || request.includes('modify')) {
      intent.action = 'modify';
    } else if (request.includes('add') || request.includes('create')) {
      intent.action = 'add';
    } else if (request.includes('remove') || request.includes('delete')) {
      intent.action = 'remove';
    }

    // Identify target
    if (request.includes('button')) intent.target = 'button';
    else if (request.includes('header') || request.includes('title')) intent.target = 'header';
    else if (request.includes('video')) intent.target = 'video';
    else if (request.includes('footer')) intent.target = 'footer';
    else if (request.includes('nav')) intent.target = 'navigation';

    // Identify property
    if (request.includes('text') || request.includes('content')) intent.property = 'text';
    else if (request.includes('color') || request.includes('background')) intent.property = 'style';
    else if (request.includes('size') || request.includes('font')) intent.property = 'typography';

    // Extract value
    const valueMatch = request.match(/["']([^"']+)["']/) || request.match(/to\s+(.+?)(?:\s|$)/);
    if (valueMatch) {
      intent.value = valueMatch[1];
    }

    return intent;
  }, []);

  const validateEdit = useCallback((
    originalCode: string,
    modifiedCode: string,
    targetComponent: string
  ): boolean => {
    try {
      // Basic validation checks
      const originalComponents = (originalCode.match(/<[^>]+id\s*=/g) || []).length;
      const modifiedComponents = (modifiedCode.match(/<[^>]+id\s*=/g) || []).length;
      
      // Should not have drastically different component count
      if (Math.abs(originalComponents - modifiedComponents) > 2) {
        console.warn('⚠️ Component count changed significantly');
        return false;
      }

      // Check if basic HTML structure is preserved
      const htmlTags = ['html', 'head', 'body', 'header', 'footer'];
      for (const tag of htmlTags) {
        const originalCount = (originalCode.match(new RegExp(`<${tag}`, 'g')) || []).length;
        const modifiedCount = (modifiedCode.match(new RegExp(`<${tag}`, 'g')) || []).length;
        
        if (originalCount !== modifiedCount) {
          console.warn(`⚠️ ${tag} tag count changed`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating edit:', error);
      return false;
    }
  }, []);

  return {
    generateComponentEditPrompt,
    parseUserIntent,
    validateEdit,
    isProcessing,
    initializeMapper
  };
};
