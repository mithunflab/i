
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
        { name: 'interpreter.js', type: 'file', extension: 'js', content: '// AI interpretation logic\nconsole.log("AI interpreter ready");' },
        { name: 'aieditor.js', type: 'file', extension: 'js', content: '// AI editor functionality\nconsole.log("AI editor initialized");' },
        { name: 'componentmap.js', type: 'file', extension: 'js', content: '// Component mapping\nconst componentMap = {};' },
        { name: 'design.json', type: 'file', extension: 'json', content: '{\n  "theme": "youtube-red",\n  "primary": "#ff0000",\n  "secondary": "#cc0000"\n}' },
        { name: 'changelog.md', type: 'file', extension: 'md', content: '# Changelog\n\n## v1.0.0\n- Initial release\n- AI-powered website generation\n' },
        { name: 'readme.md', type: 'file', extension: 'md', content: '# AI-Generated YouTube Website\n\nThis website was created using AI technology.\n\n## Features\n- Responsive design\n- YouTube integration\n- Real-time editing\n' },
        { name: 'projectchat.json', type: 'file', extension: 'json', content: '[]' },
        { name: 'yticon.json', type: 'file', extension: 'json', content: '{}' }
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

    // Update chat history file if it's a chat update
    if (fileName === 'projectchat.json') {
      localStorage.setItem('project-chat-history', content);
    }
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
        
        // Store YouTube data in yticon file with enhanced data
        const enhancedData = {
          ...channelData,
          fetchedAt: new Date().toISOString(),
          sourceUrl: youtubeUrl,
          apiUsed: apiKey.name,
          metadata: {
            totalVideos: channelData.videos?.length || 0,
            averageViews: channelData.videos?.reduce((sum: number, video: any) => sum + parseInt(video.viewCount || '0'), 0) / (channelData.videos?.length || 1),
            latestVideoDate: channelData.videos?.[0]?.publishedAt || null
          }
        };
        
        updateFileContent('yticon.json', JSON.stringify(enhancedData, null, 2));

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
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { 
        font-family: 'Poppins', sans-serif; 
        scroll-behavior: smooth;
      }
      .youtube-gradient { 
        background: linear-gradient(135deg, #ff0000, #cc0000, #990000, #660000); 
      }
      .glass-card { 
        backdrop-filter: blur(20px); 
        background: rgba(255, 255, 255, 0.08); 
        border: 1px solid rgba(255, 255, 255, 0.15); 
      }
      .shine { 
        background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%); 
        animation: shine 3s infinite;
      }
      @keyframes shine {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      .pulse-glow {
        animation: pulse-glow 2s infinite;
      }
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.3); }
        50% { box-shadow: 0 0 30px rgba(255, 0, 0, 0.6); }
      }
      .hover-lift {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .hover-lift:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      }
    </style>
</head>
<body class="bg-gradient-to-br from-red-950 via-red-900 to-black text-white min-h-screen">
    <!-- Hero Header -->
    <header class="glass-card rounded-2xl m-4 p-8 shine relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-red-600/20 to-transparent"></div>
        <div class="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-6">
                <img src="${channelData.thumbnail}" alt="${channelData.title}" 
                     class="w-20 h-20 rounded-full border-4 border-red-500 shadow-2xl pulse-glow">
                <div>
                    <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-300 to-pink-400">
                        ${channelData.title}
                    </h1>
                    <p class="text-red-300 text-lg font-medium">
                        ${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers
                    </p>
                    <p class="text-red-400 text-sm opacity-80 mt-1">
                        ${parseInt(channelData.videoCount || '0').toLocaleString()} videos • 
                        ${parseInt(channelData.viewCount || '0').toLocaleString()} total views
                    </p>
                </div>
            </div>
            <a href="${channelData.customUrl || '#'}" target="_blank" 
               class="youtube-gradient px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl pulse-glow">
                🔔 Subscribe Now
            </a>
        </div>
    </header>

    <!-- Main Content -->
    <main class="m-4 space-y-8">
        <!-- Welcome Section -->
        <section class="glass-card rounded-2xl p-10 text-center shine hover-lift">
            <h2 class="text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300">
                Welcome to ${channelData.title}
            </h2>
            <p class="text-xl text-red-300 mb-8 max-w-3xl mx-auto leading-relaxed">
                ${channelData.description?.substring(0, 200) || 'Join our amazing community and explore fascinating content!'}...
            </p>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div class="glass-card rounded-xl p-6 hover-lift">
                    <div class="text-4xl font-bold text-red-400 mb-2">
                        ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
                    </div>
                    <div class="text-red-300 font-medium">Subscribers</div>
                    <div class="text-red-500 text-sm opacity-75">Growing Community</div>
                </div>
                <div class="glass-card rounded-xl p-6 hover-lift">
                    <div class="text-4xl font-bold text-green-400 mb-2">
                        ${parseInt(channelData.videoCount || '100').toLocaleString()}
                    </div>
                    <div class="text-red-300 font-medium">Videos</div>
                    <div class="text-red-500 text-sm opacity-75">Quality Content</div>
                </div>
                <div class="glass-card rounded-xl p-6 hover-lift">
                    <div class="text-4xl font-bold text-blue-400 mb-2">
                        ${parseInt(channelData.viewCount || '1000000').toLocaleString()}
                    </div>
                    <div class="text-red-300 font-medium">Total Views</div>
                    <div class="text-red-500 text-sm opacity-75">Global Reach</div>
                </div>
            </div>
        </section>

        <!-- Latest Videos -->
        <section class="glass-card rounded-2xl p-8 shine">
            <h3 class="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-white to-red-300">
                🎬 Latest Videos
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${channelData.videos?.slice(0, 6).map((video, index) => `
                <div class="glass-card rounded-xl p-5 hover-lift group cursor-pointer" onclick="window.open('${video.embedUrl}', '_blank')">
                    <div class="relative overflow-hidden rounded-lg mb-4">
                        <img src="${video.thumbnail}" alt="${video.title}" 
                             class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                            ${video.duration.replace('PT', '').replace('M', ':').replace('S', '')}
                        </div>
                    </div>
                    <h4 class="font-bold text-white text-lg leading-tight mb-3 line-clamp-2 group-hover:text-red-300 transition-colors">
                        ${video.title}
                    </h4>
                    <div class="flex justify-between items-center text-sm">
                        <p class="text-red-400 font-medium">
                            👁️ ${parseInt(video.viewCount || '0').toLocaleString()} views
                        </p>
                        <p class="text-red-500 opacity-75">
                            ${new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                `).join('') || `
                <div class="glass-card rounded-xl p-6 hover-lift col-span-full text-center">
                    <div class="w-full h-40 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                        <span class="text-white font-bold text-2xl">🎥 Amazing Content Coming Soon!</span>
                    </div>
                    <h4 class="font-bold text-white text-xl">Stay Tuned</h4>
                    <p class="text-red-400">New videos are on the way!</p>
                </div>
                `}
            </div>
        </section>

        <!-- Call to Action -->
        <section class="glass-card rounded-2xl p-10 text-center shine">
            <h3 class="text-3xl font-bold mb-4 text-white">Join Our Community!</h3>
            <p class="text-red-300 mb-8 text-lg">Don't miss out on amazing content. Subscribe now and hit the bell icon!</p>
            <div class="flex justify-center gap-4 flex-wrap">
                <a href="${channelData.customUrl || '#'}" target="_blank" 
                   class="youtube-gradient px-8 py-3 rounded-full font-bold hover:scale-105 transition-all duration-300 shadow-lg">
                    🔔 Subscribe
                </a>
                <a href="${channelData.customUrl || '#'}" target="_blank" 
                   class="glass-card px-8 py-3 rounded-full font-bold hover:scale-105 transition-all duration-300 border-2 border-red-500">
                    📺 Watch Now
                </a>
            </div>
        </section>
    </main>

    <!-- Footer -->
    <footer class="glass-card rounded-2xl m-4 p-6 text-center shine">
        <p class="text-red-300 text-sm">
            © 2024 ${channelData.title}. Website generated with AI technology.
        </p>
    </footer>

    <script>
        // Add smooth scrolling and interactive effects
        document.addEventListener('DOMContentLoaded', function() {
            // Add parallax effect to background
            window.addEventListener('scroll', function() {
                const scrolled = window.pageYOffset;
                const parallax = document.querySelector('body');
                const speed = scrolled * 0.5;
                parallax.style.backgroundPosition = 'center ' + speed + 'px';
            });

            // Add click analytics
            document.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    console.log('Link clicked:', this.href);
                });
            });
        });
    </script>
</body>
</html>`;

    // Update project files with generated code
    updateFileContent('index.html', websiteCode);
    
    // Extract and update CSS
    const cssMatch = websiteCode.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    if (cssMatch) {
      updateFileContent('style.css', cssMatch[1].trim());
    }

    // Extract and update JavaScript
    const jsMatch = websiteCode.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (jsMatch && !jsMatch[0].includes('cdn.tailwindcss.com')) {
      updateFileContent('script.js', jsMatch[1].trim());
    }

    // Update changelog
    const changelogEntry = `\n## ${new Date().toLocaleDateString()} - Website Generated\n- Generated website for ${channelData.title}\n- Added ${channelData.videos?.length || 0} video previews\n- Implemented responsive design\n- Added YouTube integration\n`;
    const currentChangelog = getFileByName('changelog.md')?.content || '';
    updateFileContent('changelog.md', currentChangelog + changelogEntry);

    return websiteCode;
  }, [updateFileContent, getFileByName]);

  return {
    projectFiles,
    youtubeData,
    updateFileContent,
    fetchYouTubeData,
    getFileByName,
    generateWebsiteCode
  };
};
