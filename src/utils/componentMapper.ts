interface ComponentMapEntry {
  file: string;
  id?: string;
  class?: string;
  tag?: string;
  startLine?: number;
  endLine?: number;
  selector: string;
  type: 'header' | 'hero' | 'button' | 'video' | 'footer' | 'navigation' | 'content' | 'sidebar';
  dependencies?: string[];
}

interface ComponentMap {
  [key: string]: ComponentMapEntry;
}

interface DesignTokens {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    headingFont: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
  breakpoints: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
}

export class ComponentMapper {
  private componentMap: ComponentMap = {};
  private designTokens: DesignTokens;
  
  constructor(designTokens: DesignTokens) {
    this.designTokens = designTokens;
  }

  // Parse HTML and create component map with enhanced accuracy
  parseHTMLStructure(html: string): ComponentMap {
    const componentMap: ComponentMap = {};
    
    // Map semantic HTML elements
    this.mapSemanticComponents(html, componentMap);
    
    // Map components with IDs
    this.mapComponentsWithIds(html, componentMap);
    
    // Map components with specific classes
    this.mapComponentsWithClasses(html, componentMap);
    
    // Map buttons separately for better targeting
    this.mapButtons(html, componentMap);

    this.componentMap = componentMap;
    return componentMap;
  }

  private mapSemanticComponents(html: string, map: ComponentMap) {
    const semanticElements = [
      { tag: 'header', type: 'header' as const, name: 'main-header' },
      { tag: 'nav', type: 'navigation' as const, name: 'main-navigation' },
      { tag: 'footer', type: 'footer' as const, name: 'main-footer' },
      { tag: 'main', type: 'content' as const, name: 'main-content' },
      { tag: 'aside', type: 'sidebar' as const, name: 'sidebar' }
    ];

    semanticElements.forEach(({ tag, type, name }) => {
      const regex = new RegExp(`<${tag}[^>]*>`, 'i');
      if (regex.test(html)) {
        map[name] = {
          file: 'index.html',
          selector: tag,
          type,
          tag
        };
      }
    });
  }

  private mapComponentsWithIds(html: string, map: ComponentMap) {
    const idMatches = html.match(/<[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/g) || [];
    
    idMatches.forEach(match => {
      const idMatch = match.match(/id\s*=\s*["']([^"']+)["']/);
      const tagMatch = match.match(/<(\w+)/);
      
      if (idMatch && tagMatch) {
        const id = idMatch[1];
        const tag = tagMatch[1];
        
        map[id] = {
          file: 'index.html',
          id,
          selector: `#${id}`,
          type: this.getComponentType(id),
          tag
        };
      }
    });
  }

  private mapComponentsWithClasses(html: string, map: ComponentMap) {
    const classPatterns = [
      { pattern: /class\s*=\s*["'][^"']*hero[^"']*["']/gi, type: 'hero' as const, name: 'hero-section' },
      { pattern: /class\s*=\s*["'][^"']*video[^"']*["']/gi, type: 'video' as const, name: 'video-gallery' },
      { pattern: /class\s*=\s*["'][^"']*cta[^"']*["']/gi, type: 'button' as const, name: 'cta-button' }
    ];

    classPatterns.forEach(({ pattern, type, name }) => {
      if (pattern.test(html) && !map[name]) {
        map[name] = {
          file: 'index.html',
          selector: `.${name}`,
          type,
          class: name
        };
      }
    });
  }

  private mapButtons(html: string, map: ComponentMap) {
    const buttonMatches = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) || [];
    
    buttonMatches.forEach((button, index) => {
      const idMatch = button.match(/id\s*=\s*["']([^"']+)["']/);
      const classMatch = button.match(/class\s*=\s*["']([^"']+)["']/);
      
      if (idMatch) {
        const id = idMatch[1];
        if (!map[id]) {
          map[id] = {
            file: 'index.html',
            id,
            selector: `#${id}`,
            type: 'button'
          };
        }
      } else if (classMatch) {
        const className = classMatch[1].split(' ')[0];
        const name = `button-${className}`;
        if (!map[name]) {
          map[name] = {
            file: 'index.html',
            class: className,
            selector: `.${className}`,
            type: 'button'
          };
        }
      } else {
        // Generic button without ID or class
        const name = `button-${index + 1}`;
        if (!map[name]) {
          map[name] = {
            file: 'index.html',
            selector: `button:nth-of-type(${index + 1})`,
            type: 'button'
          };
        }
      }
    });
  }

  private getComponentType(key: string): ComponentMapEntry['type'] {
    const lowerKey = key.toLowerCase();
    
    if (lowerKey.includes('header')) return 'header';
    if (lowerKey.includes('hero') || lowerKey.includes('banner')) return 'hero';
    if (lowerKey.includes('button') || lowerKey.includes('btn') || lowerKey.includes('cta')) return 'button';
    if (lowerKey.includes('video') || lowerKey.includes('gallery')) return 'video';
    if (lowerKey.includes('footer')) return 'footer';
    if (lowerKey.includes('nav') || lowerKey.includes('menu')) return 'navigation';
    if (lowerKey.includes('sidebar') || lowerKey.includes('aside')) return 'sidebar';
    
    return 'content';
  }

  // Enhanced component identification
  identifyTargetComponent(userRequest: string): string | null {
    const request = userRequest.toLowerCase();
    
    // Direct component ID/class mentions
    for (const [componentId] of Object.entries(this.componentMap)) {
      if (request.includes(componentId.toLowerCase().replace('-', ' '))) {
        return componentId;
      }
    }
    
    // Enhanced keyword matching
    const keywordMap = {
      'main-header': ['header', 'top section', 'title area', 'logo', 'brand'],
      'hero-section': ['hero', 'main banner', 'hero section', 'main title', 'welcome section'],
      'cta-button': ['button', 'subscribe button', 'cta', 'call to action', 'action button'],
      'main-navigation': ['nav', 'menu', 'navigation', 'navbar', 'links'],
      'video-gallery': ['video', 'gallery', 'video section', 'thumbnails', 'content area'],
      'main-footer': ['footer', 'bottom section', 'contact info', 'social links']
    };
    
    for (const [componentId, keywords] of Object.entries(keywordMap)) {
      if (this.componentMap[componentId]) {
        const matches = keywords.filter(keyword => request.includes(keyword));
        if (matches.length > 0) {
          return componentId;
        }
      }
    }
    
    return null;
  }

  // Get component details
  getComponent(componentKey: string): ComponentMapEntry | null {
    return this.componentMap[componentKey] || null;
  }

  // Generate strict preservation rules
  getPreservationRules(componentKey: string): string[] {
    const component = this.getComponent(componentKey);
    if (!component) return [];

    return [
      `🚫 NEVER modify components other than ${componentKey}`,
      `🚫 NEVER change overall page layout or structure`,
      `🚫 NEVER alter design tokens: ${JSON.stringify(this.designTokens.colors)}`,
      `🚫 NEVER modify CSS classes unrelated to ${component.selector}`,
      `🚫 NEVER change responsive breakpoints`,
      `🚫 NEVER remove YouTube integration or channel data`,
      `🚫 NEVER modify JavaScript functionality outside the target component`,
      `✅ ONLY modify the ${component.type} component with selector ${component.selector}`,
      `✅ PRESERVE all existing styling and design consistency`,
      `✅ USE existing design tokens for any new styles`,
      `✅ MAINTAIN responsive design principles`,
      `✅ PRESERVE accessibility attributes`
    ];
  }

  // Extract design tokens from CSS
  extractDesignTokens(css: string): DesignTokens {
    const extractValue = (pattern: RegExp, defaultValue: string): string => {
      const match = css.match(pattern);
      return match ? match[1] : defaultValue;
    };

    return {
      colors: {
        primary: extractValue(/--primary[^:]*:\s*([^;]+)/, '#ff0000'),
        secondary: extractValue(/--secondary[^:]*:\s*([^;]+)/, '#666666'),
        background: extractValue(/--background[^:]*:\s*([^;]+)/, '#ffffff'),
        text: extractValue(/--text[^:]*:\s*([^;]+)/, '#333333'),
        accent: extractValue(/--accent[^:]*:\s*([^;]+)/, '#0066cc')
      },
      typography: {
        fontFamily: extractValue(/--font-family[^:]*:\s*([^;]+)/, 'Arial, sans-serif'),
        headingFont: extractValue(/--heading-font[^:]*:\s*([^;]+)/, 'Arial, sans-serif'),
        fontSize: {
          small: extractValue(/--font-size-small[^:]*:\s*([^;]+)/, '14px'),
          medium: extractValue(/--font-size-medium[^:]*:\s*([^;]+)/, '16px'),
          large: extractValue(/--font-size-large[^:]*:\s*([^;]+)/, '20px'),
          xlarge: extractValue(/--font-size-xlarge[^:]*:\s*([^;]+)/, '28px')
        }
      },
      spacing: {
        small: extractValue(/--spacing-small[^:]*:\s*([^;]+)/, '8px'),
        medium: extractValue(/--spacing-medium[^:]*:\s*([^;]+)/, '16px'),
        large: extractValue(/--spacing-large[^:]*:\s*([^;]+)/, '24px'),
        xlarge: extractValue(/--spacing-xlarge[^:]*:\s*([^;]+)/, '48px')
      },
      breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px'
      }
    };
  }

  // Generate targeted modification instructions
  generateTargetedInstructions(
    userRequest: string,
    componentKey: string,
    currentCode: string
  ): string {
    const component = this.getComponent(componentKey);
    if (!component) return '';

    const preservationRules = this.getPreservationRules(componentKey);
    
    return `
# 🎯 ENHANCED COMPONENT-LEVEL EDITING

## USER REQUEST
"${userRequest}"

## TARGET COMPONENT ANALYSIS
- **Component**: ${componentKey}
- **Type**: ${component.type}
- **Selector**: ${component.selector}
- **File**: ${component.file}

## STRICT PRESERVATION RULES
${preservationRules.map(rule => `${rule}`).join('\n')}

## DESIGN SYSTEM CONTEXT
- **Primary Color**: ${this.designTokens.colors.primary}
- **Typography**: ${this.designTokens.typography.fontFamily}
- **Spacing System**: ${JSON.stringify(this.designTokens.spacing)}

## CURRENT COMPONENT CODE
\`\`\`html
${this.extractComponentCode(currentCode, component)}
\`\`\`

## MODIFICATION REQUIREMENTS
1. **SCOPE**: Modify ONLY the ${component.type} component
2. **PRESERVATION**: Keep all other HTML, CSS, and JS exactly the same
3. **CONSISTENCY**: Use existing design tokens and patterns
4. **STRUCTURE**: Maintain current DOM structure and classes
5. **FUNCTIONALITY**: Preserve all existing JavaScript functionality
6. **RESPONSIVENESS**: Maintain mobile-first responsive design
7. **ACCESSIBILITY**: Preserve ARIA attributes and semantic structure

## OUTPUT FORMAT
Provide the complete modified HTML file with ONLY the requested component changed.
Use comments to indicate unchanged sections: <!-- ... keep existing code ... -->

**CRITICAL**: This is a targeted component edit. Change ONLY what the user requested while preserving everything else.
`;
  }

  private extractComponentCode(html: string, component: ComponentMapEntry): string {
    if (component.selector.startsWith('#')) {
      const regex = new RegExp(`<[^>]*id\\s*=\\s*["']${component.selector.slice(1)}["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
      const match = html.match(regex);
      return match ? match[0] : 'Component not found';
    }
    
    if (component.selector.startsWith('.')) {
      const className = component.selector.slice(1);
      const regex = new RegExp(`<[^>]*class\\s*=\\s*["'][^"']*${className}[^"']*["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i');
      const match = html.match(regex);
      return match ? match[0] : 'Component not found';
    }
    
    // Tag selector
    const regex = new RegExp(`<${component.selector}[^>]*>[\\s\\S]*?</${component.selector}>`, 'i');
    const match = html.match(regex);
    return match ? match[0] : 'Component not found';
  }
}

export type { ComponentMap, DesignTokens, ComponentMapEntry };
