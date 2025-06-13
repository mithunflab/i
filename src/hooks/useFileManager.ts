
import { useState, useCallback } from 'react';
import { useGitHubIntegration } from './useGitHubIntegration';
import { supabase } from '@/integrations/supabase/client';

interface FileData {
  path: string;
  content: string;
  type: 'javascript' | 'json' | 'markdown' | 'html' | 'css' | 'text';
  lastModified: Date;
}

interface ProjectFiles {
  'intentParser.js': string;
  'aiEditor.js': string;
  'componentMap.json': string;
  'design.json': string;
  'changelog.md': string;
  'chatHistory.txt': string;
  'ytdata.json': string;
  'index.html': string;
  'styles.css': string;
  'scripts.js': string;
}

export const useFileManager = () => {
  const [files, setFiles] = useState<ProjectFiles>({} as ProjectFiles);
  const [loading, setLoading] = useState(false);
  const { updateGitHubRepo } = useGitHubIntegration();

  const initializeProjectFiles = useCallback(async (projectId: string, channelData: any) => {
    setLoading(true);
    try {
      const initialFiles: ProjectFiles = {
        'intentParser.js': generateIntentParserCode(),
        'aiEditor.js': generateAiEditorCode(),
        'componentMap.json': JSON.stringify({
          components: [],
          relationships: {},
          lastUpdated: new Date().toISOString()
        }, null, 2),
        'design.json': JSON.stringify({
          colorScheme: {
            primary: '#FF0000',
            secondary: '#000000',
            accent: '#FFFFFF'
          },
          typography: {
            primaryFont: 'Arial, sans-serif',
            headingFont: 'Arial, sans-serif'
          },
          spacing: {
            small: '8px',
            medium: '16px',
            large: '32px'
          },
          components: {},
          lastUpdated: new Date().toISOString()
        }, null, 2),
        'changelog.md': '# Project Changelog\n\n## Initial Setup\n- Project created\n- AI workflow initialized\n',
        'chatHistory.txt': '=== Chat History ===\nProject initialized\n\n',
        'ytdata.json': JSON.stringify(channelData || {}, null, 2),
        'index.html': generateInitialHTML(channelData),
        'styles.css': generateInitialCSS(),
        'scripts.js': generateInitialJS()
      };

      setFiles(initialFiles);
      console.log('✅ Project files initialized');
      return initialFiles;
    } catch (error) {
      console.error('❌ Error initializing files:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFile = useCallback(async (fileName: keyof ProjectFiles, content: string, projectId?: string) => {
    setFiles(prev => ({
      ...prev,
      [fileName]: content
    }));

    // Update changelog
    const timestamp = new Date().toISOString();
    const changelogEntry = `\n## ${timestamp}\n- Updated ${fileName}\n`;
    
    setFiles(prev => ({
      ...prev,
      'changelog.md': prev['changelog.md'] + changelogEntry
    }));

    console.log(`📝 File updated: ${fileName}`);
  }, []);

  const syncToGitHub = useCallback(async (repoUrl: string, files: ProjectFiles) => {
    if (!repoUrl) return;

    try {
      const fileChanges = Object.entries(files).map(([path, content]) => ({
        path,
        content,
        action: 'update' as const
      }));

      await updateGitHubRepo(repoUrl, fileChanges);
      console.log('🔄 Files synced to GitHub');
    } catch (error) {
      console.error('❌ GitHub sync error:', error);
    }
  }, [updateGitHubRepo]);

  const loadFromGitHub = useCallback(async (repoUrl: string): Promise<ProjectFiles | null> => {
    if (!repoUrl) return null;

    try {
      // This would fetch files from GitHub API
      // For now, return null to use existing files
      return null;
    } catch (error) {
      console.error('❌ Error loading from GitHub:', error);
      return null;
    }
  }, []);

  const appendToChatHistory = useCallback((message: string, role: 'user' | 'assistant') => {
    const timestamp = new Date().toISOString();
    const chatEntry = `[${timestamp}] ${role.toUpperCase()}: ${message}\n\n`;
    
    setFiles(prev => ({
      ...prev,
      'chatHistory.txt': prev['chatHistory.txt'] + chatEntry
    }));
  }, []);

  return {
    files,
    loading,
    initializeProjectFiles,
    updateFile,
    syncToGitHub,
    loadFromGitHub,
    appendToChatHistory
  };
};

const generateIntentParserCode = () => `
// AI Intent Parser - Stage 1 of AI Workflow
class IntentParser {
  constructor() {
    this.patterns = {
      elementSelectors: {
        'hero': ['.hero', 'header', 'h1', '.main-title'],
        'navigation': ['.nav', '.navbar', 'nav', '.menu'],
        'video-gallery': ['.video-gallery', '.videos', '.content'],
        'stats': ['.stats', '.statistics', '.numbers'],
        'footer': ['.footer', 'footer'],
        'button': ['.btn', '.button', 'button'],
        'text': ['p', '.description', '.text']
      }
    };
  }

  parseIntent(userMessage) {
    console.log('🎯 Parsing user intent:', userMessage);
    
    const intent = {
      action: this.extractAction(userMessage),
      target: this.extractTarget(userMessage),
      content: this.extractContent(userMessage),
      preserveDesign: true,
      scope: this.determineScope(userMessage)
    };

    console.log('📝 Parsed intent:', intent);
    return intent;
  }

  extractAction(message) {
    const actionMap = {
      'change': ['change', 'update', 'modify', 'edit'],
      'add': ['add', 'insert', 'include', 'create'],
      'remove': ['remove', 'delete', 'hide'],
      'style': ['color', 'style', 'design', 'theme']
    };

    for (const [action, keywords] of Object.entries(actionMap)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return action;
      }
    }
    return 'change';
  }

  extractTarget(message) {
    const msg = message.toLowerCase();
    
    for (const [component, selectors] of Object.entries(this.patterns.elementSelectors)) {
      if (selectors.some(selector => msg.includes(selector.replace('.', '').replace('#', '')))) {
        return {
          component,
          selectors: selectors,
          specific: this.extractSpecificTarget(message)
        };
      }
    }

    return {
      component: 'general',
      selectors: ['body'],
      specific: null
    };
  }

  extractContent(message) {
    // Extract quoted content or content after "to"
    const quotedMatch = message.match(/["']([^"']+)["']/);
    if (quotedMatch) return quotedMatch[1];

    const toMatch = message.match(/to (.+?)(?:$|\\.|,)/i);
    if (toMatch) return toMatch[1].trim();

    return null;
  }

  extractSpecificTarget(message) {
    const specificPatterns = [
      /title|heading|h1|h2/i,
      /button|btn/i,
      /text|content|description/i,
      /color|background|style/i
    ];

    for (const pattern of specificPatterns) {
      if (pattern.test(message)) {
        return pattern.source.split('|')[0];
      }
    }
    return null;
  }

  determineScope(message) {
    if (message.includes('entire') || message.includes('whole')) return 'section';
    if (message.includes('word') || message.includes('text')) return 'minimal';
    return 'component';
  }
}

// Export for use in AI workflow
window.IntentParser = IntentParser;
`;

const generateAiEditorCode = () => `
// AI Editor - Stage 2 of AI Workflow  
class AIEditor {
  constructor() {
    this.originalStyles = new Map();
    this.changeLog = [];
  }

  applyEdit(intent, currentHTML) {
    console.log('🔧 Applying targeted edit:', intent);
    
    // Parse HTML string to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHTML, 'text/html');
    
    try {
      switch (intent.action) {
        case 'change':
          this.changeContent(doc, intent);
          break;
        case 'add':
          this.addContent(doc, intent);
          break;
        case 'remove':
          this.removeContent(doc, intent);
          break;
        case 'style':
          this.styleContent(doc, intent);
          break;
        default:
          this.changeContent(doc, intent);
      }

      // Return modified HTML
      const modifiedHTML = doc.documentElement.outerHTML;
      this.logChange(intent);
      
      console.log('✅ Edit applied successfully');
      return modifiedHTML;
      
    } catch (error) {
      console.error('❌ Error applying edit:', error);
      return currentHTML; // Return original if edit fails
    }
  }

  changeContent(doc, intent) {
    const targets = this.findTargets(doc, intent.target);
    
    targets.forEach(element => {
      if (intent.content) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.value = intent.content;
        } else {
          // Preserve existing styling and structure
          const existingClasses = element.className;
          const existingStyles = element.style.cssText;
          
          element.textContent = intent.content;
          
          // Restore styling
          element.className = existingClasses;
          element.style.cssText = existingStyles;
        }
      }
    });
  }

  addContent(doc, intent) {
    const targets = this.findTargets(doc, intent.target);
    
    targets.forEach(element => {
      if (intent.content) {
        const newElement = doc.createElement('div');
        newElement.textContent = intent.content;
        newElement.className = 'ai-added-content';
        element.appendChild(newElement);
      }
    });
  }

  removeContent(doc, intent) {
    const targets = this.findTargets(doc, intent.target);
    
    targets.forEach(element => {
      if (intent.scope === 'minimal') {
        element.textContent = '';
      } else {
        element.remove();
      }
    });
  }

  styleContent(doc, intent) {
    const targets = this.findTargets(doc, intent.target);
    
    targets.forEach(element => {
      // Store original styles before changing
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, element.style.cssText);
      }
      
      // Apply new styles while preserving layout
      if (intent.content && intent.content.includes('color')) {
        element.style.color = this.extractColor(intent.content);
      }
    });
  }

  findTargets(doc, target) {
    const elements = [];
    
    for (const selector of target.selectors) {
      try {
        const found = doc.querySelectorAll(selector);
        elements.push(...Array.from(found));
      } catch (e) {
        console.warn('Invalid selector:', selector);
      }
    }
    
    return elements.filter((el, index, arr) => arr.indexOf(el) === index); // Remove duplicates
  }

  extractColor(content) {
    const colorPatterns = [
      /#([0-9A-F]{6}|[0-9A-F]{3})/i,
      /rgb\\(\\s*\\d+\\s*,\\s*\\d+\\s*,\\s*\\d+\\s*\\)/i,
      /(red|blue|green|yellow|purple|orange|pink|black|white|gray)/i
    ];
    
    for (const pattern of colorPatterns) {
      const match = content.match(pattern);
      if (match) return match[0];
    }
    
    return null;
  }

  logChange(intent) {
    const change = {
      timestamp: new Date().toISOString(),
      action: intent.action,
      target: intent.target.component,
      content: intent.content,
      scope: intent.scope
    };
    
    this.changeLog.push(change);
  }

  getChangeLog() {
    return this.changeLog;
  }
}

// Export for use in AI workflow
window.AIEditor = AIEditor;
`;

const generateInitialHTML = (channelData: any) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'AI Website Builder'}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <nav class="navbar">
            <div class="nav-brand">
                ${channelData?.thumbnail ? `<img src="${channelData.thumbnail}" alt="Channel Logo" class="logo">` : ''}
                <span class="brand-name">${channelData?.title || 'Website'}</span>
            </div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#videos">Videos</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <main>
        <section class="hero" id="home">
            <div class="hero-content">
                <h1 class="hero-title">${channelData?.title || 'Welcome to Our Website'}</h1>
                <p class="hero-description">${channelData?.description?.substring(0, 200) || 'Professional website built with AI'}...</p>
                <div class="hero-stats">
                    <div class="stat">
                        <span class="stat-number">${parseInt(channelData?.subscriberCount || '0').toLocaleString()}</span>
                        <span class="stat-label">Subscribers</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${parseInt(channelData?.videoCount || '0').toLocaleString()}</span>
                        <span class="stat-label">Videos</span>
                    </div>
                </div>
                <button class="cta-button">Subscribe Now</button>
            </div>
        </section>

        <section class="video-gallery" id="videos">
            <h2>Latest Videos</h2>
            <div class="videos-grid">
                ${channelData?.videos?.slice(0, 6).map((video: any) => `
                    <div class="video-card">
                        <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                        <div class="video-info">
                            <h3 class="video-title">${video.title}</h3>
                            <p class="video-views">${parseInt(video.viewCount).toLocaleString()} views</p>
                        </div>
                    </div>
                `).join('') || '<p>No videos available</p>'}
            </div>
        </section>
    </main>

    <footer class="footer">
        <p>&copy; 2025 ${channelData?.title || 'Website'}. Built with AI.</p>
    </footer>

    <script src="scripts.js"></script>
</body>
</html>
`;

const generateInitialCSS = () => `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
}

.header {
    background: #000;
    color: white;
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.navbar {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo {
    width: 40px;
    height: 40px;
    border-radius: 50%;
}

.brand-name {
    font-size: 1.5rem;
    font-weight: bold;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: #FF0000;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 4rem 2rem;
    text-align: center;
}

.hero-content {
    max-width: 800px;
    margin: 0 auto;
}

.hero-title {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero-description {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
}

.hero-stats {
    display: flex;
    justify-content: center;
    gap: 3rem;
    margin-bottom: 2rem;
}

.stat {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 2rem;
    font-weight: bold;
}

.stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
}

.cta-button {
    background: #FF0000;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

.cta-button:hover {
    background: #cc0000;
}

.video-gallery {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.video-gallery h2 {
    text-align: center;
    margin-bottom: 3rem;
    font-size: 2.5rem;
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.video-card {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s;
}

.video-card:hover {
    transform: translateY(-5px);
}

.video-thumbnail {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.video-info {
    padding: 1rem;
}

.video-title {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    line-height: 1.3;
}

.video-views {
    color: #666;
    font-size: 0.9rem;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem;
}

@media (max-width: 768px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .hero-stats {
        flex-direction: column;
        gap: 1rem;
    }
    
    .videos-grid {
        grid-template-columns: 1fr;
    }
    
    .nav-menu {
        display: none;
    }
}
`;

const generateInitialJS = () => `
// AI-Enhanced Website Functionality
class WebsiteManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAIComponents();
        console.log('🚀 Website initialized with AI components');
    }

    setupEventListeners() {
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Video card interactions
        document.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', this.handleVideoClick.bind(this));
        });

        // CTA button interaction
        document.querySelector('.cta-button')?.addEventListener('click', this.handleSubscribe.bind(this));
    }

    loadAIComponents() {
        // Load AI Parser and Editor if available
        if (window.IntentParser && window.AIEditor) {
            this.parser = new window.IntentParser();
            this.editor = new window.AIEditor();
            console.log('🤖 AI components loaded');
        }
    }

    handleVideoClick(event) {
        const card = event.currentTarget;
        const title = card.querySelector('.video-title')?.textContent;
        console.log('🎥 Video clicked:', title);
        
        // Here you could open video in modal or redirect to YouTube
        // For now, just log the interaction
    }

    handleSubscribe() {
        console.log('🔔 Subscribe button clicked');
        // Here you could open YouTube channel or show subscription modal
        window.open('https://youtube.com/@chitti_tamil', '_blank');
    }

    // Method to apply AI edits in real-time
    applyAIEdit(userRequest) {
        if (!this.parser || !this.editor) {
            console.warn('AI components not loaded');
            return;
        }

        const intent = this.parser.parseIntent(userRequest);
        const currentHTML = document.documentElement.outerHTML;
        const modifiedHTML = this.editor.applyEdit(intent, currentHTML);
        
        // In a real implementation, this would update the DOM
        console.log('🎯 AI edit applied:', intent);
        return modifiedHTML;
    }
}

// Initialize website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.websiteManager = new WebsiteManager();
});
`;
