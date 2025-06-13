
interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md';
  lastModified: Date;
}

interface ComponentMapEntry {
  id: string;
  selector: string;
  type: string;
  file: string;
  lastModified: Date;
}

interface DesignToken {
  name: string;
  value: string;
  category: 'color' | 'typography' | 'spacing' | 'breakpoint';
}

interface ChangeLogEntry {
  timestamp: Date;
  component: string;
  action: string;
  userRequest: string;
  details: string;
}

interface ChatHistoryEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    component?: string;
    parseResult?: 'success' | 'failed' | 'error';
    targetComponent?: string;
  };
}

export class SmartProjectManager {
  private projectId: string;
  private files: Map<string, ProjectFile> = new Map();
  private componentMap: Map<string, ComponentMapEntry> = new Map();
  private designTokens: Map<string, DesignToken> = new Map();
  private changelog: ChangeLogEntry[] = [];
  private chatHistory: ChatHistoryEntry[] = [];

  constructor(projectId: string) {
    this.projectId = projectId;
    this.initializeProjectStructure();
  }

  private initializeProjectStructure() {
    // Initialize core project files
    this.files.set('index.html', {
      name: 'index.html',
      content: '',
      type: 'html',
      lastModified: new Date()
    });

    this.files.set('componentMap.json', {
      name: 'componentMap.json',
      content: JSON.stringify({}, null, 2),
      type: 'json',
      lastModified: new Date()
    });

    this.files.set('design.json', {
      name: 'design.json',
      content: JSON.stringify({
        colors: {},
        typography: {},
        spacing: {},
        breakpoints: {}
      }, null, 2),
      type: 'json',
      lastModified: new Date()
    });

    this.files.set('changelog.md', {
      name: 'changelog.md',
      content: '# Project Changelog\n\nThis file tracks all AI-powered edits made to the project.\n\n',
      type: 'md',
      lastModified: new Date()
    });
  }

  // Component Management
  parseAndMapComponents(htmlContent: string): void {
    this.componentMap.clear();
    
    // Parse HTML for components with IDs
    const idMatches = htmlContent.match(/<[^>]*id\s*=\s*["']([^"']+)["'][^>]*>/g) || [];
    idMatches.forEach(match => {
      const idMatch = match.match(/id\s*=\s*["']([^"']+)["']/);
      const tagMatch = match.match(/<(\w+)/);
      
      if (idMatch && tagMatch) {
        const id = idMatch[1];
        const tag = tagMatch[1];
        
        this.componentMap.set(id, {
          id,
          selector: `#${id}`,
          type: this.determineComponentType(id, tag),
          file: 'index.html',
          lastModified: new Date()
        });
      }
    });

    // Parse semantic components
    const semanticComponents = [
      { pattern: /<header[^>]*>/gi, type: 'header', id: 'main-header' },
      { pattern: /<nav[^>]*>/gi, type: 'navigation', id: 'main-nav' },
      { pattern: /<footer[^>]*>/gi, type: 'footer', id: 'main-footer' },
      { pattern: /class\s*=\s*["'][^"']*hero[^"']*["']/gi, type: 'hero', id: 'hero-section' },
      { pattern: /class\s*=\s*["'][^"']*video[^"']*["']/gi, type: 'video', id: 'video-gallery' }
    ];

    semanticComponents.forEach(({ pattern, type, id }) => {
      if (pattern.test(htmlContent) && !this.componentMap.has(id)) {
        this.componentMap.set(id, {
          id,
          selector: type,
          type,
          file: 'index.html',
          lastModified: new Date()
        });
      }
    });

    // Update componentMap.json file
    const componentMapObject = Object.fromEntries(this.componentMap);
    this.updateFile('componentMap.json', JSON.stringify(componentMapObject, null, 2));
  }

  private determineComponentType(id: string, tag: string): string {
    const combined = (id + tag).toLowerCase();
    
    if (combined.includes('header')) return 'header';
    if (combined.includes('hero') || combined.includes('banner')) return 'hero';
    if (combined.includes('nav') || combined.includes('menu')) return 'navigation';
    if (combined.includes('footer')) return 'footer';
    if (combined.includes('btn') || combined.includes('button')) return 'button';
    if (combined.includes('video') || combined.includes('gallery')) return 'video';
    
    return 'content';
  }

  // Design Token Management
  extractDesignTokens(htmlContent: string, cssContent: string = ''): void {
    this.designTokens.clear();
    
    // Extract CSS from HTML if no separate CSS provided
    if (!cssContent) {
      const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      cssContent = styleMatch ? styleMatch[1] : '';
    }

    // Extract color tokens
    const colorMatches = cssContent.match(/(?:color|background-color|border-color):\s*([^;]+)/g) || [];
    const uniqueColors = [...new Set(colorMatches.map(match => match.split(':')[1].trim()))];
    
    uniqueColors.forEach((color, index) => {
      this.designTokens.set(`color-${index + 1}`, {
        name: `color-${index + 1}`,
        value: color,
        category: 'color'
      });
    });

    // Extract typography tokens
    const fontMatches = cssContent.match(/font-family:\s*([^;]+)/g) || [];
    const sizeMatches = cssContent.match(/font-size:\s*([^;]+)/g) || [];
    
    fontMatches.forEach((font, index) => {
      this.designTokens.set(`font-family-${index + 1}`, {
        name: `font-family-${index + 1}`,
        value: font.split(':')[1].trim(),
        category: 'typography'
      });
    });

    sizeMatches.forEach((size, index) => {
      this.designTokens.set(`font-size-${index + 1}`, {
        name: `font-size-${index + 1}`,
        value: size.split(':')[1].trim(),
        category: 'typography'
      });
    });

    // Extract spacing tokens
    const spacingMatches = cssContent.match(/(?:margin|padding):\s*([^;]+)/g) || [];
    const uniqueSpacing = [...new Set(spacingMatches.map(match => match.split(':')[1].trim()))];
    
    uniqueSpacing.forEach((spacing, index) => {
      this.designTokens.set(`spacing-${index + 1}`, {
        name: `spacing-${index + 1}`,
        value: spacing,
        category: 'spacing'
      });
    });

    // Update design.json file
    const designObject = {
      colors: Object.fromEntries([...this.designTokens.entries()].filter(([, token]) => token.category === 'color')),
      typography: Object.fromEntries([...this.designTokens.entries()].filter(([, token]) => token.category === 'typography')),
      spacing: Object.fromEntries([...this.designTokens.entries()].filter(([, token]) => token.category === 'spacing')),
      breakpoints: {
        mobile: '768px',
        tablet: '1024px',
        desktop: '1200px'
      }
    };
    
    this.updateFile('design.json', JSON.stringify(designObject, null, 2));
  }

  // Change Logging
  logChange(component: string, action: string, userRequest: string, details: string): void {
    const entry: ChangeLogEntry = {
      timestamp: new Date(),
      component,
      action,
      userRequest,
      details
    };
    
    this.changelog.push(entry);
    
    // Update changelog.md file
    const changelogContent = this.generateChangelogContent();
    this.updateFile('changelog.md', changelogContent);
  }

  private generateChangelogContent(): string {
    let content = '# Project Changelog\n\nThis file tracks all AI-powered edits made to the project.\n\n';
    
    // Group changes by date
    const changesByDate = this.changelog.reduce((acc, change) => {
      const date = change.timestamp.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(change);
      return acc;
    }, {} as Record<string, ChangeLogEntry[]>);

    Object.entries(changesByDate).forEach(([date, changes]) => {
      content += `## ${date}\n\n`;
      changes.forEach(change => {
        const time = change.timestamp.toLocaleTimeString();
        content += `### ${time} - ${change.action}\n`;
        content += `**Component**: ${change.component}\n`;
        content += `**User Request**: "${change.userRequest}"\n`;
        content += `**Details**: ${change.details}\n\n`;
      });
    });

    return content;
  }

  // Chat History Management
  saveChatMessage(role: 'user' | 'assistant', content: string, metadata?: any): void {
    const entry: ChatHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      role,
      content,
      metadata
    };
    
    this.chatHistory.push(entry);
    
    // Update chat history file
    const chatFile = `chat-history-${this.projectId}.json`;
    this.updateFile(chatFile, JSON.stringify(this.chatHistory, null, 2));
  }

  getChatHistory(): ChatHistoryEntry[] {
    return [...this.chatHistory];
  }

  // File Management
  updateFile(fileName: string, content: string): void {
    const existingFile = this.files.get(fileName);
    const fileType = this.getFileType(fileName);
    
    this.files.set(fileName, {
      name: fileName,
      content,
      type: fileType,
      lastModified: new Date()
    });
  }

  getFile(fileName: string): ProjectFile | null {
    return this.files.get(fileName) || null;
  }

  getAllFiles(): ProjectFile[] {
    return Array.from(this.files.values());
  }

  private getFileType(fileName: string): ProjectFile['type'] {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'js';
      case 'json': return 'json';
      case 'md': return 'md';
      default: return 'html';
    }
  }

  // Component Identification
  identifyTargetComponent(userRequest: string): string | null {
    const request = userRequest.toLowerCase();
    
    // Check for direct component mentions
    for (const [componentId] of this.componentMap) {
      if (request.includes(componentId.toLowerCase().replace('-', ' '))) {
        return componentId;
      }
    }
    
    // Keyword-based identification
    const keywordMap = {
      'main-header': ['header', 'top', 'logo', 'brand', 'title area'],
      'hero-section': ['hero', 'banner', 'main title', 'welcome', 'intro'],
      'main-nav': ['nav', 'menu', 'navigation', 'links'],
      'video-gallery': ['video', 'gallery', 'thumbnails', 'content'],
      'main-footer': ['footer', 'bottom', 'contact', 'social']
    };
    
    for (const [componentId, keywords] of Object.entries(keywordMap)) {
      if (this.componentMap.has(componentId)) {
        const matches = keywords.filter(keyword => request.includes(keyword));
        if (matches.length > 0) {
          return componentId;
        }
      }
    }
    
    return null;
  }

  // Project Export/Import
  exportProject(): Record<string, string> {
    const exported: Record<string, string> = {};
    
    this.files.forEach((file, fileName) => {
      exported[fileName] = file.content;
    });
    
    return exported;
  }

  importProject(files: Record<string, string>): void {
    Object.entries(files).forEach(([fileName, content]) => {
      this.updateFile(fileName, content);
    });
    
    // Re-parse components and design tokens if HTML is imported
    if (files['index.html']) {
      this.parseAndMapComponents(files['index.html']);
      this.extractDesignTokens(files['index.html']);
    }
  }

  // Generate README with AI editing instructions
  generateREADME(projectName: string, channelData?: any): void {
    const readmeContent = `# ${projectName} - AI-Powered Website

This website was generated and is maintained using AI-powered component-level editing.

## Project Overview
${channelData ? `
- **Channel**: ${channelData.title}
- **Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- **Content**: ${channelData.description?.substring(0, 100) || 'Creative content'}
` : ''}

## Smart Editing System
This project uses an intelligent AI system that can make precise changes to specific components without affecting the rest of the website.

### Available Components
${Array.from(this.componentMap.values()).map(comp => 
  `- **${comp.id}** (${comp.type}): ${comp.selector}`
).join('\n')}

### AI Commands
You can use natural language to make changes:
- "Make the subscribe button bigger and red"
- "Change the header background to blue"
- "Update the hero title text"
- "Add animation to the video thumbnails"

### Project Files
- \`index.html\` - Main website page
- \`componentMap.json\` - Maps all editable components
- \`design.json\` - Design system tokens
- \`changelog.md\` - History of all AI edits
- \`chat-history-${this.projectId}.json\` - Conversation history

### Features
- 🎯 Component-level targeting
- 🧠 Natural language understanding
- 🔄 Real-time preview updates
- 💾 Automatic change logging
- 🎨 Design system preservation
- 📱 Responsive design maintenance

## Getting Started
1. Open the AI chat interface
2. Describe what you want to change
3. AI will identify the target component
4. Changes are applied while preserving everything else
5. View updates in real-time preview

## Technical Details
- **Framework**: HTML/CSS/JavaScript
- **AI System**: OpenAI GPT with custom prompting
- **Architecture**: Component-based editing
- **Storage**: Supabase backend
- **Deployment**: Netlify hosting

---

*This README was automatically generated by the Smart Project Manager system.*
`;

    this.updateFile('README.md', readmeContent);
  }
}

export { SmartProjectManager };
export type { ProjectFile, ComponentMapEntry, DesignToken, ChangeLogEntry, ChatHistoryEntry };
