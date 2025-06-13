
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Download, 
  Eye, 
  EyeOff, 
  FileText, 
  Code2, 
  Palette,
  Folder,
  FolderOpen,
  File,
  Settings,
  Youtube,
  Image
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

interface CodePreviewProps {
  generatedCode?: string;
  projectFiles?: FileNode[];
  isLiveTyping?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ 
  generatedCode, 
  projectFiles = [],
  isLiveTyping = false 
}) => {
  const [displayCode, setDisplayCode] = useState<string>('');
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [showFileTree, setShowFileTree] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  // Live typing effect when new code is generated
  useEffect(() => {
    if (generatedCode && generatedCode !== displayCode && isLiveTyping) {
      setIsTyping(true);
      setCurrentLine(0);
      
      const lines = generatedCode.split('\n');
      const typeNextLine = () => {
        setCurrentLine(prev => {
          const nextLine = prev + 1;
          if (nextLine <= lines.length) {
            const currentCode = lines.slice(0, nextLine).join('\n');
            setDisplayCode(currentCode);
            
            if (nextLine < lines.length) {
              setTimeout(typeNextLine, Math.random() * 50 + 25);
            } else {
              setIsTyping(false);
            }
          }
          return nextLine;
        });
      };
      
      setTimeout(typeNextLine, 100);
    } else if (generatedCode && !isLiveTyping) {
      setDisplayCode(generatedCode);
      setIsTyping(false);
    }
  }, [generatedCode, isLiveTyping]);

  const parseCodeSections = (code: string) => {
    const sections = {
      html: '',
      css: '',
      js: '',
      readme: ''
    };

    if (!code) return sections;

    sections.html = code;
    
    // Extract CSS from style tags
    const cssMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (cssMatch) {
      sections.css = cssMatch[1].trim();
    }

    // Extract JS from script tags
    const jsMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (jsMatch) {
      sections.js = jsMatch[1].trim();
    }

    return sections;
  };

  const sections = parseCodeSections(displayCode);
  const files = [
    { name: 'index.html', icon: FileText, content: displayCode || '', language: 'html' },
    { name: 'style.css', icon: Palette, content: sections.css, language: 'css' },
    { name: 'script.js', icon: Code2, content: sections.js, language: 'javascript' },
    { name: 'interpreter.js', icon: Settings, content: '// AI interpretation logic\nconsole.log("AI interpreter ready");', language: 'javascript' },
    { name: 'aieditor.js', icon: Settings, content: '// AI editor functionality\nconsole.log("AI editor initialized");', language: 'javascript' },
    { name: 'componentmap.js', icon: Settings, content: '// Component mapping\nconst componentMap = {};', language: 'javascript' },
    { name: 'design.json', icon: Settings, content: '{\n  "theme": "youtube-red",\n  "primary": "#ff0000"\n}', language: 'json' },
    { name: 'changelog.md', icon: FileText, content: '# Changelog\n\n## v1.0.0\n- Initial release', language: 'markdown' },
    { name: 'readme.md', icon: FileText, content: '# YouTube Website\n\nAI-generated website for YouTube channel.', language: 'markdown' },
    { name: 'projectchat', icon: FileText, content: 'Chat history and AI interactions...', language: 'text' },
    { name: 'yticon', icon: Youtube, content: 'YouTube channel data and assets...', language: 'text' }
  ];

  const currentFile = files.find(f => f.name === selectedFile) || files[0];
  const lineCount = currentFile.content.split('\n').length;

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: any) => {
    switch (file.extension || file.name.split('.').pop()) {
      case 'html': return Code2;
      case 'css': return Palette;
      case 'js': return Code2;
      case 'json': return Settings;
      case 'md': return FileText;
      case 'jpg':
      case 'png':
      case 'gif': return Image;
      default: return File;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      console.log('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([currentFile.content], { 
      type: currentFile.name.includes('.md') ? 'text/markdown' : 'text/html' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-gradient-to-br from-red-950 via-red-900 to-black text-red-100 font-mono relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-red-800/10 to-black/30"></div>
      <div className="absolute inset-0 bg-noise opacity-5"></div>
      
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-red-500/30 bg-red-950/50 backdrop-blur-md flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileTree(!showFileTree)}
              className="text-red-300 hover:text-white hover:bg-red-600/30"
            >
              <Folder className="h-4 w-4 mr-2" />
              Project Files
            </Button>
            <div>
              <h3 className="font-semibold text-white">Code Editor</h3>
              <p className="text-sm text-red-300">
                {generatedCode ? (
                  isTyping ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                      Writing {currentFile.name}...
                    </span>
                  ) : (
                    `${lineCount} lines • ${currentFile.name}`
                  )
                ) : (
                  'Waiting for AI to generate code...'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {generatedCode && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-red-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className={isTyping ? 'text-red-400' : 'text-green-400'}>
                  {isTyping ? 'Writing...' : 'Complete'}
                </span>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className="text-red-400 hover:text-white hover:bg-red-600/30"
            >
              {showLineNumbers ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
            
            {generatedCode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="text-red-400 hover:text-white hover:bg-red-600/30"
                >
                  <Copy size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadCode}
                  className="text-red-400 hover:text-white hover:bg-red-600/30"
                >
                  <Download size={16} />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* File Tree (Top Half when shown) */}
        {showFileTree && (
          <div className="h-1/2 border-b border-red-500/30 bg-red-950/30 backdrop-blur-sm">
            <div className="p-3 border-b border-red-500/20">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Folder className="w-4 h-4" />
                📁 Project Structure
                <Badge variant="secondary" className="bg-red-600/20 text-red-300 border-red-500/30">
                  {files.length} files
                </Badge>
              </h4>
            </div>
            <ScrollArea className="h-full p-2">
              <div className="space-y-1">
                {files.map((file, index) => {
                  const Icon = getFileIcon(file);
                  const isSelected = selectedFile === file.name;
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedFile(file.name)}
                      className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                        isSelected
                          ? 'bg-red-600/30 text-white border border-red-500/50'
                          : 'text-red-300 hover:bg-red-600/20 hover:text-white'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="truncate">{file.name}</span>
                      {file.name === 'yticon' && (
                        <Youtube className="w-3 h-3 text-red-400 ml-auto" />
                      )}
                      {file.content && (
                        <span className="ml-auto text-xs text-red-500">
                          {file.content.split('\n').length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Code Display Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="relative">
              {currentFile.content ? (
                <div className="flex">
                  {showLineNumbers && (
                    <div className="bg-red-950/50 p-4 text-right text-red-500 text-sm select-none min-w-[60px] border-r border-red-500/30">
                      {currentFile.content.split('\n').map((_, index) => (
                        <div
                          key={index}
                          className={`leading-relaxed ${
                            isTyping && index === currentLine - 1 ? 'text-red-300 bg-red-400/10' : ''
                          }`}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex-1 p-4">
                    <pre className="text-sm leading-relaxed">
                      <code className="text-red-200">
                        {currentFile.content}
                      </code>
                    </pre>
                    
                    {isTyping && selectedFile === 'index.html' && (
                      <span className="inline-block w-2 h-5 bg-red-400 animate-pulse ml-1"></span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-red-950/30">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-red-300">No code generated yet</p>
                    <p className="text-xs text-red-500 mt-2">Start chatting with AI to see your project files</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
