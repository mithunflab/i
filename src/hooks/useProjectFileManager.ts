
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

interface YouTubeData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl: string;
  videos: Array<{
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: string;
    duration: string;
    embedUrl: string;
  }>;
}

export const useProjectFileManager = () => {
  const [projectFiles, setProjectFiles] = useState<FileNode[]>([
    {
      name: 'src',
      type: 'folder',
      children: [
        { name: 'index.html', type: 'file', extension: 'html', content: '' },
        { name: 'style.css', type: 'file', extension: 'css', content: '' },
        { name: 'script.js', type: 'file', extension: 'js', content: '' },
        { name: 'interpreter.js', type: 'file', extension: 'js', content: '' },
        { name: 'aieditor.js', type: 'file', extension: 'js', content: '' },
        { name: 'componentmap.js', type: 'file', extension: 'js', content: '' },
        { name: 'design.json', type: 'file', extension: 'json', content: '' },
        { name: 'changelog.md', type: 'file', extension: 'md', content: '' },
        { name: 'readme.md', type: 'file', extension: 'md', content: '' },
        { name: 'projectchat', type: 'file', content: '' },
        { name: 'yticon', type: 'file', content: '' }
      ]
    }
  ]);
  
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);
  const { toast } = useToast();

  const updateFileContent = useCallback((fileName: string, content: string) => {
    setProjectFiles(prev => {
      const updateFile = (files: FileNode[]): FileNode[] => {
        return files.map(file => {
          if (file.name === fileName) {
            return { ...file, content };
          }
          if (file.children) {
            return { ...file, children: updateFile(file.children) };
          }
          return file;
        });
      };
      return updateFile(prev);
    });
  }, []);

  const getFileByName = useCallback((fileName: string): FileNode | null => {
    const findFile = (files: FileNode[]): FileNode | null => {
      for (const file of files) {
        if (file.name === fileName) {
          return file;
        }
        if (file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFile(projectFiles);
  }, [projectFiles]);

  const extractChannelIdentifier = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (pathname.includes('/channel/')) {
        return pathname.split('/channel/')[1].split('/')[0];
      }
      if (pathname.includes('/c/')) {
        return pathname.split('/c/')[1].split('/')[0];
      }
      if (pathname.includes('/user/')) {
        return pathname.split('/user/')[1].split('/')[0];
      }
      if (pathname.includes('/@')) {
        return pathname.split('/@')[1].split('/')[0];
      }
      if (pathname.length > 1) {
        const channelName = pathname.substring(1).split('/')[0];
        if (channelName && !channelName.includes('watch')) {
          return channelName;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const fetchYouTubeData = useCallback(async (youtubeUrl: string): Promise<YouTubeData> => {
    const channelIdentifier = extractChannelIdentifier(youtubeUrl);
    
    if (!channelIdentifier) {
      throw new Error('Invalid YouTube URL format');
    }

    console.log('🎥 Fetching YouTube data for:', channelIdentifier);

    // Try to get available YouTube API keys
    const { data: apiKeys, error: apiError } = await supabase
      .from('youtube_api_keys')
      .select('*')
      .eq('is_active', true)
      .order('last_used_at', { ascending: true, nullsFirst: true });

    if (apiError) {
      console.error('Error fetching API keys:', apiError);
      throw new Error('Failed to fetch API configuration');
    }

    if (!apiKeys || apiKeys.length === 0) {
      throw new Error('No YouTube API keys available. Please contact support.');
    }

    let lastError = null;

    // Try each API key until one works
    for (const apiKey of apiKeys) {
      try {
        console.log(`🔑 Trying API key: ${apiKey.name}`);
        
        const { data, error } = await supabase.functions.invoke('youtube-integration', {
          body: {
            channelIdentifier,
            fetchVideos: true,
            maxResults: 12,
            apiKeyId: apiKey.id
          }
        });

        if (error) {
          console.warn(`❌ API key ${apiKey.name} failed:`, error.message);
          lastError = error;
          
          // Update API key usage tracking
          await supabase
            .from('youtube_api_keys')
            .update({ 
              last_used_at: new Date().toISOString(),
              quota_used: apiKey.quota_used + 1
            })
            .eq('id', apiKey.id);
          
          continue;
        }

        if (!data?.channel) {
          console.warn(`❌ API key ${apiKey.name} returned no data`);
          continue;
        }

        console.log(`✅ Successfully fetched data using API key: ${apiKey.name}`);
        
        // Update successful API key usage
        await supabase
          .from('youtube_api_keys')
          .update({ 
            last_used_at: new Date().toISOString(),
            quota_used: apiKey.quota_used + 1
          })
          .eq('id', apiKey.id);

        const channelData = data.channel;
        setYoutubeData(channelData);
        
        // Store YouTube data in yticon file
        updateFileContent('yticon', JSON.stringify({
          channelData,
          fetchedAt: new Date().toISOString(),
          sourceUrl: youtubeUrl
        }, null, 2));

        return channelData;

      } catch (error) {
        console.warn(`❌ API key ${apiKey.name} encountered error:`, error);
        lastError = error;
        continue;
      }
    }

    // If all API keys failed, throw the last error
    console.error('❌ All YouTube API keys failed');
    throw lastError || new Error('All YouTube API keys are currently unavailable');

  }, [updateFileContent]);

  const generateWebsiteCode = useCallback((channelData: YouTubeData) => {
    const websiteCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData.title} - Official Website</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      * { font-family: 'Poppins', sans-serif; }
      .youtube-gradient { background: linear-gradient(135deg, #ff0000, #cc0000, #990000); }
      .glass-card { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); }
      .shine { background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%); }
    </style>
</head>
<body class="bg-gradient-to-br from-red-950 via-red-900 to-black text-white min-h-screen">
    <header class="glass-card rounded-2xl m-4 p-6 shine">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <img src="${channelData.thumbnail}" alt="${channelData.title}" class="w-16 h-16 rounded-full border-4 border-red-500 shadow-xl">
                <div>
                    <h1 class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">${channelData.title}</h1>
                    <p class="text-red-300">${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers</p>
                </div>
            </div>
            <a href="${channelData.customUrl || '#'}" target="_blank" class="youtube-gradient px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform shadow-lg">
                Subscribe Now
            </a>
        </div>
    </header>

    <main class="m-4">
        <section class="glass-card rounded-2xl p-8 mb-8 text-center shine">
            <h2 class="text-4xl font-bold mb-4">Welcome to ${channelData.title}</h2>
            <p class="text-xl text-red-300 mb-8">Join our amazing community of ${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers!</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-red-400">${parseInt(channelData.subscriberCount || '0').toLocaleString()}</div>
                    <div class="text-red-300">Subscribers</div>
                </div>
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-green-400">${parseInt(channelData.videoCount || '100').toLocaleString()}</div>
                    <div class="text-red-300">Videos</div>
                </div>
                <div class="glass-card rounded-xl p-6">
                    <div class="text-3xl font-bold text-blue-400">${parseInt(channelData.viewCount || '1000000').toLocaleString()}</div>
                    <div class="text-red-300">Total Views</div>
                </div>
            </div>
        </section>

        <section class="glass-card rounded-2xl p-8 shine">
            <h3 class="text-2xl font-bold mb-6 text-center">Latest Videos</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${channelData.videos?.slice(0, 6).map((video, index) => `
                <div class="glass-card rounded-xl p-4 hover:scale-105 transition-transform">
                    <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-40 object-cover rounded-lg mb-4">
                    <h4 class="font-semibold text-white truncate">${video.title}</h4>
                    <p class="text-red-400 text-sm">${parseInt(video.viewCount || '0').toLocaleString()} views</p>
                </div>
                `).join('') || `
                <div class="glass-card rounded-xl p-4 hover:scale-105 transition-transform">
                    <div class="w-full h-40 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                        <span class="text-white font-bold">Latest Video</span>
                    </div>
                    <h4 class="font-semibold text-white">Amazing Content</h4>
                    <p class="text-red-400 text-sm">Coming Soon</p>
                </div>
                `}
            </div>
        </section>
    </main>
</body>
</html>`;

    // Update project files with generated code
    updateFileContent('index.html', websiteCode);
    
    // Extract and update CSS
    const cssMatch = websiteCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (cssMatch) {
      updateFileContent('style.css', cssMatch[1].trim());
    }

    return websiteCode;
  }, [updateFileContent]);

  return {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    getFileByName,
    generateWebsiteCode
  };
};
