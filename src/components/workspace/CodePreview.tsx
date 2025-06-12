
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye, EyeOff, FileText, Code2, Palette } from 'lucide-react';

interface CodePreviewProps {
  generatedCode?: string;
  codeBlocks?: Array<{ type: string, content: string }>;
  isLiveTyping?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({ 
  generatedCode, 
  codeBlocks = [],
  isLiveTyping = false 
}) => {
  const [displayCode, setDisplayCode] = useState<string>('');
  const [currentLine, setCurrentLine] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showLineNumbers, setShowLineNumbers] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<string>('index.html');

  // Parse the generated code into sections
  const parseCodeSections = (code: string) => {
    const sections = {
      html: '',
      css: '',
      js: '',
      readme: ''
    };

    if (!code) return sections;

    // Extract HTML section
    const htmlMatch = code.match(/<!-- START:HTML -->([\s\S]*?)<!-- END:HTML -->/);
    if (htmlMatch) {
      sections.html = htmlMatch[1].trim();
    } else {
      // If no sections, treat entire code as HTML
      sections.html = code;
    }

    // Extract CSS section
    const cssMatch = code.match(/<!-- START:CSS -->([\s\S]*?)<!-- END:CSS -->/);
    if (cssMatch) {
      sections.css = cssMatch[1].replace(/<style>|<\/style>/g, '').trim();
    }

    // Extract JS section
    const jsMatch = code.match(/<!-- START:JS -->([\s\S]*?)<!-- END:JS -->/);
    if (jsMatch) {
      sections.js = jsMatch[1].replace(/<script>|<\/script>/g, '').trim();
    }

    // Generate README
    sections.readme = `# My YouTube Website (Lovable AI Generated)

This is a smart, editable website built using Lovable AI. It features:

- Unified file containing HTML, CSS, and JS code
- Sectioned with comment anchors for safe AI/user edits
- Custom memory and chat per project
- Live preview functionality

## ✍️ Editing Guide

All code is structured with anchors:

- \`<!-- START:HTML -->\` and \`<!-- END:HTML -->\` — Main layout
- \`<!-- START:CSS -->\` and \`<!-- END:CSS -->\` — Styling
- \`<!-- START:JS -->\` and \`<!-- END:JS -->\` — Behavior

Only modify inside the anchors. Avoid changing anchor labels.

## 🚀 Features

- Safe AI code edits without overwriting structure
- User changes are retained per section
- Works in Lovable's editor
- Automatically commits changes to GitHub

## 💾 Backup & Restore

Before major changes, create a manual version backup inside Lovable or Git.

## 📂 File Structure

📁 project-root/
├── index.html ← Single file with all HTML, CSS, JS sections
└── README.md ← Instructions and structure`;

    return sections;
  };

  // Live typing effect when new code is generated
  useEffect(() => {
    if (generatedCode && generatedCode !== displayCode) {
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
              setTimeout(typeNextLine, Math.random() * 100 + 50);
            } else {
              setIsTyping(false);
            }
          }
          return nextLine;
        });
      };
      
      setTimeout(typeNextLine, 200);
    } else if (!generatedCode) {
      setDisplayCode('');
      setCurrentLine(0);
      setIsTyping(false);
    }
  }, [generatedCode]);

  const sections = parseCodeSections(displayCode);
  const files = [
    { name: 'index.html', icon: FileText, content: displayCode || '', language: 'html' },
    { name: 'styles (CSS)', icon: Palette, content: sections.css, language: 'css' },
    { name: 'scripts (JS)', icon: Code2, content: sections.js, language: 'javascript' },
    { name: 'README.md', icon: FileText, content: sections.readme, language: 'markdown' }
  ];

  const currentFile = files.find(f => f.name === selectedFile) || files[0];
  const lineCount = currentFile.content.split('\n').length;

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

  const highlightSyntax = (code: string, language: string) => {
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

  return (
    <div className="h-full bg-slate-900 text-green-400 font-mono">
      <div className="p-4 border-b border-purple-500/30 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-white">Project Files</h3>
            <p className="text-sm text-gray-400">
              {generatedCode ? (
                isTyping ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Generating {currentFile.name}...
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
              <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
              <span className={isTyping ? 'text-green-400' : 'text-blue-400'}>
                {isTyping ? 'Generating...' : 'Complete'}
              </span>
            </div>
          )}

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
        {/* File Explorer Sidebar */}
        <div className="w-64 bg-slate-800 border-r border-purple-500/30">
          <div className="p-3 border-b border-purple-500/20">
            <h4 className="text-sm font-medium text-white">📁 Project Structure</h4>
          </div>
          <div className="p-2">
            {files.map((file) => {
              const Icon = file.icon;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file.name)}
                  className={`w-full flex items-center gap-2 p-2 rounded text-sm transition-colors ${
                    selectedFile === file.name
                      ? 'bg-purple-600/30 text-cyan-400 border border-purple-500/50'
                      : 'text-gray-400 hover:bg-purple-600/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{file.name}</span>
                  {file.content && (
                    <span className="ml-auto text-xs text-gray-500">
                      {file.content.split('\n').length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Code Display Area */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1">
            <div className="relative">
              {currentFile.content ? (
                <div className="flex">
                  {showLineNumbers && (
                    <div className="bg-slate-800 p-4 text-right text-gray-500 text-sm select-none min-w-[60px] border-r border-purple-500/30">
                      {currentFile.content.split('\n').map((_, index) => (
                        <div
                          key={index}
                          className={`leading-relaxed ${
                            isTyping && index === currentLine - 1 ? 'text-green-400 bg-green-400/10' : ''
                          }`}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex-1 p-4">
                    <pre className="text-sm leading-relaxed">
                      <code
                        className="text-green-400"
                        dangerouslySetInnerHTML={{
                          __html: highlightSyntax(currentFile.content, currentFile.language)
                        }}
                      />
                    </pre>
                    
                    {isTyping && selectedFile === 'index.html' && (
                      <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1"></span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🤖</div>
                    <p className="text-gray-400">No code generated yet</p>
                    <p className="text-xs text-gray-500 mt-2">Start chatting with AI to see your project files</p>
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
