
interface ProjectFile {
  name: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md';
  content: string;
  lastModified: Date;
}

interface ComponentMap {
  [key: string]: {
    file: string;
    id?: string;
    class?: string;
    type: string;
  };
}

interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSizeBase: string;
  spacing: string;
  borderRadius: string;
}

interface ChatHistoryEntry {
  id: string;
  timestamp: Date;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    component?: string;
    action?: string;
    changes?: string;
  };
}

export class ProjectFileManager {
  private projectId: string;
  private files: Map<string, ProjectFile> = new Map();

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  // Component Map Management
  createComponentMap(htmlContent: string): ComponentMap {
    const componentMap: ComponentMap = {};
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Extract components with IDs
    const elementsWithIds = doc.querySelectorAll('[id]');
    elementsWithIds.forEach(element => {
      const id = element.getAttribute('id');
      if (id) {
        componentMap[id] = {
          file: 'index.html',
          id: id,
          class: element.className,
          type: this.determineComponentType(element)
        };
      }
    });

    // Extract common components by tag and class
    const commonComponents = [
      { selector: 'header', type: 'header' },
      { selector: '.hero', type: 'hero' },
      { selector: 'nav', type: 'navigation' },
      { selector: 'footer', type: 'footer' },
      { selector: 'button', type: 'button' },
      { selector: '.video-gallery', type: 'video' }
    ];

    commonComponents.forEach(({ selector, type }) => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const id = element.getAttribute('id') || `${type}-${index}`;
        if (!componentMap[id]) {
          componentMap[id] = {
            file: 'index.html',
            id: element.getAttribute('id') || undefined,
            class: element.className,
            type
          };
        }
      });
    });

    this.saveFile('componentMap.json', 'json', JSON.stringify(componentMap, null, 2));
    return componentMap;
  }

  private determineComponentType(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();

    if (tagName === 'header' || id.includes('header') || className.includes('header')) return 'header';
    if (tagName === 'nav' || id.includes('nav') || className.includes('nav')) return 'navigation';
    if (tagName === 'footer' || id.includes('footer') || className.includes('footer')) return 'footer';
    if (tagName === 'button' || id.includes('btn') || className.includes('btn')) return 'button';
    if (id.includes('hero') || className.includes('hero')) return 'hero';
    if (id.includes('video') || className.includes('video')) return 'video';
    
    return 'content';
  }

  // Design Tokens Management
  extractDesignTokens(cssContent: string): DesignTokens {
    const designTokens: DesignTokens = {
      primaryColor: '#ff0000',
      secondaryColor: '#666666',
      fontFamily: 'Arial, sans-serif',
      fontSizeBase: '16px',
      spacing: '16px',
      borderRadius: '4px'
    };

    // Extract CSS custom properties
    const customPropMatches = cssContent.match(/--[\w-]+:\s*[^;]+/g) || [];
    customPropMatches.forEach(match => {
      const [property, value] = match.split(':').map(s => s.trim());
      
      if (property.includes('primary-color')) designTokens.primaryColor = value;
      if (property.includes('secondary-color')) designTokens.secondaryColor = value;
      if (property.includes('font-family')) designTokens.fontFamily = value;
      if (property.includes('font-size')) designTokens.fontSizeBase = value;
      if (property.includes('spacing')) designTokens.spacing = value;
      if (property.includes('border-radius')) designTokens.borderRadius = value;
    });

    // Extract regular CSS properties
    const colorMatches = cssContent.match(/color:\s*([^;]+)/g) || [];
    if (colorMatches.length > 0) {
      designTokens.primaryColor = colorMatches[0].split(':')[1].trim();
    }

    this.saveFile('design.json', 'json', JSON.stringify(designTokens, null, 2));
    return designTokens;
  }

  // Chat History Management
  saveChatMessage(role: 'user' | 'assistant', content: string, metadata?: any): void {
    const chatHistory = this.loadChatHistory();
    const newEntry: ChatHistoryEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      role,
      content,
      metadata
    };

    chatHistory.push(newEntry);
    this.saveFile('chatHistory.json', 'json', JSON.stringify(chatHistory, null, 2));
  }

  loadChatHistory(): ChatHistoryEntry[] {
    const file = this.files.get('chatHistory.json');
    if (!file) return [];

    try {
      return JSON.parse(file.content);
    } catch (error) {
      console.error('Failed to parse chat history:', error);
      return [];
    }
  }

  // Changelog Management
  logChange(component: string, action: string, details: string): void {
    const changelog = this.loadChangelog();
    const timestamp = new Date().toISOString().split('T')[0];
    const entry = `- [${timestamp}] ${action} component "${component}": ${details}`;
    
    changelog.push(entry);
    this.saveFile('changelog.md', 'md', changelog.join('\n'));
  }

  private loadChangelog(): string[] {
    const file = this.files.get('changelog.md');
    if (!file) return ['# Project Changelog\n'];

    return file.content.split('\n').filter(line => line.trim());
  }

  // File Management
  saveFile(fileName: string, type: ProjectFile['type'], content: string): void {
    this.files.set(fileName, {
      name: fileName,
      type,
      content,
      lastModified: new Date()
    });
  }

  getFile(fileName: string): ProjectFile | null {
    return this.files.get(fileName) || null;
  }

  getAllFiles(): ProjectFile[] {
    return Array.from(this.files.values());
  }

  // Initialize project structure
  initializeProject(htmlContent: string, cssContent: string = '', jsContent: string = ''): void {
    // Save main files
    this.saveFile('index.html', 'html', htmlContent);
    this.saveFile('style.css', 'css', cssContent);
    this.saveFile('script.js', 'js', jsContent);

    // Create component map and design tokens
    this.createComponentMap(htmlContent);
    this.extractDesignTokens(cssContent);

    // Initialize chat history
    this.saveFile('chatHistory.json', 'json', JSON.stringify([], null, 2));

    // Initialize changelog
    this.saveFile('changelog.md', 'md', '# Project Changelog\n\nThis file tracks all changes made to the project.\n');

    // Create README with AI editing instructions
    const readmeContent = `# AI-Powered Website Editor

## Project Structure
- \`index.html\` - Main website page
- \`style.css\` - Global styles and design system
- \`script.js\` - Interactive functionality
- \`componentMap.json\` - Maps all editable components
- \`design.json\` - Design tokens (colors, fonts, spacing)
- \`chatHistory.json\` - Conversation history with AI
- \`changelog.md\` - Log of all changes made

## AI Editing Commands
The AI can make precise edits to specific components without affecting the rest of your website.

### Example Commands:
- "Make the subscribe button larger and red"
- "Change the header background to blue"
- "Update the hero title text to 'Welcome to My Channel'"
- "Add a highlight effect to the navigation menu"

### Component Types:
- **Header**: Logo, navigation, branding
- **Hero**: Main title, subtitle, call-to-action
- **Videos**: Video gallery, thumbnails
- **Footer**: Contact info, social links
- **Buttons**: Subscribe, video links, CTAs

The AI will only modify the specific component you mention while preserving all other design and functionality.
`;

    this.saveFile('README.md', 'md', readmeContent);
  }

  // Export project files for download/backup
  exportProject(): { [fileName: string]: string } {
    const exported: { [fileName: string]: string } = {};
    
    this.files.forEach((file, fileName) => {
      exported[fileName] = file.content;
    });

    return exported;
  }

  // Import project files
  importProject(files: { [fileName: string]: string }): void {
    Object.entries(files).forEach(([fileName, content]) => {
      const type = this.getFileType(fileName);
      this.saveFile(fileName, type, content);
    });
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
}

// Create singleton instance for use across the app
export const projectFileManager = (projectId: string) => new ProjectFileManager(projectId);
