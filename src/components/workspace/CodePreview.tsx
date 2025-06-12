
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CodePreviewProps {
  generatedCode?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({ generatedCode }) => {
  const displayCode = generatedCode || `<!-- No code generated yet -->
<!-- Start a conversation with the AI to generate stunning website code -->

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waiting for AI...</title>
</head>
<body>
    <div style="
        display: flex; 
        align-items: center; 
        justify-content: center; 
        min-height: 100vh; 
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        text-align: center;
    ">
        <div>
            <h1>🤖 Ready to Generate Code</h1>
            <p>Ask the AI to create your website and watch the code appear here in real-time!</p>
        </div>
    </div>
</body>
</html>`;

  const lineCount = displayCode.split('\n').length;

  return (
    <div className="h-full bg-gray-900 text-green-400 font-mono">
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-white">Generated Code</h3>
          <p className="text-sm text-gray-400">
            {generatedCode ? `${lineCount} lines • Live AI-generated code` : 'Waiting for AI generation...'}
          </p>
        </div>
        {generatedCode && (
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400">Live</span>
          </div>
        )}
      </div>
      
      <ScrollArea className="h-full p-4">
        <div className="relative">
          <pre className="text-sm leading-relaxed">
            <code 
              className={generatedCode ? 'text-green-400' : 'text-gray-500'}
              dangerouslySetInnerHTML={{ 
                __html: displayCode
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;')
              }}
            />
          </pre>
          
          {!generatedCode && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-gray-400">Start chatting with AI to see code here</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CodePreview;
