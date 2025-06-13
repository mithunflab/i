
interface ComponentIntent {
  targetComponentId: string;
  targetComponentType: 'header' | 'hero' | 'button' | 'video' | 'footer' | 'navigation' | 'content';
  file: string;
  action: 'style_update' | 'content_update' | 'structure_update' | 'add_component' | 'remove_component';
  updates: {
    addClass?: string;
    removeClass?: string;
    style?: Record<string, string>;
    content?: string;
    attributes?: Record<string, string>;
  };
  preservationLevel: 'minimal' | 'component' | 'section';
  confidence: number;
}

interface ParseResult {
  success: boolean;
  intent?: ComponentIntent;
  error?: string;
  suggestions?: string[];
}

export class IntentParser {
  private componentKeywords = {
    header: ['header', 'top', 'navigation', 'navbar', 'menu', 'logo'],
    hero: ['hero', 'banner', 'main title', 'heading', 'welcome', 'intro'],
    button: ['button', 'btn', 'subscribe', 'cta', 'call to action', 'click'],
    video: ['video', 'gallery', 'content', 'thumbnails', 'playlist'],
    footer: ['footer', 'bottom', 'contact', 'links', 'social'],
    navigation: ['nav', 'menu', 'navigation', 'navbar', 'sidebar'],
    content: ['text', 'content', 'description', 'paragraph', 'section']
  };

  private actionKeywords = {
    style_update: ['change color', 'make bigger', 'resize', 'style', 'background', 'font'],
    content_update: ['change text', 'update content', 'modify text', 'edit text', 'rename'],
    structure_update: ['add element', 'remove element', 'restructure', 'layout'],
    add_component: ['add', 'create', 'insert', 'new'],
    remove_component: ['remove', 'delete', 'hide', 'eliminate']
  };

  parseUserRequest(userChat: string, componentMap: any, designTokens: any): ParseResult {
    const chat = userChat.toLowerCase().trim();
    
    if (!chat) {
      return {
        success: false,
        error: "Empty request",
        suggestions: ["Try describing what you want to change, like 'make the button bigger' or 'change header color'"]
      };
    }

    // 1. Identify target component
    const targetComponent = this.identifyTargetComponent(chat, componentMap);
    if (!targetComponent) {
      return {
        success: false,
        error: "Could not identify target component",
        suggestions: [
          "Be more specific about which component to modify",
          "Try mentioning: header, button, footer, video section, or navigation"
        ]
      };
    }

    // 2. Determine action type
    const action = this.determineAction(chat);
    
    // 3. Extract specific updates
    const updates = this.extractUpdates(chat, action, designTokens);
    
    // 4. Calculate confidence
    const confidence = this.calculateConfidence(chat, targetComponent, action);

    if (confidence < 0.3) {
      return {
        success: false,
        error: "Low confidence in parsing request",
        suggestions: [
          "Be more specific about what you want to change",
          "Example: 'Change the subscribe button to be larger and red'"
        ]
      };
    }

    const intent: ComponentIntent = {
      targetComponentId: targetComponent.id,
      targetComponentType: targetComponent.type,
      file: targetComponent.file,
      action,
      updates,
      preservationLevel: this.determinePreservationLevel(chat),
      confidence
    };

    return {
      success: true,
      intent
    };
  }

  private identifyTargetComponent(chat: string, componentMap: any) {
    let bestMatch = null;
    let bestScore = 0;

    // Check for explicit component IDs or classes
    for (const [key, component] of Object.entries(componentMap)) {
      if (chat.includes(key.toLowerCase()) || chat.includes(component.id?.toLowerCase() || '')) {
        return { ...component, id: component.id || key, type: component.type || 'content' };
      }
    }

    // Keyword-based matching
    for (const [componentType, keywords] of Object.entries(this.componentKeywords)) {
      const matches = keywords.filter(keyword => chat.includes(keyword));
      const score = matches.length / keywords.length;
      
      if (score > bestScore && score > 0.2) {
        bestScore = score;
        bestMatch = {
          id: this.findComponentByType(componentType, componentMap),
          type: componentType as any,
          file: 'index.html'
        };
      }
    }

    return bestMatch;
  }

  private findComponentByType(type: string, componentMap: any): string {
    // Look for components of this type in the map
    for (const [key, component] of Object.entries(componentMap)) {
      if (component.type === type || key.includes(type)) {
        return component.id || key;
      }
    }
    
    // Fallback to common IDs
    const fallbacks = {
      header: 'main-header',
      hero: 'hero-section',
      button: 'cta-btn',
      video: 'video-gallery',
      footer: 'main-footer',
      navigation: 'main-nav',
      content: 'main-content'
    };
    
    return fallbacks[type] || `${type}-component`;
  }

  private determineAction(chat: string): ComponentIntent['action'] {
    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      if (keywords.some(keyword => chat.includes(keyword))) {
        return action as ComponentIntent['action'];
      }
    }
    
    // Default to style update for most common requests
    return 'style_update';
  }

  private extractUpdates(chat: string, action: ComponentIntent['action'], designTokens: any) {
    const updates: ComponentIntent['updates'] = {};

    // Color updates
    const colorMatch = chat.match(/(?:color|background)[^a-z]*([a-z]+|#[0-9a-f]{6}|rgb\([^)]+\))/i);
    if (colorMatch && action === 'style_update') {
      updates.style = { ...updates.style, color: this.parseColor(colorMatch[1], designTokens) };
    }

    // Size updates
    if (chat.includes('bigger') || chat.includes('larger')) {
      updates.addClass = 'btn-lg';
      updates.style = { ...updates.style, fontSize: '1.2em' };
    }
    if (chat.includes('smaller')) {
      updates.addClass = 'btn-sm';
      updates.style = { ...updates.style, fontSize: '0.9em' };
    }

    // Content updates
    const textMatch = chat.match(/(?:text|content)[^"']*["']([^"']+)["']/i);
    if (textMatch && action === 'content_update') {
      updates.content = textMatch[1];
    }

    // Class updates
    if (chat.includes('highlight')) {
      updates.addClass = 'highlighted';
    }
    if (chat.includes('remove highlight')) {
      updates.removeClass = 'highlighted';
    }

    return updates;
  }

  private parseColor(colorStr: string, designTokens: any): string {
    // Use design tokens if available
    const colorMap = {
      red: designTokens?.primaryColor || '#ff0000',
      blue: '#0066cc',
      green: '#00cc66',
      yellow: '#ffcc00',
      purple: '#6600cc',
      orange: '#ff6600'
    };

    return colorMap[colorStr.toLowerCase()] || colorStr;
  }

  private calculateConfidence(chat: string, targetComponent: any, action: string): number {
    let confidence = 0.5; // Base confidence

    // Boost for explicit component mention
    if (chat.includes(targetComponent.id?.toLowerCase() || '')) {
      confidence += 0.3;
    }

    // Boost for clear action words
    const actionWords = this.actionKeywords[action] || [];
    if (actionWords.some(word => chat.includes(word))) {
      confidence += 0.2;
    }

    // Boost for specific details
    if (chat.match(/color|size|text|style/)) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private determinePreservationLevel(chat: string): ComponentIntent['preservationLevel'] {
    if (chat.includes('entire') || chat.includes('whole') || chat.includes('all')) {
      return 'section';
    }
    if (chat.includes('component') || chat.includes('element')) {
      return 'component';
    }
    return 'minimal';
  }

  generateTargetedPrompt(intent: ComponentIntent, channelData: any, currentCode: string): string {
    return `
# 🎯 PRECISION COMPONENT EDITING

## COMPONENT TARGET
- **ID**: ${intent.targetComponentId}
- **Type**: ${intent.targetComponentType}
- **File**: ${intent.file}
- **Action**: ${intent.action}
- **Confidence**: ${Math.round(intent.confidence * 100)}%

## MODIFICATION SCOPE
**CRITICAL**: Edit ONLY the ${intent.targetComponentType} component with ID "${intent.targetComponentId}"

## SPECIFIC CHANGES REQUESTED
${Object.entries(intent.updates).map(([key, value]) => 
  `- ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
).join('\n')}

## PRESERVATION RULES
- 🚫 Do NOT modify any other HTML elements
- 🚫 Do NOT change overall page layout
- 🚫 Do NOT alter existing color schemes (unless specifically requested)
- 🚫 Do NOT remove YouTube integration or channel data
- ✅ ONLY modify the specified ${intent.targetComponentType} component

## CHANNEL DATA (preserve)
${channelData ? `
- Channel: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(channelData.videoCount || '0').toLocaleString()}
` : 'No channel data'}

## CURRENT CODE CONTEXT
\`\`\`html
${currentCode.substring(0, 800)}...
\`\`\`

## OUTPUT REQUIREMENT
Return ONLY the modified component code, preserving all existing functionality and design.
`;
  }
}

export const intentParser = new IntentParser();
