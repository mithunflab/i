
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

  // Parse HTML and create component map
  parseHTMLStructure(html: string): ComponentMap {
    const componentMap: ComponentMap = {};
    
    // Extract components with IDs and classes
    const idMatches = html.match(/<[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/g) || [];
    const classMatches = html.match(/<[^>]*class\s*=\s*["']([^"']+)["'][^>]*>/g) || [];
    
    // Map common components
    this.mapComponent(html, 'header', 'header', componentMap);
    this.mapComponent(html, 'navigation', 'nav', componentMap);
    this.mapComponent(html, 'hero', '.hero-section', componentMap);
    this.mapComponent(html, 'videos', '.video-gallery', componentMap);
    this.mapComponent(html, 'footer', 'footer', componentMap);
    this.mapComponent(html, 'cta-button', '.btn-primary', componentMap);
    
    // Extract all buttons
    const buttonMatches = html.match(/<button[^>]*>[\s\S]*?<\/button>/g) || [];
    buttonMatches.forEach((button, index) => {
      const idMatch = button.match(/id\s*=\s*["']([^"']+)["']/);
      const classMatch = button.match(/class\s*=\s*["']([^"']+)["']/);
      
      if (idMatch) {
        componentMap[`button-${idMatch[1]}`] = {
          file: 'index.html',
          id: idMatch[1],
          selector: `#${idMatch[1]}`,
          type: 'button'
        };
      } else if (classMatch) {
        componentMap[`button-${index}`] = {
          file: 'index.html',
          class: classMatch[1],
          selector: `.${classMatch[1].split(' ')[0]}`,
          type: 'button'
        };
      }
    });

    this.componentMap = componentMap;
    return componentMap;
  }

  private mapComponent(html: string, key: string, selector: string, map: ComponentMap) {
    const regex = selector.startsWith('.') 
      ? new RegExp(`<[^>]*class\\s*=\\s*["'][^"']*${selector.slice(1)}[^"']*["'][^>]*>[\\s\\S]*?</[^>]*>`, 'i')
      : new RegExp(`<${selector}[^>]*>[\\s\\S]*?</${selector}>`, 'i');
    
    const match = html.match(regex);
    if (match) {
      map[key] = {
        file: 'index.html',
        selector,
        type: this.getComponentType(key),
        ...(selector.startsWith('#') && { id: selector.slice(1) }),
        ...(selector.startsWith('.') && { class: selector.slice(1) })
      };
    }
  }

  private getComponentType(key: string): ComponentMapEntry['type'] {
    if (key.includes('header')) return 'header';
    if (key.includes('hero')) return 'hero';
    if (key.includes('button')) return 'button';
    if (key.includes('video')) return 'video';
    if (key.includes('footer')) return 'footer';
    if (key.includes('nav')) return 'navigation';
    return 'content';
  }

  // Identify target component from user request
  identifyTargetComponent(userRequest: string): string | null {
    const request = userRequest.toLowerCase();
    
    const componentKeywords = {
      header: ['header', 'top section', 'title area', 'logo area'],
      hero: ['hero', 'main banner', 'hero section', 'main title'],
      'cta-button': ['button', 'subscribe button', 'cta', 'call to action'],
      navigation: ['nav', 'menu', 'navigation', 'navbar'],
      videos: ['video', 'gallery', 'video section'],
      footer: ['footer', 'bottom section', 'contact info']
    };

    for (const [component, keywords] of Object.entries(componentKeywords)) {
      if (keywords.some(keyword => request.includes(keyword))) {
        return component;
      }
    }

    // Check for specific IDs or classes mentioned
    const idMatch = request.match(/id\s*["']?([^"'\s]+)["']?/);
    const classMatch = request.match(/class\s*["']?([^"'\s]+)["']?/);
    
    if (idMatch && this.componentMap[idMatch[1]]) return idMatch[1];
    if (classMatch && this.componentMap[classMatch[1]]) return classMatch[1];

    return null;
  }

  // Get component details
  getComponent(componentKey: string): ComponentMapEntry | null {
    return this.componentMap[componentKey] || null;
  }

  // Generate preservation rules for a component
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
      `✅ ONLY modify the ${component.type} component with selector ${component.selector}`,
      `✅ PRESERVE all existing styling and design consistency`,
      `✅ USE existing design tokens for any new styles`
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
# 🎯 COMPONENT-LEVEL EDITING INSTRUCTIONS

## USER REQUEST
"${userRequest}"

## TARGET COMPONENT
- Component: ${componentKey}
- Type: ${component.type}
- Selector: ${component.selector}
- File: ${component.file}

## STRICT PRESERVATION RULES
${preservationRules.map(rule => `${rule}`).join('\n')}

## DESIGN CONTEXT
- Primary Color: ${this.designTokens.colors.primary}
- Font Family: ${this.designTokens.typography.fontFamily}
- Spacing System: ${JSON.stringify(this.designTokens.spacing)}

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

## OUTPUT FORMAT
Provide the complete modified HTML file with ONLY the requested component changed.
Use comments to indicate unchanged sections: <!-- ... keep existing code ... -->

**CRITICAL**: This is a targeted component edit. Change ONLY what the user requested.
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
