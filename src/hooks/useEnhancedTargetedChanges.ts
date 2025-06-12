
import { useCallback } from 'react';
import { useComprehensiveFileReader } from './useComprehensiveFileReader';

interface TargetedChangeRequest {
  userRequest: string;
  projectId: string;
  channelData?: any;
}

interface TargetedChangeResponse {
  prompt: string;
  preservationRules: string[];
  targetComponent: string;
  changeScope: 'minimal' | 'component' | 'section';
}

export const useEnhancedTargetedChanges = () => {
  const { readProjectFiles } = useComprehensiveFileReader();

  const generateEnhancedPrompt = useCallback(async ({
    userRequest,
    projectId,
    channelData
  }: TargetedChangeRequest): Promise<TargetedChangeResponse> => {
    
    console.log('🎯 Generating enhanced targeted prompt...');
    
    // Read all project files and context
    const projectStructure = await readProjectFiles(projectId);
    
    if (!projectStructure) {
      throw new Error('Unable to read project structure');
    }

    // Analyze user request to identify target
    const targetComponent = identifyTargetComponent(userRequest);
    const changeScope = determineChangeScope(userRequest);
    
    // Extract current component structure
    const currentHTML = projectStructure.files.find(f => f.path === 'index.html')?.content || '';
    const currentCSS = projectStructure.files.find(f => f.path === 'styles.css')?.content || '';
    const readmeContent = projectStructure.readmeContent || '';
    
    // Create preservation rules
    const preservationRules = generatePreservationRules(
      currentHTML,
      targetComponent,
      projectStructure.components
    );

    // Generate enhanced prompt
    const prompt = `
# 🎯 CRITICAL: TARGETED MODIFICATION ONLY

## MANDATORY PRESERVATION RULES
${preservationRules.map(rule => `- ${rule}`).join('\n')}

## USER REQUEST ANALYSIS
- **Request**: "${userRequest}"
- **Target Component**: ${targetComponent}
- **Change Scope**: ${changeScope}
- **Preserve**: ALL other components, styling, and functionality

## CURRENT PROJECT CONTEXT
### Project Structure
- Components: ${projectStructure.components.join(', ')}
- Layout: ${projectStructure.layout}
- Total Files: ${projectStructure.files.length}

### Current HTML Structure (MUST PRESERVE 95%)
\`\`\`html
${currentHTML.substring(0, 1000)}${currentHTML.length > 1000 ? '...' : ''}
\`\`\`

### Current Styles (MUST PRESERVE)
\`\`\`css
${currentCSS.substring(0, 500)}${currentCSS.length > 500 ? '...' : ''}
\`\`\`

### README Context
${readmeContent.substring(0, 300)}${readmeContent.length > 300 ? '...' : ''}

### Chat History Context
Recent changes: ${projectStructure.chatHistory.slice(-3).map(msg => msg.content?.substring(0, 100)).join(' | ')}

## CHANNEL DATA (USE REAL VALUES)
${channelData ? `
- Title: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(channelData.videoCount || '0').toLocaleString()}
- Thumbnail: ${channelData.thumbnail}
- Custom URL: ${channelData.customUrl || ''}
` : 'No channel data available'}

## STRICT MODIFICATION INSTRUCTIONS

### ✅ ONLY CHANGE:
- The specific ${targetComponent} element requested
- Exact content/styling mentioned in user request
- Keep ALL YouTube branding and data integration

### ❌ NEVER CHANGE:
- Any other HTML sections not mentioned
- Overall page layout and structure
- Color schemes (unless specifically requested)
- Font families and typography
- Navigation functionality
- Footer content (unless specifically requested)
- Video gallery structure (unless specifically requested)
- All other components and styling

### 🎨 DESIGN CONSISTENCY RULES
- Maintain existing color palette: ${projectStructure.styles.slice(0, 5).join(', ')}
- Preserve responsive design breakpoints
- Keep existing animation and hover effects
- Maintain YouTube brand colors (#FF0000 for buttons)
- Use consistent spacing and typography

### 📊 REAL DATA INTEGRATION
- Use actual subscriber count: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Display real channel name: ${channelData?.title || 'Channel Name'}
- Include real thumbnail: ${channelData?.thumbnail || ''}
- Show actual video count: ${parseInt(channelData?.videoCount || '0').toLocaleString()}

## OUTPUT REQUIREMENTS
1. **Minimal Change Principle**: Change ONLY what user requested
2. **Preserve Context**: Keep all existing functionality
3. **Real Data**: Use actual YouTube channel data
4. **Code Quality**: Maintain clean, readable HTML/CSS
5. **Responsive**: Ensure mobile compatibility

## VALIDATION CHECKLIST
- [ ] Only modified the requested ${targetComponent}
- [ ] Preserved all other HTML sections
- [ ] Maintained existing styling and colors
- [ ] Used real YouTube channel data
- [ ] Kept responsive design intact
- [ ] No functionality was broken

**CRITICAL**: Make the SMALLEST possible change that satisfies the user request while preserving EVERYTHING else.
`;

    console.log('✅ Enhanced targeted prompt generated:', {
      targetComponent,
      changeScope,
      preservationRulesCount: preservationRules.length
    });

    return {
      prompt,
      preservationRules,
      targetComponent,
      changeScope
    };
  }, [readProjectFiles]);

  return {
    generateEnhancedPrompt
  };
};

const identifyTargetComponent = (userRequest: string): string => {
  const request = userRequest.toLowerCase();
  
  const componentMap = {
    'hero': ['hero', 'title', 'heading', 'main title', 'top section'],
    'navigation': ['nav', 'menu', 'navigation', 'navbar'],
    'video-gallery': ['video', 'gallery', 'content', 'videos'],
    'stats-section': ['stats', 'statistics', 'numbers', 'count', 'subscriber'],
    'footer': ['footer', 'bottom', 'contact info'],
    'call-to-action': ['button', 'cta', 'subscribe', 'action'],
    'styling': ['color', 'background', 'style', 'theme']
  };

  for (const [component, keywords] of Object.entries(componentMap)) {
    if (keywords.some(keyword => request.includes(keyword))) {
      return component;
    }
  }

  return 'general-content';
};

const determineChangeScope = (userRequest: string): 'minimal' | 'component' | 'section' => {
  const request = userRequest.toLowerCase();
  
  if (request.includes('text') || request.includes('word') || request.includes('title')) {
    return 'minimal';
  }
  
  if (request.includes('section') || request.includes('layout') || request.includes('design')) {
    return 'section';
  }
  
  return 'component';
};

const generatePreservationRules = (
  currentHTML: string,
  targetComponent: string,
  components: string[]
): string[] => {
  const rules = [
    '🚫 DO NOT modify any HTML outside the requested component',
    '🚫 DO NOT change the overall page layout or structure',
    '🚫 DO NOT alter existing color schemes unless specifically requested',
    '🚫 DO NOT modify navigation functionality',
    '🚫 DO NOT change YouTube branding or data integration',
    '🚫 DO NOT alter responsive design breakpoints'
  ];

  // Add component-specific preservation rules
  components.forEach(component => {
    if (component !== targetComponent) {
      rules.push(`🚫 DO NOT modify the ${component} component`);
    }
  });

  return rules;
};
