
interface ChannelData {
  title?: string;
  subscriberCount?: string;
  videoCount?: string;
  thumbnail?: string;
}

interface ProjectContext {
  youtubeUrl: string;
  projectIdea: string;
  currentCode?: string;
  preserveDesign?: boolean;
  targetedChange?: boolean;
}

export const generateEnhancedTargetingPrompt = (
  userRequest: string,
  channelData: ChannelData | null,
  projectContext: ProjectContext,
  currentProject?: any
): string => {
  return `
# 🎯 CRITICAL: ENHANCED TARGETED MODIFICATION SYSTEM

## USER REQUEST ANALYSIS
**Original Request**: "${userRequest}"
**Target**: ${identifyTargetElement(userRequest)}
**Scope**: ${determineChangeScope(userRequest)}

## MANDATORY PRESERVATION RULES
🚫 **NEVER MODIFY**: Any HTML/CSS/JS outside the requested element
🚫 **NEVER CHANGE**: Overall page layout, navigation structure, color schemes
🚫 **NEVER REMOVE**: YouTube branding, channel data, existing functionality
🚫 **NEVER ALTER**: Responsive design breakpoints, existing animations

## CURRENT PROJECT MEMORY
- **Channel**: ${channelData?.title || 'Unknown'}
- **Subscribers**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- **Existing Code**: ${currentProject?.source_code ? 'Available for reference' : 'New project'}
- **Last Modified**: ${currentProject?.updated_at ? new Date(currentProject.updated_at).toLocaleDateString() : 'N/A'}

## ENHANCED TARGETING INSTRUCTIONS
1. **Read Existing Code**: Analyze current HTML/CSS structure completely
2. **Identify Target**: Focus ONLY on the specific element mentioned
3. **Preserve Context**: Keep all surrounding elements intact
4. **Use Real Data**: Integrate actual YouTube channel information
5. **Minimal Changes**: Make the smallest possible modification

## OUTPUT REQUIREMENTS
- Generate complete HTML with targeted modifications only
- Include inline CSS for styling
- Use real channel data: "${channelData?.title}", ${parseInt(channelData?.subscriberCount || '0').toLocaleString()} subscribers
- Maintain responsive design principles
- Keep existing color scheme and branding

**CRITICAL**: This is a targeted modification. Change ONLY the requested element while preserving everything else exactly as it was.
`;
};

const identifyTargetElement = (userRequest: string): string => {
  const request = userRequest.toLowerCase();
  
  const targets = {
    'hero': ['hero', 'title', 'heading', 'main title', 'banner'],
    'navigation': ['nav', 'menu', 'navigation', 'navbar', 'header'],
    'video-section': ['video', 'gallery', 'content', 'videos'],
    'stats': ['stats', 'statistics', 'numbers', 'subscriber', 'count'],
    'footer': ['footer', 'bottom', 'contact'],
    'button': ['button', 'cta', 'call to action', 'subscribe'],
    'color': ['color', 'background', 'theme', 'style'],
    'text': ['text', 'content', 'description', 'paragraph']
  };

  for (const [element, keywords] of Object.entries(targets)) {
    if (keywords.some(keyword => request.includes(keyword))) {
      return element;
    }
  }

  return 'general-element';
};

const determineChangeScope = (userRequest: string): 'minimal' | 'component' | 'section' => {
  const request = userRequest.toLowerCase();
  
  if (request.includes('word') || request.includes('text') || request.includes('change to')) {
    return 'minimal';
  }
  
  if (request.includes('section') || request.includes('entire') || request.includes('whole')) {
    return 'section';
  }
  
  return 'component';
};

export const createPreservationRules = (currentCode: string): string[] => {
  const rules = [
    '🔒 Preserve all existing HTML structure outside target element',
    '🔒 Maintain current CSS styling and responsive design',
    '🔒 Keep all JavaScript functionality intact',
    '🔒 Preserve YouTube channel data integration',
    '🔒 Maintain existing color schemes and typography',
    '🔒 Keep navigation and footer sections unchanged'
  ];

  // Add specific rules based on current code structure
  if (currentCode?.includes('navbar')) {
    rules.push('🔒 Preserve navigation bar structure and styling');
  }
  
  if (currentCode?.includes('video-gallery')) {
    rules.push('🔒 Keep video gallery layout and functionality');
  }
  
  if (currentCode?.includes('stats')) {
    rules.push('🔒 Maintain statistics section with real data');
  }

  return rules;
};
