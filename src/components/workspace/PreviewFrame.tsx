
import React from 'react';

interface PreviewFrameProps {
  youtubeUrl: string;
  projectIdea: string;
  previewMode: 'mobile' | 'tablet' | 'desktop';
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ youtubeUrl, projectIdea, previewMode }) => {
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

  const frameSize = getFrameSize();

  // Create a simple HTML content string
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${projectIdea}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
            min-height: 100vh;
            color: white;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .youtube-icon {
            width: 50px;
            height: 50px;
            background: #FF0000;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
        }
        h1 {
            color: #fff;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            font-size: clamp(1.5rem, 4vw, 2.5rem);
        }
        .subtitle {
            color: #ffcccc;
            font-size: 1rem;
            margin-top: 5px;
        }
        p {
            color: #f0f0f0;
            line-height: 1.6;
            margin: 20px 0;
            font-size: clamp(0.9rem, 2.5vw, 1.1rem);
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
            border: 1px solid rgba(255, 0, 0, 0.3);
            transition: all 0.3s;
        }
        .feature:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 0, 0, 0.4);
        }
        .feature h3 {
            font-size: clamp(1rem, 3vw, 1.3rem);
            margin-bottom: 10px;
            color: #ffcccc;
        }
        .btn {
            background: linear-gradient(45deg, #FF0000, #cc0000);
            color: white;
            padding: 15px 25px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
            width: 100%;
            margin-top: 20px;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 0, 0, 0.4);
        }
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .video-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 15px;
            border: 1px solid rgba(255, 0, 0, 0.2);
            transition: all 0.3s;
        }
        .video-card:hover {
            transform: scale(1.05);
        }
        .video-thumbnail {
            width: 100%;
            height: 120px;
            background: #333;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
            font-size: 24px;
        }
        @media (max-width: 768px) {
            .container {
                padding: 20px;
                margin: 10px;
            }
            .video-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="youtube-icon">▶</div>
            <div>
                <h1>${projectIdea}</h1>
                <div class="subtitle">YouTube Channel Website</div>
            </div>
        </div>
        
        <p>Welcome to my YouTube channel website! Here you'll find all my latest videos, playlists, and updates. Don't forget to subscribe for more amazing content!</p>
        
        <div class="feature">
            <h3>📺 Latest Videos</h3>
            <p>Check out my newest uploads and trending content from my YouTube channel.</p>
        </div>
        
        <div class="video-grid">
            <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <p>Latest Video</p>
            </div>
            <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <p>Popular Video</p>
            </div>
            <div class="video-card">
                <div class="video-thumbnail">▶</div>
                <p>Trending Video</p>
            </div>
        </div>
        
        <div class="feature">
            <h3>🔔 Subscribe & Connect</h3>
            <p>Connected to: ${youtubeUrl}</p>
            <p>Join our community and never miss an upload! Follow me on all social platforms.</p>
        </div>
        
        <button class="btn" onclick="alert('🎉 Thanks for visiting! Don\\'t forget to subscribe to my YouTube channel!')">
            🔔 Subscribe to My Channel
        </button>
    </div>
</body>
</html>`;

  // Convert HTML to data URL
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div 
        className="border rounded-lg overflow-hidden bg-white shadow-lg"
        style={{
          width: frameSize.width,
          height: frameSize.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <iframe
          src={dataUrl}
          className="w-full h-full border-0"
          title="YouTube Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewFrame;
