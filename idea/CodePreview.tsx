
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Copy, Download, Eye, EyeOff } from 'lucide-react';

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('html');

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
              // Continue typing next line with realistic delay
              setTimeout(typeNextLine, Math.random() * 100 + 50);
            } else {
              setIsTyping(false);
            }
          }
          return nextLine;
        });
      };
      
      // Start typing effect
      setTimeout(typeNextLine, 200);
    } else if (!generatedCode) {
      setDisplayCode('');
      setCurrentLine(0);
      setIsTyping(false);
    }
  }, [generatedCode]);

  const finalCode = displayCode || `<!-- No code generated yet -->
<!-- Start a conversation with the AI to generate stunning website code -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waiting for AI...</title>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea, #764ba2);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .waiting-container {
            text-align: center;
            padding: 60px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        .spinner {
            width: 80px;
            height: 80px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #4ecdc4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            margin: 0 0 15px 0;
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(45deg, #4ecdc4, #45b7d1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.2rem;
            line-height: 1.6;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.9; }
            50% { opacity: 1; }
        }
    </style>
</head>
<body>
    <div class="waiting-container">
        <div class="spinner"></div>
        <h1>🚀 AI Code Generator Ready</h1>
        <p class="pulse">Tell the AI what amazing website you want to create!</p>
    </div>
</body>
</html>`;

  const lineCount = finalCode.split('\n').length;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(finalCode);
      console.log('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([finalCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLanguageFromContent = (content: string) => {
    if (content.includes('<style>') || content.includes('css')) return 'css';
    if (content.includes('<script>') || content.includes('javascript')) return 'javascript';
    return 'html';
  };

  const highlightSyntax = (code: string, language: string) => {
    // Simple syntax highlighting
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
    }

    return highlighted;
  };

  return (
    <div className="h-full bg-gray-900 text-green-400 font-mono">
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="font-semibold text-white">Live Code Generation</h3>
            <p className="text-sm text-gray-400">
              {generatedCode ? (
                isTyping ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Typing line {currentLine}/{lineCount}...
                  </span>
                ) : (
                  `${lineCount} lines • Professional website generated`
                )
              ) : (
                'Ready for AI code generation...'
              )}
            </p>
          </div>
          
          {/* Language Filter */}
          {codeBlocks.length > 0 && (
            <div className="flex gap-2">
              {['html', 'css', 'javascript'].map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    selectedLanguage === lang
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Live Status */}
          {generatedCode && (
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-400 animate-pulse' : 'bg-blue-400'}`}></div>
              <span className={isTyping ? 'text-green-400' : 'text-blue-400'}>
                {isTyping ? 'Generating...' : 'Complete'}
              </span>
            </div>
          )}

          {/* Tools */}
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
      
      <ScrollArea className="h-full">
        <div className="relative">
          {/* Show filtered code blocks if available */}
          {codeBlocks.length > 0 ? (
            <div className="p-4">
              {codeBlocks
                .filter(block => selectedLanguage === 'html' || block.type === selectedLanguage)
                .map((block, index) => (
                  <div key={index} className="mb-6">
                    <div className="text-xs text-gray-500 mb-2 uppercase font-semibold">
                      {block.type} Block {index + 1}
                    </div>
                    <pre className="text-sm leading-relaxed bg-gray-800 p-3 rounded">
                      <code
                        dangerouslySetInnerHTML={{
                          __html: highlightSyntax(block.content, block.type)
                        }}
                      />
                    </pre>
                  </div>
                ))}
            </div>
          ) : (
            /* Show full code with line numbers */
            <div className="flex">
              {showLineNumbers && (
                <div className="bg-gray-800 p-4 text-right text-gray-500 text-sm select-none min-w-[60px] border-r border-gray-700">
                  {finalCode.split('\n').map((_, index) => (
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
                    className={generatedCode ? 'text-green-400' : 'text-gray-500'}
                    dangerouslySetInnerHTML={{
                      __html: highlightSyntax(finalCode, 'html')
                    }}
                  />
                </pre>
                
                {/* Typing cursor */}
                {isTyping && (
                  <span className="inline-block w-2 h-5 bg-green-400 animate-pulse ml-1"></span>
                )}
              </div>
            </div>
          )}
          
          {!generatedCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-gray-400">Start chatting with AI to see live code generation</p>
                <p className="text-xs text-gray-500 mt-2">Watch as the AI writes professional code line by line</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodePreview;
