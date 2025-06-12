
import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

type PreviewMode = 'mobile' | 'tablet' | 'desktop';

interface PreviewFrameProps {
  youtubeUrl: string;
  projectIdea: string;
  previewMode: PreviewMode;
  generatedCode?: string;
  channelData?: {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
    customUrl?: string;
    videos?: any[];
  } | null;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({ 
  youtubeUrl, 
  projectIdea, 
  previewMode, 
  generatedCode,
  channelData 
}) => {
  const [currentCode, setCurrentCode] = useState<string>('');

  useEffect(() => {
    if (generatedCode) {
      setCurrentCode(generatedCode);
    } else if (channelData) {
      // Generate initial preview with real channel data
      setCurrentCode(generateInitialPreview());
    }
  }, [generatedCode, channelData]);

  const generateInitialPreview = () => {
    if (!channelData) {
      return `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <div style="text-align: center;">
            <h2>🎥 AI Website Builder</h2>
            <p>Start chatting to generate your website!</p>
          </div>
        </div>
      `;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData.title} - Official Website</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header */
        .header {
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid #FF0000;
        }
        
        .logo h1 {
            color: white;
            font-size: 1.5rem;
        }
        
        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .nav-links a:hover {
            color: #FF0000;
        }
        
        /* Hero Section */
        .hero {
            background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
                        url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=600&fit=crop') center/cover;
            color: white;
            padding: 8rem 0 4rem;
            text-align: center;
        }
        
        .hero h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
        }
        
        .hero p {
            font-size: 1.3rem;
            margin-bottom: 2rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .cta-button {
            background: #FF0000;
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        .cta-button:hover {
            background: #cc0000;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(255, 0, 0, 0.3);
        }
        
        /* Stats Section */
        .stats {
            background: white;
            padding: 4rem 0;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            text-align: center;
        }
        
        .stat-item {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
        }
        
        .stat-item:hover {
            transform: translateY(-10px);
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        /* Video Gallery */
        .video-gallery {
            background: #f8f9fa;
            padding: 4rem 0;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 3rem;
            color: #333;
        }
        
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .video-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s;
        }
        
        .video-card:hover {
            transform: translateY(-5px);
        }
        
        .video-thumbnail {
            width: 100%;
            height: 200px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 3rem;
        }
        
        .video-info {
            padding: 1.5rem;
        }
        
        .video-title {
            font-size: 1.1rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .video-description {
            color: #666;
            font-size: 0.9rem;
        }
        
        /* Footer */
        .footer {
            background: #1a1a1a;
            color: white;
            text-align: center;
            padding: 3rem 0;
        }
        
        .footer h3 {
            margin-bottom: 1rem;
            color: #FF0000;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .social-links a {
            background: #FF0000;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s;
        }
        
        .social-links a:hover {
            background: #cc0000;
            transform: translateY(-2px);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2.5rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .video-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <!-- Header -->
    <header class="header">
        <nav class="nav container">
            <div class="logo">
                <img src="${channelData.thumbnail}" alt="${channelData.title}" onerror="this.src='https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop'">
                <h1>${channelData.title}</h1>
            </div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#videos">Videos</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <!-- Hero Section -->
    <section class="hero" id="home">
        <div class="container">
            <h1>Welcome to ${channelData.title}</h1>
            <p>${channelData.description || 'Creating amazing content for our awesome community!'}</p>
            <a href="https://youtube.com/channel/${channelData.id}?sub_confirmation=1" class="cta-button">
                🔔 Subscribe Now
            </a>
        </div>
    </section>

    <!-- Stats Section -->
    <section class="stats">
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.subscriberCount).toLocaleString()}</div>
                    <div class="stat-label">Subscribers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.videoCount).toLocaleString()}</div>
                    <div class="stat-label">Videos</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${parseInt(channelData.viewCount).toLocaleString()}</div>
                    <div class="stat-label">Total Views</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Video Gallery -->
    <section class="video-gallery" id="videos">
        <div class="container">
            <h2 class="section-title">Latest Videos</h2>
            <div class="video-grid">
                ${channelData.videos ? channelData.videos.slice(0, 6).map(video => `
                    <div class="video-card">
                        <div class="video-thumbnail">
                            <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.outerHTML='<div style=&quot;width: 100%; height: 100%; background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;&quot;>🎥</div>'">
                        </div>
                        <div class="video-info">
                            <div class="video-title">${video.title}</div>
                            <div class="video-description">${video.description ? video.description.substring(0, 100) + '...' : 'Watch this amazing video!'}</div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="video-card">
                        <div class="video-thumbnail">🎥</div>
                        <div class="video-info">
                            <div class="video-title">Latest Video</div>
                            <div class="video-description">Check out our latest content!</div>
                        </div>
                    </div>
                    <div class="video-card">
                        <div class="video-thumbnail">🎬</div>
                        <div class="video-info">
                            <div class="video-title">Popular Video</div>
                            <div class="video-description">Our most viewed content!</div>
                        </div>
                    </div>
                    <div class="video-card">
                        <div class="video-thumbnail">📺</div>
                        <div class="video-info">
                            <div class="video-title">Featured Video</div>
                            <div class="video-description">Don't miss this one!</div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer" id="contact">
        <div class="container">
            <h3>${channelData.title}</h3>
            <p>Thanks for visiting! Don't forget to subscribe and hit the bell icon for notifications.</p>
            <div class="social-links">
                <a href="https://youtube.com/channel/${channelData.id}">YouTube</a>
                ${channelData.customUrl ? `<a href="${channelData.customUrl}">Channel</a>` : ''}
                <a href="https://youtube.com/channel/${channelData.id}?sub_confirmation=1">Subscribe</a>
            </div>
            <p style="margin-top: 2rem; opacity: 0.7;">&copy; 2024 ${channelData.title}. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
    `;
  };

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

  if (!currentCode) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-100 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300"
        style={{
          width: frameSize.width,
          height: frameSize.height,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {previewMode === 'mobile' && <Smartphone size={16} className="text-white" />}
            {previewMode === 'tablet' && <Tablet size={16} className="text-white" />}
            {previewMode === 'desktop' && <Monitor size={16} className="text-white" />}
            <span className="text-white text-sm capitalize">{previewMode} Preview</span>
          </div>
        </div>
        <iframe
          srcDoc={currentCode}
          className="w-full h-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default PreviewFrame;
