
import { useCallback } from 'react';

export const useTargetedChanges = () => {
  const generateTargetedPrompt = useCallback((
    userRequest: string,
    currentCode: string,
    projectContext: any,
    channelData: any
  ) => {
    return `
TARGETED WEBSITE MODIFICATION REQUEST:

USER REQUEST: "${userRequest}"

CURRENT CONTEXT:
- Channel: ${channelData?.title || 'Unknown'}
- Current Layout: ${projectContext?.currentStructure?.layout || 'modern'}
- Design Principles: ${projectContext?.designPrinciples?.join(', ') || 'responsive, clean'}

INSTRUCTIONS:
1. Make ONLY the specific changes requested by the user
2. Preserve all existing functionality and design elements
3. Maintain responsive design and YouTube branding
4. Use modern HTML5, CSS3, and JavaScript
5. Keep the current color scheme and layout structure
6. Ensure mobile compatibility

CURRENT CODE TO MODIFY:
${currentCode ? currentCode.substring(0, 2000) + '...' : 'No existing code'}

Generate a complete, updated HTML file with the requested changes implemented while preserving everything else.
    `;
  }, []);

  return {
    generateTargetedPrompt
  };
};
