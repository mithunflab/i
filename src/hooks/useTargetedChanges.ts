
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
# TARGETED MODIFICATION REQUEST - CRITICAL INSTRUCTIONS

## IMPORTANT: ONLY MODIFY THE SPECIFIC ELEMENT REQUESTED
- Target Component: ${targetComponent}
- User Request: "${userRequest}"
- DO NOT rewrite the entire page
- DO NOT change any other sections
- PRESERVE all existing styling, colors, and layout
- MAINTAIN all YouTube integration and branding

## Current Page Context
- Channel: ${channelData?.title || 'Content Creator'}
- Subscribers: ${channelData?.subscriberCount || 'N/A'}
- Channel Thumbnail: ${channelData?.thumbnail || 'N/A'}
- Current Structure: ${componentStructure}

## STRICT MODIFICATION RULES
1. **ONLY CHANGE THE ${targetComponent} SECTION**
2. **KEEP ALL OTHER HTML/CSS EXACTLY THE SAME**
3. **PRESERVE YouTube branding and channel data**
4. **MAINTAIN responsive design**
5. **DO NOT change colors, fonts, or overall layout**
6. **USE REAL CHANNEL DATA**: 
   - Channel Title: ${channelData?.title}
   - Subscriber Count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
   - Channel Thumbnail: ${channelData?.thumbnail}
   - Custom URL: ${channelData?.customUrl || ''}

## Component-Specific Guidelines
${generateComponentGuidelines(targetComponent, channelData)}

## Required Output
- Provide ONLY the modified HTML for the ${targetComponent} section
- Keep everything else exactly the same
- Include real YouTube channel data where relevant
- Maintain existing design consistency

## Real Channel Data Integration
- Use actual channel thumbnail: ${channelData?.thumbnail}
- Display real subscriber count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Include channel title: ${channelData?.title}
- Add real video thumbnails if available
- Maintain YouTube brand colors (#FF0000 for buttons)

CRITICAL: Make ONLY the requested change to ${targetComponent}. Do not modify anything else.
`;

    return targetedPrompt;
  }, []);

  const identifyTargetComponent = (userRequest: string): string => {
    const request = userRequest.toLowerCase();
    
    if (request.includes('header') || request.includes('top') || request.includes('title') || request.includes('hero')) {
      return 'hero-section';
    }
    if (request.includes('navigation') || request.includes('menu') || request.includes('nav')) {
      return 'navigation';
    }
    if (request.includes('video') || request.includes('gallery') || request.includes('content')) {
      return 'video-gallery';
    }
    if (request.includes('stat') || request.includes('number') || request.includes('count') || request.includes('subscriber')) {
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
- Keep channel title "${channelData?.title || 'Channel Name'}" prominent
- Use real subscriber count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Maintain hero background and styling
- Preserve responsive text sizing
- Include channel thumbnail: ${channelData?.thumbnail}`,
      
      'navigation': `
- Keep all existing navigation links functional
- Maintain responsive mobile menu
- Preserve navigation styling and hover effects
- Keep brand logo/title in navigation
- Use channel name: ${channelData?.title}`,
      
      'video-gallery': `
- Use real video thumbnails from channel data
- Maintain video grid/layout structure
- Preserve video click functionality
- Include real video titles and descriptions
- Keep YouTube branding consistent`,
      
      'stats-section': `
- Display real subscriber count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Show actual video count: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- Include real view count: ${parseInt(channelData?.viewCount || '0').toLocaleString()}
- Preserve stats layout and formatting
- Keep counter animations if present`,
      
      'footer': `
- Include real channel URL: ${channelData?.customUrl || ''}
- Maintain all social media links
- Preserve contact information
- Keep footer layout structure
- Maintain footer background and styling`,
      
      'call-to-action': `
- Use YouTube subscribe URL for channel
- Maintain button hover effects
- Keep YouTube red color (#FF0000) for buttons
- Preserve button positioning and sizing
- Include real channel subscription link`
    };

    return guidelines[component] || 'Maintain component functionality and design consistency with real channel data';
  };

  return {
    generateTargetedPrompt
  };
};
