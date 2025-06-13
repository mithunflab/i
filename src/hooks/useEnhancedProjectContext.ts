
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectFileStructure {
  'index.html': string;
  'styles.css': string;
  'scripts.js': string;
  'README.md': string;
  'chathistory.txt': string;
  'channellog.md': string;
  'interparser.js': string;
  'aieditor.js': string;
  'componentmap.json': string;
  'design.json': string;
}

interface EnhancedProjectContext {
  id: string;
  name: string;
  description: string;
  files: ProjectFileStructure;
  channelData: any;
  chatHistory: any[];
  verified: boolean;
  githubUrl?: string;
  netlifyUrl?: string;
  lastModified: Date;
  isLoading: boolean;
}

export const useEnhancedProjectContext = (projectId: string, youtubeUrl: string, channelData: any) => {
  const [context, setContext] = useState<EnhancedProjectContext | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateFileStructure = useCallback((sourceCode: string, channelData: any, chatHistory: any[]) => {
    // Extract HTML structure
    const htmlMatch = sourceCode.match(/<html[\s\S]*<\/html>/i) || 
                     sourceCode.match(/<body[\s\S]*<\/body>/i) || 
                     sourceCode.match(/<div[\s\S]*<\/div>/i);
    
    const mainHtml = htmlMatch ? htmlMatch[0] : sourceCode;

    // Extract inline CSS
    const cssMatch = sourceCode.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    let extractedCSS = '';
    if (cssMatch) {
      extractedCSS = cssMatch.map(match => 
        match.replace(/<\/?style[^>]*>/gi, '')
      ).join('\n\n');
    }

    // Extract inline JavaScript
    const jsMatch = sourceCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    let extractedJS = '';
    if (jsMatch) {
      extractedJS = jsMatch.map(match => 
        match.replace(/<\/?script[^>]*>/gi, '')
      ).join('\n\n');
    }

    // Generate component map
    const componentMap = {
      components: extractComponentStructure(sourceCode),
      lastUpdated: new Date().toISOString(),
      totalComponents: 0
    };
    componentMap.totalComponents = componentMap.components.length;

    // Generate design system
    const designSystem = {
      colors: extractColors(sourceCode),
      typography: extractTypography(sourceCode),
      spacing: extractSpacing(sourceCode),
      components: componentMap.components,
      theme: detectTheme(sourceCode, channelData),
      lastUpdated: new Date().toISOString()
    };

    // Generate channel log
    const channelLog = generateChannelLog(channelData);

    // Format chat history
    const chatHistoryText = formatChatHistory(chatHistory);

    // Generate README
    const readme = generateReadme(channelData, componentMap, designSystem);

    return {
      'index.html': generateFullHTML(mainHtml, channelData),
      'styles.css': extractedCSS || generateDefaultCSS(channelData),
      'scripts.js': extractedJS || generateDefaultJS(channelData),
      'README.md': readme,
      'chathistory.txt': chatHistoryText,
      'channellog.md': channelLog,
      'interparser.js': generateInterpreterJS(),
      'aieditor.js': generateEditorJS(),
      'componentmap.json': JSON.stringify(componentMap, null, 2),
      'design.json': JSON.stringify(designSystem, null, 2)
    };
  }, []);

  const loadProjectContext = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);

      // Load project from database
      const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (project) {
        // Load chat history
        const { data: chatHistory } = await supabase
          .from('project_chat_history')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true });

        // Generate file structure
        const files = generateFileStructure(
          project.source_code || '',
          project.channel_data || channelData,
          chatHistory || []
        );

        setContext({
          id: project.id,
          name: project.name,
          description: project.description,
          files,
          channelData: project.channel_data || channelData,
          chatHistory: chatHistory || [],
          verified: project.verified || false,
          githubUrl: project.github_url,
          netlifyUrl: project.netlify_url,
          lastModified: new Date(project.updated_at),
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error loading enhanced project context:', error);
      toast({
        title: "Error",
        description: "Failed to load project context",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, projectId, channelData, generateFileStructure, toast]);

  const updateProjectFiles = useCallback(async (updates: Partial<ProjectFileStructure>) => {
    if (!context) return;

    const updatedFiles = { ...context.files, ...updates };
    const updatedContext = { 
      ...context, 
      files: updatedFiles, 
      lastModified: new Date() 
    };
    
    setContext(updatedContext);

    // Save source code back to database
    try {
      await supabase
        .from('projects')
        .update({
          source_code: updatedFiles['index.html'],
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
    } catch (error) {
      console.error('Error updating project files:', error);
    }
  }, [context, projectId]);

  // Helper functions
  const extractComponentStructure = (sourceCode: string) => {
    const components = [];
    const componentMatches = sourceCode.match(/<(\w+)[^>]*class="([^"]*)"[^>]*>/g) || [];
    
    componentMatches.forEach((match, index) => {
      const tagMatch = match.match(/<(\w+)/);
      const classMatch = match.match(/class="([^"]*)"/);
      const idMatch = match.match(/id="([^"]*)"/);
      
      if (tagMatch) {
        components.push({
          id: `component-${index}`,
          tag: tagMatch[1],
          classes: classMatch ? classMatch[1].split(' ') : [],
          id: idMatch ? idMatch[1] : null,
          type: inferComponentType(tagMatch[1], classMatch ? classMatch[1] : ''),
          location: `Line ${index + 1}`
        });
      }
    });

    return components;
  };

  const extractColors = (sourceCode: string) => {
    const colors = new Set();
    const colorMatches = sourceCode.match(/(#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\))/g) || [];
    colorMatches.forEach(color => colors.add(color));
    return Array.from(colors);
  };

  const extractTypography = (sourceCode: string) => {
    const fontMatches = sourceCode.match(/font-family:\s*([^;]+)/g) || [];
    const sizeMatches = sourceCode.match(/font-size:\s*([^;]+)/g) || [];
    
    return {
      fonts: fontMatches.map(match => match.replace('font-family:', '').trim()),
      sizes: sizeMatches.map(match => match.replace('font-size:', '').trim())
    };
  };

  const extractSpacing = (sourceCode: string) => {
    const spacingMatches = sourceCode.match(/(margin|padding):\s*([^;]+)/g) || [];
    return spacingMatches.map(match => match.trim());
  };

  const detectTheme = (sourceCode: string, channelData: any) => {
    const isDark = sourceCode.includes('bg-black') || sourceCode.includes('dark') || sourceCode.includes('#000');
    return {
      mode: isDark ? 'dark' : 'light',
      primary: channelData?.brandingSettings?.channel?.defaultTab || '#FF0000',
      accent: '#FF4444',
      background: isDark ? '#000000' : '#FFFFFF'
    };
  };

  const generateChannelLog = (channelData: any) => {
    if (!channelData) return '# Channel Log\n\nNo channel data available.';

    const log = {
      channel: {
        id: channelData.id,
        title: channelData.title,
        description: channelData.description,
        thumbnail: channelData.thumbnail,
        subscriberCount: channelData.subscriberCount,
        videoCount: channelData.videoCount,
        viewCount: channelData.viewCount,
        customUrl: channelData.customUrl
      },
      videos: channelData.videos?.map((video: any) => ({
        id: video.id?.videoId,
        title: video.snippet?.title,
        description: video.snippet?.description,
        thumbnail: video.snippet?.thumbnails?.high?.url,
        publishedAt: video.snippet?.publishedAt
      })) || [],
      lastUpdated: new Date().toISOString(),
      metadata: {
        totalVideos: channelData.videos?.length || 0,
        dataSource: 'YouTube API v3',
        fetchedAt: new Date().toISOString()
      }
    };

    return `# Channel Data Log

## Channel Information
- **ID**: ${log.channel.id}
- **Title**: ${log.channel.title}
- **Subscribers**: ${parseInt(log.channel.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(log.channel.videoCount || '0').toLocaleString()}
- **Views**: ${parseInt(log.channel.viewCount || '0').toLocaleString()}
- **Custom URL**: ${log.channel.customUrl}

## Recent Videos
${log.videos.slice(0, 5).map((video: any, index: number) => 
  `### ${index + 1}. ${video.title}
- **Video ID**: ${video.id}
- **Published**: ${new Date(video.publishedAt).toLocaleDateString()}
- **Thumbnail**: ${video.thumbnail}
`).join('\n')}

## Metadata
- **Last Updated**: ${log.lastUpdated}
- **Total Videos Cached**: ${log.metadata.totalVideos}
- **Data Source**: ${log.metadata.dataSource}

---
*This file is automatically generated and updated by the AI system*
`;
  };

  const formatChatHistory = (chatHistory: any[]) => {
    if (!chatHistory || chatHistory.length === 0) {
      return 'Chat History\n==============\n\nNo chat messages yet.\n';
    }

    let formattedHistory = 'Chat History\n==============\n\n';
    
    chatHistory.forEach((message, index) => {
      const timestamp = new Date(message.created_at).toLocaleString();
      const sender = message.message_type === 'user' ? 'User' : 'AI Assistant';
      
      formattedHistory += `[${timestamp}] ${sender}:\n`;
      formattedHistory += `${message.content}\n\n`;
      
      if (index < chatHistory.length - 1) {
        formattedHistory += '---\n\n';
      }
    });

    formattedHistory += `\nTotal Messages: ${chatHistory.length}\n`;
    formattedHistory += `Last Updated: ${new Date().toLocaleString()}\n`;
    
    return formattedHistory;
  };

  const generateReadme = (channelData: any, componentMap: any, designSystem: any) => {
    return `# ${channelData?.title || 'YouTube Channel'} Website

## Project Overview
AI-generated website for **${channelData?.title || 'YouTube Channel'}** with real-time features and modern design.

### Channel Stats
- **Subscribers**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- **Views**: ${parseInt(channelData?.viewCount || '0').toLocaleString()}

## File Structure
\`\`\`
├── index.html          # Main website code
├── styles.css          # Extracted CSS styles
├── scripts.js          # JavaScript functionality
├── README.md           # This file
├── chathistory.txt     # All chat conversations
├── channellog.md       # YouTube channel data & metadata
├── interparser.js      # AI response interpretation
├── aieditor.js         # Live editing capabilities
├── componentmap.json   # Component structure mapping
└── design.json         # Design system & color schemes
\`\`\`

## Components
- **Total Components**: ${componentMap.totalComponents}
- **Last Updated**: ${componentMap.lastUpdated}

## Design System
- **Theme**: ${designSystem.theme?.mode || 'Light'}
- **Primary Color**: ${designSystem.theme?.primary || '#FF0000'}
- **Total Colors**: ${designSystem.colors?.length || 0}

## Features
✅ Responsive Design
✅ YouTube Integration
✅ Real-time Data
✅ AI-Generated Content
✅ GitHub Sync
✅ Live Deployment

## Development
This project was generated using AI and includes:
- Real-time YouTube data integration
- Automated file structure management
- Component mapping and design system
- Chat history preservation
- GitHub synchronization

---
*Generated by AI Website Builder - ${new Date().toLocaleDateString()}*
`;
  };

  const generateFullHTML = (mainHtml: string, channelData: any) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'YouTube Channel'} - Official Website</title>
    <meta name="description" content="${channelData?.description || 'AI-generated website with real-time features'}">
    <link rel="icon" href="${channelData?.thumbnail || ''}" type="image/png">
    <link href="styles.css" rel="stylesheet">
</head>
<body>
    ${mainHtml}
    <script src="scripts.js"></script>
    <script src="interparser.js"></script>
    <script src="aieditor.js"></script>
</body>
</html>`;
  };

  const generateDefaultCSS = (channelData: any) => {
    return `/* AI-Generated Styles for ${channelData?.title || 'YouTube Channel'} */

:root {
  --primary-color: #FF0000;
  --secondary-color: #FF4444;
  --background-color: #000000;
  --text-color: #FFFFFF;
  --accent-color: #FFD700;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 0 15px;
  }
}

/* Component Styles */
.hero {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  padding: 80px 0;
  text-align: center;
}

.button {
  background: var(--primary-color);
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button:hover {
  background: var(--secondary-color);
  transform: translateY(-2px);
}

/* Last updated: ${new Date().toISOString()} */
`;
  };

  const generateDefaultJS = (channelData: any) => {
    return `// AI-Generated JavaScript for ${channelData?.title || 'YouTube Channel'}

// Real-time data management
class YouTubeDataManager {
  constructor() {
    this.channelData = ${JSON.stringify(channelData, null, 2)};
    this.lastUpdated = new Date();
  }

  updateSubscriberCount() {
    // Real-time subscriber count updates would go here
    console.log('Updating subscriber count...');
  }

  loadLatestVideos() {
    // Load latest videos from API
    console.log('Loading latest videos...');
  }

  init() {
    this.updateSubscriberCount();
    this.loadLatestVideos();
    
    // Update every 5 minutes
    setInterval(() => {
      this.updateSubscriberCount();
    }, 300000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  const dataManager = new YouTubeDataManager();
  dataManager.init();
  
  console.log('${channelData?.title || 'YouTube Channel'} website initialized');
});

// Export for other modules
window.YouTubeDataManager = YouTubeDataManager;

/* Last updated: ${new Date().toISOString()} */
`;
  };

  const generateInterpreterJS = () => {
    return `// AI Response Interpreter
// Handles AI-generated content and live updates

class AIResponseInterpreter {
  constructor() {
    this.responses = [];
    this.isProcessing = false;
  }

  async processAIResponse(response) {
    this.isProcessing = true;
    
    try {
      // Parse AI response for different content types
      const parsedResponse = this.parseResponse(response);
      
      if (parsedResponse.type === 'code') {
        await this.updateCode(parsedResponse.content);
      } else if (parsedResponse.type === 'style') {
        await this.updateStyles(parsedResponse.content);
      } else if (parsedResponse.type === 'content') {
        await this.updateContent(parsedResponse.content);
      }
      
      this.responses.push({
        timestamp: new Date(),
        response: parsedResponse,
        status: 'processed'
      });
      
    } catch (error) {
      console.error('Error processing AI response:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  parseResponse(response) {
    // Detect response type and extract content
    if (response.includes('<html') || response.includes('<div')) {
      return { type: 'code', content: response };
    } else if (response.includes('css') || response.includes('style')) {
      return { type: 'style', content: response };
    } else {
      return { type: 'content', content: response };
    }
  }

  async updateCode(code) {
    // Live code updates
    console.log('Updating code:', code);
  }

  async updateStyles(styles) {
    // Live style updates
    console.log('Updating styles:', styles);
  }

  async updateContent(content) {
    // Live content updates
    console.log('Updating content:', content);
  }
}

// Initialize interpreter
window.aiInterpreter = new AIResponseInterpreter();

/* Generated: ${new Date().toISOString()} */
`;
  };

  const generateEditorJS = () => {
    return `// AI Editor - Live Editing Capabilities
// Provides real-time editing and component manipulation

class AIEditor {
  constructor() {
    this.components = new Map();
    this.editMode = false;
    this.changes = [];
  }

  enableEditMode() {
    this.editMode = true;
    this.addEditingHandlers();
    console.log('AI Editor mode enabled');
  }

  disableEditMode() {
    this.editMode = false;
    this.removeEditingHandlers();
    console.log('AI Editor mode disabled');
  }

  addEditingHandlers() {
    // Add live editing capabilities
    document.addEventListener('click', this.handleElementClick.bind(this));
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }

  removeEditingHandlers() {
    document.removeEventListener('click', this.handleElementClick.bind(this));
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
  }

  handleElementClick(event) {
    if (!this.editMode) return;
    
    event.preventDefault();
    const element = event.target;
    this.selectElement(element);
  }

  handleKeyPress(event) {
    if (!this.editMode) return;
    
    // Handle editing shortcuts
    if (event.ctrlKey && event.key === 'e') {
      event.preventDefault();
      this.toggleEditMode();
    }
  }

  selectElement(element) {
    // Highlight selected element
    const existing = document.querySelector('.ai-selected');
    if (existing) {
      existing.classList.remove('ai-selected');
    }
    
    element.classList.add('ai-selected');
    this.showElementEditor(element);
  }

  showElementEditor(element) {
    // Show editing interface for element
    console.log('Editing element:', element);
  }

  saveChanges() {
    // Save changes to file structure
    const timestamp = new Date().toISOString();
    const change = {
      timestamp,
      changes: this.changes,
      status: 'saved'
    };
    
    console.log('Saving changes:', change);
    this.changes = [];
  }
}

// Initialize editor
window.aiEditor = new AIEditor();

// Add CSS for editor
const editorStyles = \`
.ai-selected {
  outline: 2px solid #FF0000 !important;
  position: relative;
}

.ai-selected::after {
  content: 'AI Editing';
  position: absolute;
  top: -25px;
  left: 0;
  background: #FF0000;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 3px;
}
\`;

const styleSheet = document.createElement('style');
styleSheet.textContent = editorStyles;
document.head.appendChild(styleSheet);

/* Generated: ${new Date().toISOString()} */
`;
  };

  const inferComponentType = (tag: string, classes: string) => {
    if (classes.includes('hero')) return 'hero';
    if (classes.includes('nav') || tag === 'nav') return 'navigation';
    if (classes.includes('footer') || tag === 'footer') return 'footer';
    if (classes.includes('gallery') || classes.includes('video')) return 'video-gallery';
    if (classes.includes('stats') || classes.includes('counter')) return 'stats';
    if (classes.includes('cta') || classes.includes('button')) return 'call-to-action';
    return tag;
  };

  useEffect(() => {
    loadProjectContext();
  }, [loadProjectContext]);

  return {
    context,
    loading,
    updateProjectFiles,
    refreshContext: loadProjectContext,
    generateFileStructure
  };
};
