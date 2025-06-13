import { useCallback } from 'react';
import { useComponentLevelEditing } from './useComponentLevelEditing';
import { useAdvancedAIMemory } from './useAdvancedProjectMemory';

interface ComponentChange {
  selector: string;
  changeType: 'style' | 'content' | 'structure';
  description: string;
  preserveElements: string[];
}

export const useTargetedChanges = () => {
  const { generateComponentEditPrompt, parseUserIntent, validateEdit } = useComponentLevelEditing();

  const generateTargetedPrompt = useCallback((
    userRequest: string,
    currentCode: string,
    projectContext: any,
    channelData: any
  ) => {
    // Parse user intent
    const intent = parseUserIntent(userRequest);
    
    // Generate component-level edit prompt
    const editResult = generateComponentEditPrompt(userRequest, {
      projectId: projectContext?.id || '',
      currentCode,
      channelData
    });

    if (!editResult.success) {
      return `Error: ${editResult.error}`;
    }

    // Generate comprehensive targeted prompt
    const targetedPrompt = `
# 🎯 COMPONENT-LEVEL WEBSITE EDITING SYSTEM

## CRITICAL: TARGETED MODIFICATION ONLY
**This is a precision component edit. Modify ONLY the specific element requested.**

## USER REQUEST ANALYSIS
- **Original Request**: "${userRequest}"
- **Parsed Intent**: ${JSON.stringify(intent)}
- **Target Component**: ${editResult.targetComponent}
- **Modification Scope**: Component-level only

## STRICT PRESERVATION RULES
${editResult.preservationRules?.map(rule => `${rule}`).join('\n') || ''}

## CURRENT PROJECT CONTEXT
- **Project Type**: YouTube Channel Website
- **Channel**: ${channelData?.title || 'Content Creator'}  
- **Subscriber Count**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Video Count**: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- **Channel Thumbnail**: ${channelData?.thumbnail}

## COMPONENT MAPPING & STRUCTURE
The website follows a structured component system:
- Header: Logo, navigation, channel branding
- Hero: Channel title, subscriber count, main CTA
- Videos: Real video gallery with thumbnails
- Footer: Contact info, social links
- Buttons: Subscribe, video links, CTAs

## CURRENT CODE STRUCTURE
\`\`\`html
${currentCode.substring(0, 1500)}...
\`\`\`

## MODIFICATION INSTRUCTIONS

### ✅ ONLY CHANGE:
- The specific ${editResult.targetComponent} component mentioned in the request
- Exact content/styling explicitly requested by user
- Keep all YouTube integration and real data

### ❌ NEVER CHANGE:
- Any HTML elements not mentioned in the request
- Overall page layout and structure  
- Color schemes (unless specifically requested)
- Font families and typography system
- Navigation structure (unless targeting nav)
- Footer content (unless targeting footer)
- Video gallery structure (unless targeting videos)
- YouTube branding and channel data integration
- Responsive design breakpoints
- JavaScript functionality

### 🎨 DESIGN CONSISTENCY
- Use existing CSS classes and design patterns
- Maintain current color palette and typography
- Preserve animations and hover effects
- Keep YouTube brand colors (#FF0000 for subscribe buttons)
- Use consistent spacing and sizing

### 📊 REAL DATA INTEGRATION
- Channel Name: ${channelData?.title}
- Subscriber Count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Video Count: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- Channel Thumbnail: ${channelData?.thumbnail}
- Real Video Thumbnails: Use actual video data

## FILE STRUCTURE REQUIREMENTS
Generate clean, organized code with:
- Semantic HTML structure
- Embedded CSS in <style> tags
- Embedded JavaScript in <script> tags  
- Proper component organization
- SEO-friendly meta tags
- Mobile-responsive design

## OUTPUT REQUIREMENTS
1. **Minimal Change Principle**: Change ONLY what user requested
2. **Preserve Context**: Keep all existing functionality and design
3. **Real Data**: Use actual YouTube channel information
4. **Professional Quality**: Clean, production-ready code
5. **Component Integrity**: Maintain existing component relationships

## VALIDATION CHECKLIST
- [ ] Only modified the requested ${editResult.targetComponent}
- [ ] Preserved all other HTML/CSS/JS exactly
- [ ] Maintained existing color scheme and typography
- [ ] Used real YouTube channel data correctly
- [ ] Kept responsive design intact
- [ ] No existing functionality was broken
- [ ] YouTube integration remains working

**FINAL INSTRUCTION**: Make the SMALLEST possible change that satisfies the user request while preserving EVERYTHING else exactly as it was.
`;

    console.log('🎯 Generated targeted modification prompt for:', editResult.targetComponent);
    return targetedPrompt;
  }, [generateComponentEditPrompt, parseUserIntent]);

  return {
    generateTargetedPrompt,
    validateEdit
  };
};
