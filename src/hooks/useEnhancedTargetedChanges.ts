
import { useCallback } from 'react';
import { ComponentMapper } from '../utils/componentMapper';

interface TargetedChangeRequest {
  userRequest: string;
  projectId: string;
  channelData?: any;
  currentCode: string;
}

interface TargetedChangeResponse {
  prompt: string;
  preservationRules: string[];
  targetComponent: string;
  changeScope: 'minimal' | 'component' | 'section';
  componentMap: any;
}

export const useEnhancedTargetedChanges = () => {

  const generateEnhancedPrompt = useCallback(async ({
    userRequest,
    projectId,
    channelData,
    currentCode
  }: TargetedChangeRequest): Promise<TargetedChangeResponse> => {
    
    console.log('🎯 Generating enhanced component-level prompt...');
    
    // Initialize component mapper
    const mapper = new ComponentMapper({
      colors: { primary: '#ff0000', secondary: '#666666', background: '#ffffff', text: '#333333', accent: '#0066cc' },
      typography: { fontFamily: 'Arial, sans-serif', headingFont: 'Arial, sans-serif', fontSize: { small: '14px', medium: '16px', large: '20px', xlarge: '28px' } },
      spacing: { small: '8px', medium: '16px', large: '24px', xlarge: '48px' },
      breakpoints: { mobile: '768px', tablet: '1024px', desktop: '1200px' }
    });

    // Parse current code structure
    const componentMap = mapper.parseHTMLStructure(currentCode);
    const targetComponent = mapper.identifyTargetComponent(userRequest);
    const changeScope = determineChangeScope(userRequest);
    
    if (!targetComponent) {
      throw new Error(`Unable to identify target component from request: "${userRequest}"`);
    }

    // Get preservation rules
    const preservationRules = mapper.getPreservationRules(targetComponent);
    
    // Extract current CSS and design tokens
    const cssMatch = currentCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const currentCSS = cssMatch ? cssMatch[1] : '';
    const designTokens = mapper.extractDesignTokens(currentCSS);

    // Generate enhanced prompt
    const prompt = `
# 🎯 ADVANCED COMPONENT-LEVEL WEBSITE EDITING

## CRITICAL: PRECISION TARGETING SYSTEM
**This is a component-level edit. Modify ONLY the specific component requested.**

## USER REQUEST ANALYSIS
- **Request**: "${userRequest}"
- **Target Component**: ${targetComponent}
- **Change Scope**: ${changeScope}
- **Component Type**: ${componentMap[targetComponent]?.type || 'unknown'}
- **Component Selector**: ${componentMap[targetComponent]?.selector || 'unknown'}

## COMPONENT MAPPING
\`\`\`json
${JSON.stringify(componentMap, null, 2)}
\`\`\`

## DESIGN TOKENS (MUST PRESERVE)
\`\`\`json
${JSON.stringify(designTokens, null, 2)}
\`\`\`

## PRESERVATION RULES
${preservationRules.map(rule => `${rule}`).join('\n')}

## CURRENT PROJECT CONTEXT
- **Project ID**: ${projectId}
- **Channel**: ${channelData?.title || 'Content Creator'}
- **Subscribers**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- **Channel Thumbnail**: ${channelData?.thumbnail}

## CURRENT CODE STRUCTURE
\`\`\`html
${currentCode.substring(0, 2000)}${currentCode.length > 2000 ? '...' : ''}
\`\`\`

## COMPONENT-SPECIFIC INSTRUCTIONS

### Target Component Details
- **Component**: ${targetComponent}
- **File**: ${componentMap[targetComponent]?.file || 'index.html'}
- **Selector**: ${componentMap[targetComponent]?.selector || 'unknown'}
- **Current Code**:
\`\`\`html
${extractComponentCode(currentCode, componentMap[targetComponent])}
\`\`\`

### Modification Requirements
1. **SCOPE**: Modify ONLY the ${targetComponent} component
2. **PRESERVATION**: Keep ALL other components exactly as they are
3. **DESIGN**: Use existing design tokens and CSS classes
4. **STRUCTURE**: Maintain DOM structure and relationships
5. **FUNCTIONALITY**: Preserve all JavaScript and interactions
6. **DATA**: Use real YouTube channel data

### File Structure Output
Generate clean, organized code with:
- **HTML**: Semantic structure with proper component organization
- **CSS**: Embedded styles in <style> tags using design tokens
- **JavaScript**: Embedded scripts in <script> tags for interactions
- **SEO**: Proper meta tags and accessibility
- **Responsive**: Mobile-first responsive design

## REAL DATA INTEGRATION
- **Channel Name**: ${channelData?.title}
- **Subscriber Count**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Video Count**: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- **Channel Thumbnail**: ${channelData?.thumbnail}
- **Videos**: Use real video thumbnails and data

## CRITICAL OUTPUT REQUIREMENTS
1. **Targeted Modification**: Change ONLY the ${targetComponent}
2. **Code Preservation**: Keep all other HTML/CSS/JS identical
3. **Design Consistency**: Maintain existing visual design
4. **Professional Quality**: Clean, production-ready code
5. **Real Data**: Use actual YouTube channel information
6. **Component Integrity**: Preserve component relationships

## VALIDATION CHECKLIST
- [ ] Only the ${targetComponent} was modified
- [ ] All other components remain unchanged
- [ ] Design tokens and color scheme preserved
- [ ] Real YouTube data integrated correctly
- [ ] Responsive design maintained
- [ ] No functionality broken
- [ ] Code is clean and organized

**FINAL INSTRUCTION**: Make the SMALLEST possible change to satisfy the user request while preserving the entire website structure and all other components exactly as they were.
`;

    console.log('✅ Enhanced component-level prompt generated for:', targetComponent);

    return {
      prompt,
      preservationRules,
      targetComponent,
      changeScope,
      componentMap
    };
  }, []);

  return {
    generateEnhancedPrompt
  };
};

// Helper functions
const determineChangeScope = (userRequest: string): 'minimal' | 'component' | 'section' => {
  const request = userRequest.toLowerCase();
  
  if (request.includes('text') || request.includes('word') || request.includes('title') || request.includes('color')) {
    return 'minimal';
  }
  
  if (request.includes('section') || request.includes('layout') || request.includes('entire')) {
    return 'section';
  }
  
  return 'component';
};

const extractComponentCode = (html: string, component: any): string => {
  if (!component?.selector) return 'Component not found';
  
  const selector = component.selector;
  let regex: RegExp;
  
  if (selector.startsWith('#')) {
    regex = new RegExp(`<[^>]*id\\s*=\\s*["']${selector.slice(1)}["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
  } else if (selector.startsWith('.')) {
    const className = selector.slice(1);
    regex = new RegExp(`<[^>]*class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
  } else {
    regex = new RegExp(`<${selector}[^>]*>[\\s\\S]*?</${selector}>`, 'i');
  }
  
  const match = html.match(regex);
  return match ? match[0] : 'Component not found in current code';
};
