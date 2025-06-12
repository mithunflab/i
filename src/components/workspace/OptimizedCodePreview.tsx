
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye, EyeOff, FileText, Code2, Palette, Github, Globe } from 'lucide-react';

interface OptimizedCodePreviewProps {
  generatedCode?: string;
  isLiveTyping?: boolean;
  projectData?: any;
}

const OptimizedCodePreview: React.FC<OptimizedCodePreviewProps> = ({ 
  generatedCode, 
  isLiveTyping = false,
  projectData
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [typingProgress, setTypingProgress] = useState<number>(0);

  // Memoize parsed sections to prevent unnecessary recalculations
  const parsedSections = useMemo(() => {
    if (!generatedCode) {
      return {
        html: '',
        css: '',
        js: '',
        readme: ''
      };
    }

    const sections = {
      html: '',
      css: '',
      js: '',
      readme: ''
    };

    // Extract HTML section
    const htmlMatch = generatedCode.match(/<!-- START:HTML -->([\s\S]*?)<!-- END:HTML -->/);
    if (htmlMatch) {
      sections.html = htmlMatch[1].trim();
    } else {
      sections.html = generatedCode;
    }

    // Extract CSS section
    const cssMatch = generatedCode.match(/<!-- START:CSS -->([\s\S]*?)<!-- END:CSS -->/);
    if (cssMatch) {
      sections.css = cssMatch[1].replace(/<style>|<\/style>/g, '').trim();
    } else {
      // Extract CSS from style tags
      const styleMatch = generatedCode.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatch) {
        sections.css = styleMatch.map(match => 
          match.replace(/<\/?style[^>]*>/gi, '')
        ).join('\n').trim();
      }
    }

    // Extract JS section
    const jsMatch = generatedCode.match(/<!-- START:JS -->([\s\S]*?)<!-- END:JS -->/);
    if (jsMatch) {
      sections.js = jsMatch[1].replace(/<script>|<\/script>/g, '').trim();
    } else {
      // Extract JS from script tags
      const scriptMatch = generatedCode.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatch) {
        sections.js = scriptMatch.map(match => 
          match.replace(/<\/?script[^>]*>/gi, '')
        ).join('\n').trim();
      }
    }

    // Generate README
    sections.readme = generateOptimizedReadme(projectData);

    return sections;
  }, [generatedCode, projectData]);

  // Memoize file structure to prevent recalculation
  const fileStructure = useMemo(() => [
    { 
      name: 'index.html', 
      icon: FileText, 
      content: parsedSections.html, 
      language: 'html',
      size: parsedSections.html.length
    },
    { 
      name: 'styles.css', 
      icon: Palette, 
      content: parsedSections.css, 
      language: 'css',
      size: parsedSections.css.length
    },
    { 
      name: 'scripts.js', 
      icon: Code2, 
      content: parsedSections.js, 
      language: 'javascript',
      size: parsedSections.js.length
    },
    { 
      name: 'README.md', 
      icon: FileText, 
      content: parsedSections.readme, 
      language: 'markdown',
      size: parsedSections.readme.length
    }
  ], [parsedSections]);

  // Get current file with memoization
  const currentFile = useMemo(() => 
    fileStructure.find(f => f.name === selectedFile) || fileStructure[0],
    [fileStructure, selectedFile]
  );

  // Live typing effect with optimized performance
  useEffect(() => {
    if (isLiveTyping && generatedCode && selectedFile === 'index.html') {
      setTypingProgress(0);
      const totalLength = generatedCode.length;
      const typingSpeed = Math.max(10, Math.min(50, totalLength / 100)); // Adaptive speed
      
      const interval = setInterval(() => {
        setTypingProgress(prev => {
          const next = prev + typingSpeed;
          if (next >= totalLength) {
            clearInterval(interval);
            return totalLength;
          }
          return next;
        });
      }, 50);

      return () => clearInterval(interval);
    } else {
      setTypingProgress(0);
    }
  }, [isLiveTyping, generatedCode, selectedFile]);

  // Optimized file switching
  const handleFileSelect = useCallback((fileName: string) => {
    setSelectedFile(fileName);
    setTypingProgress(0);
  }, []);

  // Optimized copy function
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      console.log('📋 Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [currentFile.content]);

  // Optimized download function
  const downloadCode = useCallback(() => {
    const blob = new Blob([currentFile.content], { 
      type: getFileContentType(currentFile.name)
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentFile]);

  // Optimized syntax highlighting with memoization
  const highlightedContent = useMemo(() => {
    let content = currentFile.content;
    
    // Show typing progress for live typing
    if (isLiveTyping && selectedFile === 'index.html' && typingProgress > 0) {
      content = content.substring(0, typingProgress);
    }

    return highlightSyntax(content, currentFile.language);
  }, [currentFile.content, currentFile.language, isLiveTyping, selectedFile, typingProgress]);

  const lineCount = currentFile.content.split('\n').length;

  return (
    <div className="h-full bg-slate-900 text-green-400 font-mono">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-white">Project Files</h3>
            <p className="text-sm text-gray-400">
              {generatedCode ? (
                isLiveTyping && selectedFile === 'index.html' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Typing {currentFile.name}... ({Math.round((typingProgress / currentFile.content.length) * 100)}%)
                  </span>
                ) : (
                  `${lineCount} lines • ${currentFile.name} • ${formatFileSize(currentFile.size)}`
                )
              ) : (
                'Ready for code generation...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status indicator */}
          {generatedCode && (
            <div className="flex items-center gap-2 text-xs mr-4">
              <div className={`w-2 h-2 rounded-full ${
                isLiveTyping ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
              }`}></div>
              <span className={isLiveTyping ? 'text-green-400' : 'text-blue-400'}>
                {isLiveTyping ? 'Generating...' : 'Complete'}
              </span>
            </div>
          )}

          {/* Repository links */}
          {projectData?.github_url && (
            <a
              href={projectData.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Open GitHub Repository"
            >
              <Github size={16} />
            </a>
          )}
          
          {projectData?.netlify_url && (
            <a
              href={projectData.netlify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
              title="Open Live Site"
            >
              <Globe size={16} />
            </a>
          )}

          {/* Controls */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="text-gray-400 hover:text-white"
          >
            {showLineNumbers ? <EyeOff size={16} /> : <Eye size={16} />}
          </Button>
          
          {generatedCode && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="text-gray-400 hover:text-white"
              >
                <Copy size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadCode}
                className="text-gray-400 hover:text-white"
              >
                <Download size={16} />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex h-full">
        {/* File Explorer */}
        <div className="w-64 bg-slate-800 border-r border-purple-500/30">
          <div className="p-3 border-b border-purple-500/20">
            <h4 className="text-sm font-medium text-white">📁 Files</h4>
          </div>
          <div className="p-2">
            {fileStructure.map((file) => {
              const Icon = file.icon;
              const isActive = selectedFile === file.name;
              const hasContent = file.content.length > 0;
              
              return (
                <button
                  key={file.name}
                  onClick={() => handleFileSelect(file.name)}
                  className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                    isActive
                      ? 'bg-purple-600/30 text-cyan-400 border border-purple-500/50'
                      : hasContent
                      ? 'text-gray-300 hover:bg-purple-600/10 hover:text-white'
                      : 'text-gray-500 cursor-default'
                  }`}
                  disabled={!hasContent}
                >
                  <Icon size={16} />
                  <span className="truncate flex-1">{file.name}</span>
                  {hasContent && (
                    <span className="text-xs text-gray-500">
                      {file.content.split('\n').length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Display */}
        <div className="flex-1 flex flex-col min-w-0">
          <ScrollArea className="flex-1">
            {currentFile.content ? (
              <div className="flex min-h-full">
                {showLineNumbers && (
                  <div className="bg-slate-800 p-4 text-right text-gray-500 text-sm select-none min-w-[60px] border-r border-purple-500/30 sticky left-0">
                    {Array.from({ length: lineCount }, (_, i) => (
                      <div key={i} className="leading-relaxed">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex-1 p-4">
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap">
                    <code
                      className="text-green-400"
                      dangerouslySetInnerHTML={{ __html: highlightedContent }}
                    />
                  </pre>
                  
                  {isLiveTyping && selectedFile === 'index.html' && typingProgress < currentFile.content.length && (
                    <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1"></span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] bg-slate-900/80">
                <div className="text-center">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-gray-400">No code generated yet</p>
                  <p className="text-xs text-gray-500 mt-2">Start chatting with AI to see your files</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

// Utility functions
const highlightSyntax = (code: string, language: string): string => {
  let highlighted = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  switch (language) {
    case 'html':
      highlighted = highlighted
        .replace(/(&lt;\/?)([\w\-]+)/g, '<span style="color: #e06c75;">$1$2</span>')
        .replace(/([\w\-]+)(=)/g, '<span style="color: #61dafb;">$1</span><span style="color: #56b6c2;">$2</span>')
        .replace(/(&quot;[^&]*&quot;)/g, '<span style="color: #98c379;">$1</span>');
      break;
    case 'css':
      highlighted = highlighted
        .replace(/([\w\-]+)(\s*:)/g, '<span style="color: #61dafb;">$1</span><span style="color: #56b6c2;">$2</span>')
        .replace(/(:)([^;]+)(;)/g, '$1<span style="color: #98c379;">$2</span><span style="color: #56b6c2;">$3</span>')
        .replace(/(@[\w\-]+)/g, '<span style="color: #c678dd;">$1</span>');
      break;
    case 'javascript':
      highlighted = highlighted
        .replace(/\b(function|const|let|var|if|else|for|while|return|import|export)\b/g, '<span style="color: #c678dd;">$1</span>')
        .replace(/\b(true|false|null|undefined)\b/g, '<span style="color: #d19a66;">$1</span>')
        .replace(/(&quot;[^&]*&quot;|&#039;[^&]*&#039;)/g, '<span style="color: #98c379;">$1</span>');
      break;
    case 'markdown':
      highlighted = highlighted
        .replace(/^(#{1,6})\s(.+)$/gm, '<span style="color: #e06c75;">$1</span> <span style="color: #61dafb;">$2</span>')
        .replace(/\*\*(.*?)\*\*/g, '<span style="color: #98c379;">**$1**</span>')
        .replace(/`([^`]+)`/g, '<span style="color: #d19a66;">`$1`</span>');
      break;
  }

  return highlighted;
};

const getFileContentType = (fileName: string): string => {
  if (fileName.endsWith('.html')) return 'text/html';
  if (fileName.endsWith('.css')) return 'text/css';
  if (fileName.endsWith('.js')) return 'text/javascript';
  if (fileName.endsWith('.md')) return 'text/markdown';
  return 'text/plain';
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${Math.round(size / (1024 * 1024))}MB`;
};

const generateOptimizedReadme = (projectData: any): string => {
  if (!projectData) return '# Project README\n\nGenerated by AI Website Builder';
  
  return `# ${projectData.name || 'AI Generated Website'}

${projectData.description || 'Professional website built with AI assistance'}

## 🎯 Project Overview
- **Created**: ${projectData.created_at ? new Date(projectData.created_at).toLocaleDateString() : 'Recently'}
- **Status**: ${projectData.status || 'Active'}
- **Type**: YouTube Channel Website

## 🚀 Features
- Responsive design for all devices
- Real YouTube channel data integration
- Professional styling and animations
- SEO optimized structure
- Fast loading performance

## 🔗 Links
${projectData.github_url ? `- [GitHub Repository](${projectData.github_url})` : ''}
${projectData.netlify_url ? `- [Live Website](${projectData.netlify_url})` : ''}

## 📊 Channel Information
${projectData.channel_data ? `
- **Channel**: ${projectData.channel_data.title || 'N/A'}
- **Subscribers**: ${parseInt(projectData.channel_data.subscriberCount || '0').toLocaleString()}
- **Videos**: ${parseInt(projectData.channel_data.videoCount || '0').toLocaleString()}
- **Total Views**: ${parseInt(projectData.channel_data.viewCount || '0').toLocaleString()}
` : 'Channel data will be displayed here'}

## 🛠️ Technology Stack
- HTML5 with semantic structure
- CSS3 with modern features
- Vanilla JavaScript for interactions
- Responsive design principles
- YouTube API integration

## 📱 Responsive Design
This website is optimized for:
- 📱 Mobile devices (320px+)
- 📟 Tablets (768px+)
- 💻 Desktop computers (1024px+)
- 🖥️ Large screens (1440px+)

---
*Built with ❤️ using AI Website Builder*
`;
};

export default OptimizedCodePreview;
