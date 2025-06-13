
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Code, 
  Eye, 
  Zap,
  Clock,
  GitBranch
} from 'lucide-react';

interface RealTimeCodePreviewProps {
  code: string;
  isStreaming?: boolean;
  streamingSpeed?: number;
  onCodeUpdate?: (code: string) => void;
  showLineNumbers?: boolean;
}

const RealTimeCodePreview: React.FC<RealTimeCodePreviewProps> = ({
  code,
  isStreaming = false,
  streamingSpeed = 50,
  onCodeUpdate,
  showLineNumbers = true
}) => {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [activeTab, setActiveTab] = useState<'preview' | 'source'>('preview');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isStreaming && isPlaying) {
      startStreaming();
    } else {
      setDisplayedCode(code);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [code, isStreaming, isPlaying, streamingSpeed]);

  const startStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const lines = code.split('\n');
    let lineIndex = 0;
    let charIndex = 0;
    let accumulated = '';

    intervalRef.current = setInterval(() => {
      if (lineIndex >= lines.length) {
        setIsPlaying(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        return;
      }

      const currentLineText = lines[lineIndex];
      
      if (charIndex < currentLineText.length) {
        accumulated += currentLineText[charIndex];
        charIndex++;
      } else {
        accumulated += '\n';
        lineIndex++;
        charIndex = 0;
        setCurrentLine(lineIndex);
      }

      setDisplayedCode(accumulated);
      
      // Update preview in real-time
      if (previewRef.current && accumulated.includes('</html>')) {
        updatePreview(accumulated);
      }
    }, streamingSpeed);
  };

  const updatePreview = (htmlCode: string) => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(htmlCode);
        doc.close();
      }
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setDisplayedCode('');
    setCurrentLine(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (isPlaying) {
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 100);
    }
  };

  const formatCodeWithHighlighting = (code: string) => {
    return code
      .replace(/(&lt;[^&]*&gt;)/g, '<span class="text-blue-400">$1</span>')
      .replace(/(".*?")/g, '<span class="text-green-400">$1</span>')
      .replace(/(\/\*.*?\*\/)/gs, '<span class="text-gray-500">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-gray-500">$1</span>');
  };

  const getLineNumbers = (code: string) => {
    const lines = code.split('\n');
    return lines.map((_, index) => (
      <div
        key={index}
        className={`text-xs text-gray-500 text-right pr-2 select-none ${
          index === currentLine - 1 ? 'bg-yellow-500/20 text-yellow-400' : ''
        }`}
      >
        {index + 1}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header Controls */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-purple-400" />
            <span className="font-medium text-sm">Real-Time Code</span>
            {isStreaming && (
              <Badge variant="outline" className="text-xs bg-purple-500/20">
                Streaming
              </Badge>
            )}
          </div>
          
          {isStreaming && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePlayPause}
                className="p-1 h-7 w-7"
              >
                {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="p-1 h-7 w-7"
              >
                <RotateCcw size={12} />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <div className="flex items-center gap-1 text-xs">
              <Clock size={10} />
              <span>Line {currentLine}</span>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'preview' | 'source')}>
            <TabsList className="h-7">
              <TabsTrigger value="preview" className="text-xs h-5 px-2">
                <Eye size={10} className="mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="source" className="text-xs h-5 px-2">
                <Code size={10} className="mr-1" />
                Source
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeTab === 'preview' ? (
          <div className="h-full bg-white">
            <iframe
              ref={previewRef}
              className="w-full h-full border-0"
              title="Code Preview"
              srcDoc={displayedCode}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : (
          <div className="h-full flex">
            {showLineNumbers && (
              <div className="bg-gray-800 border-r border-gray-700 min-w-[3rem]">
                <ScrollArea className="h-full">
                  <div className="py-3">
                    {getLineNumbers(displayedCode)}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <div className="flex-1">
              <ScrollArea className="h-full">
                <pre className="p-3 text-xs font-mono">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: formatCodeWithHighlighting(
                        displayedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                      )
                    }}
                  />
                </pre>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="p-2 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{displayedCode.split('\n').length} lines</span>
          <span>{displayedCode.length} characters</span>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Streaming active</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {onCodeUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCodeUpdate(displayedCode)}
              className="text-xs h-6 px-2"
            >
              <GitBranch size={10} className="mr-1" />
              Update
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeCodePreview;
