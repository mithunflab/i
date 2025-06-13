
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFile {
  name: string;
  content: string;
  type: 'html' | 'css' | 'js' | 'json' | 'md' | 'other';
  lastModified: Date;
}

interface YouTubeData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  videos?: any[];
}

export const useProjectFileManager = () => {
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([
    {
      name: 'index.html',
      content: '',
      type: 'html',
      lastModified: new Date()
    },
    {
      name: 'style.css',
      content: '/* Add your custom styles here */',
      type: 'css',
      lastModified: new Date()
    },
    {
      name: 'script.js',
      content: '// Add your JavaScript code here',
      type: 'js',
      lastModified: new Date()
    },
    {
      name: 'design.json',
      content: JSON.stringify({ theme: 'default', colors: {}, fonts: {} }, null, 2),
      type: 'json',
      lastModified: new Date()
    },
    {
      name: 'README.md',
      content: '# Project Documentation\n\nThis is an AI-generated website project.',
      type: 'md',
      lastModified: new Date()
    },
    {
      name: 'changelog.md',
      content: '# Changelog\n\n## Version 1.0.0\n- Initial project creation',
      type: 'md',
      lastModified: new Date()
    },
    {
      name: 'ytdata.json',
      content: JSON.stringify({ channel: null, videos: [] }, null, 2),
      type: 'json',
      lastModified: new Date()
    },
    {
      name: 'chat-history.json',
      content: JSON.stringify([], null, 2),
      type: 'json',
      lastModified: new Date()
    }
  ]);

  const [youtubeData, setYouTubeData] = useState<YouTubeData | null>(null);
  const { toast } = useToast();

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setProjectFiles(prev => prev.map(file => 
      file.name === fileName 
        ? { ...file, content, lastModified: new Date() }
        : file
    ));
  }, []);

  const addFile = useCallback((fileName: string, content: string = '', type: ProjectFile['type'] = 'other') => {
    const newFile: ProjectFile = {
      name: fileName,
      content,
      type,
      lastModified: new Date()
    };

    setProjectFiles(prev => {
      const exists = prev.some(file => file.name === fileName);
      if (exists) {
        return prev.map(file => 
          file.name === fileName ? newFile : file
        );
      } else {
        return [...prev, newFile];
      }
    });
  }, []);

  const fetchYouTubeData = useCallback(async (url: string): Promise<YouTubeData> => {
    try {
      // Extract channel identifier from URL
      const channelIdentifier = extractChannelIdentifier(url);
      if (!channelIdentifier) {
        throw new Error('Invalid YouTube channel URL');
      }

      console.log('🔍 Fetching YouTube data for:', channelIdentifier);

      // Call the YouTube integration function
      const { data, error } = await supabase.functions.invoke('youtube-integration', {
        body: {
          channelIdentifier,
          fetchVideos: true,
          maxResults: 12
        }
      });

      if (error) {
        console.error('❌ YouTube API error:', error);
        throw new Error(`YouTube API error: ${error.message}`);
      }

      console.log('✅ YouTube data received:', data);

      const channelData: YouTubeData = {
        id: data.channel.id,
        title: data.channel.title,
        description: data.channel.description,
        thumbnail: data.channel.thumbnail,
        subscriberCount: data.channel.subscriberCount,
        videoCount: data.channel.videoCount,
        viewCount: data.channel.viewCount,
        customUrl: data.channel.customUrl,
        videos: data.channel.videos || []
      };

      setYouTubeData(channelData);
      
      // Update ytdata.json file
      updateFileContent('ytdata.json', JSON.stringify({
        channel: channelData,
        videos: channelData.videos,
        lastUpdated: new Date().toISOString()
      }, null, 2));

      return channelData;
    } catch (error) {
      console.error('❌ Error fetching YouTube data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch YouTube data",
        variant: "destructive"
      });
      throw error;
    }
  }, [updateFileContent, toast]);

  const extractChannelIdentifier = (url: string): string | null => {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)/,
      /^@?([a-zA-Z0-9_-]+)$/ // Handle direct username
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const generateWebsiteCode = useCallback((data: YouTubeData): string => {
    const code = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Official Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            display: flex; 
            align-items: center; 
            gap: 20px; 
            padding: 40px 0; 
            border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        .avatar { 
            width: 80px; 
            height: 80px; 
            border-radius: 50%; 
            border: 3px solid rgba(255,255,255,0.3);
        }
        .channel-info h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .stats { 
            display: flex; 
            gap: 30px; 
            margin-top: 40px; 
            justify-content: center;
        }
        .stat { text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; }
        .stat-label { opacity: 0.8; margin-top: 5px; }
        .content {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card h3 { margin-bottom: 15px; font-size: 1.5rem; }
        .videos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .video-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .video-thumbnail {
            width: 100%;
            height: 140px;
            object-fit: cover;
        }
        .video-info {
            padding: 15px;
        }
        .video-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.9rem;
            line-height: 1.3;
        }
        .video-stats {
            font-size: 0.8rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <img src="${data.thumbnail}" alt="${data.title}" class="avatar">
            <div class="channel-info">
                <h1>${data.title}</h1>
                <p>${data.description.substring(0, 150)}...</p>
            </div>
        </header>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${parseInt(data.subscriberCount).toLocaleString()}</div>
                <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat">
                <div class="stat-number">${parseInt(data.videoCount).toLocaleString()}</div>
                <div class="stat-label">Videos</div>
            </div>
            <div class="stat">
                <div class="stat-number">${parseInt(data.viewCount).toLocaleString()}</div>
                <div class="stat-label">Views</div>
            </div>
        </div>

        <div class="content">
            <div class="card">
                <h3>About ${data.title}</h3>
                <p>${data.description}</p>
            </div>
            <div class="card">
                <h3>Latest Content</h3>
                <p>Check out our latest videos and stay updated with fresh content!</p>
            </div>
            <div class="card">
                <h3>Connect With Us</h3>
                <p>Join our community and be part of the conversation!</p>
            </div>
        </div>

        ${data.videos && data.videos.length > 0 ? `
        <div class="videos-grid">
            ${data.videos.slice(0, 6).map(video => `
                <div class="video-card">
                    <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail">
                    <div class="video-info">
                        <div class="video-title">${video.title}</div>
                        <div class="video-stats">${parseInt(video.viewCount).toLocaleString()} views</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>
</body>
</html>`;

    // Update the index.html file
    updateFileContent('index.html', code);
    
    return code;
  }, [updateFileContent]);

  return {
    projectFiles,
    youtubeData,
    updateFileContent,
    addFile,
    fetchYouTubeData,
    generateWebsiteCode
  };
};
