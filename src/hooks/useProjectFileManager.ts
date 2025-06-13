
import { useState, useCallback } from 'react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

interface YouTubeData {
  title: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  videos: Array<{
    title: string;
    thumbnail: string;
    url: string;
    views: string;
    publishedAt: string;
  }>;
}

export const useProjectFileManager = () => {
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([
    {
      name: 'index.html',
      type: 'file',
      extension: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Website</h1>
        <p>This is a basic website structure.</p>
    </div>
    <script src="script.js"></script>
</body>
</html>`
    },
    {
      name: 'style.css',
      type: 'file',
      extension: 'css',
      content: `/* Main Styles */
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
    color: #333;
    text-align: center;
    margin-bottom: 20px;
}

p {
    line-height: 1.6;
    color: #666;
}`
    },
    {
      name: 'script.js',
      type: 'file',
      extension: 'js',
      content: `// Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully!');
    
    // Add any interactive functionality here
    const container = document.querySelector('.container');
    if (container) {
        container.addEventListener('click', function() {
            console.log('Container clicked!');
        });
    }
});`
    },
    {
      name: 'interpreter.js',
      type: 'file',
      extension: 'js',
      content: `// AI Command Interpreter
class AIInterpreter {
    constructor() {
        this.commands = new Map();
        this.initializeCommands();
    }
    
    initializeCommands() {
        this.commands.set('create', this.createElement.bind(this));
        this.commands.set('modify', this.modifyElement.bind(this));
        this.commands.set('style', this.styleElement.bind(this));
    }
    
    interpret(command, target, params) {
        if (this.commands.has(command)) {
            return this.commands.get(command)(target, params);
        }
        return null;
    }
    
    createElement(target, params) {
        // Create new HTML element
        console.log('Creating element:', target, params);
    }
    
    modifyElement(target, params) {
        // Modify existing element
        console.log('Modifying element:', target, params);
    }
    
    styleElement(target, params) {
        // Apply styles to element
        console.log('Styling element:', target, params);
    }
}

const interpreter = new AIInterpreter();`
    },
    {
      name: 'aieditor.js',
      type: 'file',
      extension: 'js',
      content: `// AI Editor Core
class AIEditor {
    constructor() {
        this.history = [];
        this.currentState = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('aiCommand', this.handleAICommand.bind(this));
    }
    
    handleAICommand(event) {
        const { command, target, params } = event.detail;
        this.executeCommand(command, target, params);
    }
    
    executeCommand(command, target, params) {
        // Save current state
        this.saveState();
        
        // Execute command
        try {
            const result = interpreter.interpret(command, target, params);
            this.updateHistory(command, target, params, result);
            return result;
        } catch (error) {
            console.error('AI Editor Error:', error);
            this.restoreState();
        }
    }
    
    saveState() {
        this.currentState = document.documentElement.outerHTML;
    }
    
    restoreState() {
        if (this.currentState) {
            document.documentElement.innerHTML = this.currentState;
        }
    }
    
    updateHistory(command, target, params, result) {
        this.history.push({
            timestamp: new Date(),
            command,
            target,
            params,
            result,
            success: result !== null
        });
    }
}

const aiEditor = new AIEditor();`
    },
    {
      name: 'componentmap.js',
      type: 'file',
      extension: 'js',
      content: `// Component Mapping System
class ComponentMapper {
    constructor() {
        this.components = new Map();
        this.scanComponents();
    }
    
    scanComponents() {
        // Scan DOM for components
        const elements = document.querySelectorAll('[id], [class]');
        elements.forEach(element => {
            const id = element.id || element.className.split(' ')[0];
            this.components.set(id, {
                element: element,
                type: this.getComponentType(element),
                properties: this.extractProperties(element)
            });
        });
    }
    
    getComponentType(element) {
        const tag = element.tagName.toLowerCase();
        const classes = element.className.toLowerCase();
        
        if (tag === 'header' || classes.includes('header')) return 'header';
        if (tag === 'nav' || classes.includes('nav')) return 'navigation';
        if (tag === 'footer' || classes.includes('footer')) return 'footer';
        if (tag === 'button' || classes.includes('btn')) return 'button';
        if (classes.includes('hero')) return 'hero';
        if (classes.includes('video')) return 'video';
        
        return 'content';
    }
    
    extractProperties(element) {
        return {
            tag: element.tagName.toLowerCase(),
            id: element.id,
            classes: element.className.split(' '),
            text: element.textContent?.trim() || '',
            style: element.style.cssText
        };
    }
    
    getComponent(id) {
        return this.components.get(id);
    }
    
    updateComponent(id, changes) {
        const component = this.components.get(id);
        if (component) {
            Object.assign(component.properties, changes);
            this.applyChanges(component);
        }
    }
    
    applyChanges(component) {
        const element = component.element;
        const props = component.properties;
        
        if (props.text) element.textContent = props.text;
        if (props.style) element.style.cssText = props.style;
        if (props.classes) element.className = props.classes.join(' ');
    }
}

const componentMapper = new ComponentMapper();`
    },
    {
      name: 'design.json',
      type: 'file',
      extension: 'json',
      content: `{
  "version": "1.0.0",
  "theme": {
    "name": "Default Theme",
    "colors": {
      "primary": "#007bff",
      "secondary": "#6c757d",
      "success": "#28a745",
      "danger": "#dc3545",
      "warning": "#ffc107",
      "info": "#17a2b8",
      "light": "#f8f9fa",
      "dark": "#343a40"
    },
    "typography": {
      "fontFamily": "Arial, sans-serif",
      "baseFontSize": "16px",
      "headingFontWeight": "bold",
      "bodyLineHeight": "1.6"
    },
    "spacing": {
      "base": "16px",
      "small": "8px",
      "large": "32px"
    },
    "layout": {
      "maxWidth": "1200px",
      "borderRadius": "8px",
      "boxShadow": "0 2px 10px rgba(0,0,0,0.1)"
    }
  },
  "components": {
    "button": {
      "padding": "10px 20px",
      "borderRadius": "4px",
      "border": "none",
      "cursor": "pointer"
    },
    "card": {
      "padding": "20px",
      "borderRadius": "8px",
      "backgroundColor": "white",
      "boxShadow": "0 2px 4px rgba(0,0,0,0.1)"
    }
  }
}`
    },
    {
      name: 'changelog.md',
      type: 'file',
      extension: 'md',
      content: `# Changelog

## Version 1.0.0 - Initial Release

### Added
- Basic HTML structure with semantic elements
- CSS styling with responsive design
- JavaScript interactivity
- AI Editor system for dynamic content generation
- Component mapping for targeted edits
- Design system configuration

### Features
- Clean, modern design
- Mobile-responsive layout
- Interactive elements
- AI-powered content editing
- Component-based architecture

### Technical Details
- HTML5 semantic structure
- CSS3 with flexbox/grid support
- ES6+ JavaScript features
- Modular component system
- JSON-based configuration

---

*This changelog tracks all notable changes to the project.*`
    },
    {
      name: 'readme.md',
      type: 'file',
      extension: 'md',
      content: `# AI-Powered Website Project

## Overview
This project is an AI-enhanced website that uses intelligent editing capabilities to create and modify content dynamically.

## File Structure
- \`index.html\` - Main website page
- \`style.css\` - Global styles and design system
- \`script.js\` - Core JavaScript functionality
- \`interpreter.js\` - AI command interpretation system
- \`aieditor.js\` - AI editing engine
- \`componentmap.js\` - Component mapping and targeting
- \`design.json\` - Design system configuration
- \`changelog.md\` - Project change history
- \`projectchat\` - AI conversation history
- \`yticon\` - YouTube integration data

## Features
- **AI-Powered Editing**: Intelligent content modification
- **Component Targeting**: Precise element selection and editing
- **Design System**: Consistent styling and theming
- **Responsive Design**: Mobile-first approach
- **YouTube Integration**: Dynamic channel data fetching

## AI Commands
The AI editor supports various commands:
- "Create a button" - Generates new interactive elements
- "Change the header color" - Modifies existing components
- "Add a video gallery" - Inserts new content sections
- "Make it mobile-friendly" - Applies responsive design

## Getting Started
1. Open \`index.html\` in a web browser
2. Use the AI chat to request modifications
3. Watch as changes are applied in real-time
4. Check the component map for available targets

## Technical Architecture
- **Modular Design**: Each file serves a specific purpose
- **Event-Driven**: Uses custom events for AI communication
- **State Management**: Maintains editing history and rollback capability
- **Component System**: Maps DOM elements to editable components

---

*Built with AI assistance for dynamic web development*`
    },
    {
      name: 'projectchat',
      type: 'file',
      extension: 'json',
      content: `{
  "version": "1.0.0",
  "chatHistory": [],
  "settings": {
    "aiModel": "basic",
    "autoSave": true,
    "realTimePreview": true
  },
  "metadata": {
    "created": "${new Date().toISOString()}",
    "lastModified": "${new Date().toISOString()}",
    "totalMessages": 0
  }
}`
    },
    {
      name: 'yticon',
      type: 'file',
      extension: 'json',
      content: `{
  "version": "1.0.0",
  "youtubeData": null,
  "settings": {
    "autoFetch": false,
    "updateInterval": 3600000
  },
  "cache": {
    "lastFetched": null,
    "data": null
  },
  "metadata": {
    "created": "${new Date().toISOString()}",
    "apiCalls": 0
  }
}`
    }
  ]);

  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);

  const updateFileContent = useCallback((fileName: string, newContent: string) => {
    setProjectFiles(prev => prev.map(file => 
      file.name === fileName 
        ? { ...file, content: newContent }
        : file
    ));
  }, []);

  const fetchYouTubeData = useCallback(async (youtubeUrl: string) => {
    try {
      // Mock YouTube data for now - in real implementation, this would call YouTube API
      const mockData: YouTubeData = {
        title: "Sample YouTube Channel",
        thumbnail: "/api/placeholder/150/150",
        subscriberCount: "10000",
        videoCount: "50",
        videos: [
          {
            title: "Latest Video",
            thumbnail: "/api/placeholder/320/180",
            url: "https://youtube.com/watch?v=example1",
            views: "1000",
            publishedAt: new Date().toISOString()
          },
          {
            title: "Popular Video",
            thumbnail: "/api/placeholder/320/180",
            url: "https://youtube.com/watch?v=example2",
            views: "5000",
            publishedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      };

      setYoutubeData(mockData);
      
      // Update yticon file
      const ytIconContent = {
        version: "1.0.0",
        youtubeData: mockData,
        settings: {
          autoFetch: false,
          updateInterval: 3600000
        },
        cache: {
          lastFetched: new Date().toISOString(),
          data: mockData
        },
        metadata: {
          created: new Date().toISOString(),
          apiCalls: 1
        }
      };

      updateFileContent('yticon', JSON.stringify(ytIconContent, null, 2));
      
      return mockData;
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      throw error;
    }
  }, [updateFileContent]);

  const getFileByName = useCallback((fileName: string) => {
    return projectFiles.find(file => file.name === fileName);
  }, [projectFiles]);

  const generateWebsiteCode = useCallback((channelData?: any) => {
    const htmlFile = getFileByName('index.html');
    const cssFile = getFileByName('style.css');
    const jsFile = getFileByName('script.js');

    if (!htmlFile || !cssFile || !jsFile) return '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'My Website'}</title>
    <style>
${cssFile.content}
    </style>
</head>
<body>
    <div class="container">
        <h1>${channelData?.title || 'Welcome to My Website'}</h1>
        ${channelData ? `
        <div class="channel-info">
            <img src="${channelData.thumbnail}" alt="Channel Logo" style="width: 100px; height: 100px; border-radius: 50%;">
            <p>Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}</p>
            <p>Videos: ${parseInt(channelData.videoCount || '0').toLocaleString()}</p>
        </div>
        ` : ''}
        <p>This website was generated using AI assistance.</p>
    </div>
    <script>
${jsFile.content}
    </script>
</body>
</html>`;
  }, [getFileByName]);

  return {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    getFileByName,
    generateWebsiteCode
  };
};
