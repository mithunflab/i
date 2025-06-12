
import { useCallback } from 'react';

interface ComponentChange {
  selector: string;
  changeType: 'style' | 'content' | 'structure';
  description: string;
  preserveElements: string[];
}

export const useTargetedChanges = () => {
  const generateTargetedPrompt = useCallback((
    userRequest: string,
    currentCode: string,
    projectContext: any,
    channelData: any
  ) => {
    // Analyze the user request to identify target component
    const targetComponent = identifyTargetComponent(userRequest);
    
    // Extract current component structure
    const componentStructure = extractComponentStructure(currentCode, targetComponent);
    
    // Generate targeted modification prompt
    const targetedPrompt = `
# TARGETED MODIFICATION REQUEST

## Context
- Project: ${projectContext?.name || 'YouTube Channel Website'}
- Channel: ${channelData?.title || 'Content Creator'}
- Target Component: ${targetComponent}
- Modification Type: ${identifyModificationType(userRequest)}

## Current Component Structure
${componentStructure}

## Design Principles to Maintain
${projectContext?.designPrinciples?.join('\n- ') || '- Professional and clean design\n- YouTube branding consistency\n- Mobile responsiveness'}

## User Request
${userRequest}

## CRITICAL INSTRUCTIONS
1. **ONLY MODIFY THE TARGETED COMPONENT**: ${targetComponent}
2. **PRESERVE ALL OTHER ELEMENTS**: Do not change any other sections of the website
3. **MAINTAIN DESIGN CONSISTENCY**: Keep the same color scheme, fonts, and overall styling
4. **PRESERVE FUNCTIONALITY**: All existing buttons, links, and interactions must continue working
5. **MAINTAIN RESPONSIVE DESIGN**: Ensure changes work on all device sizes
6. **KEEP YOUTUBE INTEGRATION**: Preserve all channel-related elements and branding

## Required Output Format
- Only modify the specific HTML/CSS for the ${targetComponent} component
- Keep all other code exactly the same
- Maintain existing class names and structure where possible
- Preserve all YouTube integration elements
- Keep the same color scheme and design language

## Component Modification Guidelines
${generateComponentGuidelines(targetComponent, channelData)}

Make ONLY the requested changes to the ${targetComponent} component while preserving everything else exactly as it currently exists.
`;

    return targetedPrompt;
  }, []);

  const identifyTargetComponent = (userRequest: string): string => {
    const request = userRequest.toLowerCase();
    
    if (request.includes('header') || request.includes('top') || request.includes('title')) {
      return 'hero-section';
    }
    if (request.includes('navigation') || request.includes('menu') || request.includes('nav')) {
      return 'navigation';
    }
    if (request.includes('video') || request.includes('gallery') || request.includes('content')) {
      return 'video-gallery';
    }
    if (request.includes('stat') || request.includes('number') || request.includes('count')) {
      return 'stats-section';
    }
    if (request.includes('footer') || request.includes('bottom') || request.includes('contact')) {
      return 'footer';
    }
    if (request.includes('button') || request.includes('cta') || request.includes('subscribe')) {
      return 'call-to-action';
    }
    if (request.includes('color') || request.includes('background') || request.includes('style')) {
      return 'styling';
    }
    
    return 'general-content';
  };

  const identifyModificationType = (userRequest: string): string => {
    const request = userRequest.toLowerCase();
    
    if (request.includes('color') || request.includes('style') || request.includes('design')) {
      return 'styling';
    }
    if (request.includes('text') || request.includes('content') || request.includes('wording')) {
      return 'content';
    }
    if (request.includes('add') || request.includes('remove') || request.includes('layout')) {
      return 'structure';
    }
    
    return 'enhancement';
  };

  const extractComponentStructure = (currentCode: string, targetComponent: string): string => {
    if (!currentCode) return 'No current code structure available';

    // Extract relevant section based on component type
    const componentSelectors = {
      'hero-section': ['hero', 'header', 'h1', 'main-title'],
      'navigation': ['nav', 'menu', 'navigation'],
      'video-gallery': ['video', 'gallery', 'content'],
      'stats-section': ['stats', 'counter', 'number'],
      'footer': ['footer', 'contact'],
      'call-to-action': ['button', 'cta', 'subscribe'],
      'styling': ['style', 'css', 'color', 'background']
    };

    const selectors = componentSelectors[targetComponent] || [];
    let relevantCode = '';

    selectors.forEach(selector => {
      const regex = new RegExp(`<[^>]*class="[^"]*${selector}[^"]*"[^>]*>.*?</[^>]*>`, 'gis');
      const matches = currentCode.match(regex);
      if (matches) {
        relevantCode += matches.join('\n') + '\n';
      }
    });

    return relevantCode || 'Component structure will be preserved during modification';
  };

  const generateComponentGuidelines = (component: string, channelData: any): string => {
    const guidelines = {
      'hero-section': `
- Maintain the channel title "${channelData?.title || 'Channel Name'}"
- Preserve primary call-to-action button
- Keep hero background and styling
- Maintain responsive text sizing`,
      
      'navigation': `
- Keep all existing navigation links functional
- Maintain responsive mobile menu
- Preserve navigation styling and hover effects
- Keep brand logo/title in navigation`,
      
      'video-gallery': `
- Preserve YouTube video integration
- Maintain video thumbnail quality
- Keep video grid/layout structure
- Preserve video click functionality`,
      
      'stats-section': `
- Keep subscriber count: ${channelData?.subscriberCount || 'N/A'}
- Maintain video count: ${channelData?.videoCount || 'N/A'}
- Preserve stats layout and formatting
- Keep counter animations if present`,
      
      'footer': `
- Maintain all social media links
- Preserve contact information
- Keep footer layout structure
- Maintain footer background and styling`,
      
      'call-to-action': `
- Preserve "Subscribe" button functionality
- Maintain button hover effects
- Keep YouTube red color scheme for buttons
- Preserve button positioning and sizing`
    };

    return guidelines[component] || 'Maintain component functionality and design consistency';
  };

  return {
    generateTargetedPrompt
  };
};
