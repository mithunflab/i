
import React, { useEffect, useState } from 'react';

interface PreviewFrameProps {
  youtubeUrl: string;
  projectIdea: string;
  previewMode: 'mobile' | 'tablet' | 'desktop';
  generatedCode?: string;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ 
  youtubeUrl, 
  projectIdea, 
  previewMode, 
  generatedCode 
}) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getFrameSize = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  useEffect(() => {
    if (generatedCode) {
      // Use the actual generated code from AI
      setHtmlContent(generatedCode);
      setIsLoading(false);
    } else {
      // Show a loading state until code is generated
      setHtmlContent(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generating Your Website...</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .loading-container {
            text-align: center;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        h1 {
            margin: 0 0 10px 0;
            font-size: 2rem;
        }
        p {
            margin: 0;
            opacity: 0.8;
            font-size: 1.1rem;
        }
        .dots {
            animation: dots 1.5s infinite;
        }
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }
    </style>
</head>
<body>
    <div class="loading-container">
        <div class="spinner"></div>
        <h1>✨ AI is Creating Your Website</h1>
        <p>Please start a conversation with the AI to generate your stunning website<span class="dots">...</span></p>
    </div>
</body>
</html>
      `);
      setIsLoading(true);
    }
  }, [generatedCode]);

  const frameSize = getFrameSize();
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div 
        className="border rounded-lg overflow-hidden bg-white shadow-lg relative"
        style={{
          width: frameSize.width,
          height: frameSize.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        {isLoading && !generatedCode && (
          <div className="absolute top-4 left-4 z-10 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
            Waiting for AI...
          </div>
        )}
        
        {generatedCode && (
          <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            ✅ Live Preview
          </div>
        )}
        
        <iframe
          src={dataUrl}
          className="w-full h-full border-0"
          title="Generated Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewFrame;
