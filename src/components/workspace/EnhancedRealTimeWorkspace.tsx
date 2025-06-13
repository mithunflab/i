
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Zap, Github, Globe } from 'lucide-react';
import RealTimeSimplifiedChatbot from './RealTimeSimplifiedChatbot';
import CompactFileStructure, { defaultProjectFiles } from './CompactFileStructure';
import OptimizedCodePreview from './OptimizedCodePreview';

interface EnhancedRealTimeWorkspaceProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: any;
}

const EnhancedRealTimeWorkspace: React.FC<EnhancedRealTimeWorkspaceProps> = ({
  youtubeUrl,
  projectIdea,
  channelData
}) => {
  const [projectId] = useState(() => crypto.randomUUID());
  const [sourceCode, setSourceCode] = useState(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'AI'} - Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            max-width: 800px; 
            background: rgba(255,255,255,0.95); 
            padding: 3rem; 
            border-radius: 20px; 
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 { 
            font-size: 3rem; 
            margin-bottom: 1rem; 
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .status { 
            display: inline-flex; 
            align-items: center; 
            gap: 8px; 
            background: #10B981; 
            color: white; 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-size: 0.9rem;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Real-Time AI Website Builder</h1>
        <p>Welcome to ${channelData?.title || 'your'} website! This is generated in real-time using AI.</p>
        <div class="status">
            <span>⚡</span>
            <span>Real-time generation ready</span>
        </div>
        <p style="color: #666; margin-top: 2rem;">
            Start chatting with the AI assistant to build your custom website!
        </p>
    </div>
</body>
</html>`);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('/index.html');

  const handleCodeUpdate = (newCode: string, targetFile?: string) => {
    console.log('🔄 Real-time code update received');
    setSourceCode(newCode);
  };

  const handleChatHistoryUpdate = (history: any[]) => {
    setChatHistory(history);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Compact File Structure */}
      <CompactFileStructure 
        files={defaultProjectFiles}
        onFileSelect={setSelectedFile}
        selectedFile={selectedFile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Code Preview */}
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-700">Live Preview</h2>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Zap className="w-3 h-3 mr-1" />
                  Real-time
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="flex-1">
            <OptimizedCodePreview 
              code={sourceCode}
              language="html"
            />
          </div>
        </div>

        <Separator orientation="vertical" />

        {/* Real-Time Chat */}
        <div className="w-96 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Real-Time AI Chat</h2>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                  <Zap className="w-2 h-2 mr-1" />
                  Live
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                  <Github className="w-2 h-2 mr-1" />
                  GitHub
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  <Globe className="w-2 h-2 mr-1" />
                  Deploy
                </Badge>
              </div>
            </div>
            
            {channelData && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <img 
                    src={channelData.thumbnail} 
                    alt={channelData.title}
                    className="w-6 h-6 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{channelData.title}</p>
                    <p className="text-xs text-gray-500">
                      {parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <RealTimeSimplifiedChatbot
              projectId={projectId}
              sourceCode={sourceCode}
              channelData={channelData}
              onCodeUpdate={handleCodeUpdate}
              onChatHistoryUpdate={handleChatHistoryUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedRealTimeWorkspace;
