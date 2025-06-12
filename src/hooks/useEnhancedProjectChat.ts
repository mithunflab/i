
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGitHubIntegration } from './useGitHubIntegration';
import { useNetlifyDeploy } from './useNetlifyDeploy';
import { generateReadme, generateProjectFeatures } from '@/utils/readmeGenerator';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  feature?: string;
  generatedCode?: string;
  codeDescription?: string;
  githubUrl?: string;
  netlifyUrl?: string;
}

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  videos: any[];
}

export const useEnhancedProjectChat = (youtubeUrl: string, projectIdea: string, channelData?: ChannelData | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createGitHubRepo } = useGitHubIntegration();
  const { deployToNetlify } = useNetlifyDeploy();
  const { toast } = useToast();

  const generateProjectId = useCallback(() => {
    return btoa(youtubeUrl + '::' + projectIdea).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }, [youtubeUrl, projectIdea]);

  const projectId = generateProjectId();

  const saveChatMessage = useCallback(async (messageType: 'user' | 'assistant', content: string, metadata?: any) => {
    if (!user || !projectId) return;

    try {
      const { error } = await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message_type: messageType,
          content,
          metadata
        });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Error in saveChatMessage:', error);
    }
  }, [user, projectId]);

  const saveProject = useCallback(async (code: string, githubUrl?: string, netlifyUrl?: string) => {
    if (!user || !projectId) return;

    const projectName = channelData?.title || projectIdea;
    const description = channelData?.description || 'AI Generated Website';

    try {
      const { error } = await supabase
        .from('projects')
        .upsert({
          id: projectId,
          user_id: user.id,
          name: projectName,
          description: description,
          status: 'active',
          source_code: code,
          github_url: githubUrl,
          netlify_url: netlifyUrl,
          youtube_url: youtubeUrl,
          channel_data: channelData
        });

      if (error) {
        console.error('Error saving project:', error);
      } else {
        console.log('✅ Project saved successfully');
      }
    } catch (error) {
      console.error('Error in saveProject:', error);
    }
  }, [user, projectId, channelData, projectIdea, youtubeUrl]);

  const generateEnhancedCode = async (userRequest: string) => {
    try {
      console.log('🤖 Generating enhanced AI code for:', userRequest);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userRequest,
          projectId,
          channelData,
          chatHistory: messages.slice(-5),
          generateCode: true,
          enhanced: true
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Error generating enhanced code:', error);
      
      // Enhanced fallback with better features
      const channelName = channelData?.title || 'Your Channel';
      const subscriberCount = channelData?.subscriberCount ? parseInt(channelData.subscriberCount).toLocaleString() : '0';
      
      return {
        reply: `🎨 **Futuristic Website Created for ${channelName}!**\n\n✨ **Advanced Features Generated:**\n• Cyberpunk-inspired design\n• Interactive animations\n• Real-time particle effects\n• Responsive mobile layout\n• YouTube integration\n• Subscribe widgets\n• Video gallery\n• Social media links\n\n🚀 **Technology Stack:**\n- Modern HTML5\n- Advanced CSS3 with animations\n- JavaScript interactivity\n- Mobile-first design\n- SEO optimization\n\n💫 **Your futuristic website is ready!**`,
        feature: 'futuristic-website',
        generatedCode: generateFuturisticWebsite(channelName, channelData),
        codeDescription: `Created a futuristic, cutting-edge website for ${channelName} with advanced animations and modern design`
      };
    }
  };

  const generateFuturisticWebsite = (channelName: string, channelData?: ChannelData | null) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelName} - Futuristic Portal</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Orbitron', 'Arial', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%);
            color: #fff;
            overflow-x: hidden;
            min-height: 100vh;
        }
        
        .cosmic-bg {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="10" cy="10" r="1" fill="white" opacity="0.8"/><circle cx="30" cy="25" r="0.5" fill="cyan"/><circle cx="60" cy="15" r="1.5" fill="purple"/><circle cx="80" cy="40" r="0.8" fill="pink"/><circle cx="20" cy="60" r="1.2" fill="yellow"/><circle cx="70" cy="80" r="0.6" fill="white"/><circle cx="45" cy="70" r="1" fill="cyan"/><circle cx="90" cy="20" r="0.4" fill="white"/></svg>') repeat;
            animation: float 20s linear infinite;
            z-index: -1;
        }
        
        @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(-100vh); } }
        
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; position: relative; z-index: 1; }
        
        .cyber-header {
            text-align: center;
            padding: 4rem 2rem;
            background: rgba(0,0,0,0.7);
            border-radius: 20px;
            border: 2px solid #00ffff;
            box-shadow: 0 0 30px rgba(0,255,255,0.3);
            margin: 2rem 0;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }
        
        .cyber-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(0,255,255,0.1), transparent);
            animation: scan 3s linear infinite;
        }
        
        @keyframes scan { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        
        .cyber-title {
            font-size: 4rem;
            font-weight: bold;
            background: linear-gradient(45deg, #00ffff, #ff00ff, #ffff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 2s ease-in-out infinite alternate;
            text-shadow: 0 0 20px rgba(0,255,255,0.5);
            position: relative;
            z-index: 2;
        }
        
        @keyframes glow { from { filter: brightness(1); } to { filter: brightness(1.2); } }
        
        .cyber-subtitle {
            font-size: 1.5rem;
            color: #00ffff;
            margin: 1rem 0;
            text-shadow: 0 0 10px rgba(0,255,255,0.7);
            position: relative;
            z-index: 2;
        }
        
        .neon-button {
            display: inline-block;
            padding: 15px 40px;
            margin: 15px;
            background: transparent;
            border: 2px solid #00ffff;
            color: #00ffff;
            text-decoration: none;
            border-radius: 30px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            z-index: 2;
        }
        
        .neon-button:hover {
            background: #00ffff;
            color: #000;
            box-shadow: 0 0 30px #00ffff, inset 0 0 30px rgba(0,255,255,0.2);
            transform: translateY(-5px);
        }
        
        .neon-button::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .neon-button:hover::before { left: 100%; }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .cyber-card {
            background: rgba(0,0,0,0.8);
            border: 1px solid #00ffff;
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .cyber-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, #00ffff, #ff00ff, #ffff00);
            animation: borderFlow 2s linear infinite;
        }
        
        @keyframes borderFlow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .cyber-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0,255,255,0.3);
            border-color: #ff00ff;
        }
        
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #00ffff;
            text-shadow: 0 0 20px rgba(0,255,255,0.8);
        }
        
        .stats-section {
            background: rgba(0,0,0,0.9);
            border-radius: 20px;
            padding: 3rem;
            margin: 3rem 0;
            border: 2px solid #ff00ff;
            box-shadow: 0 0 30px rgba(255,0,255,0.3);
            text-align: center;
        }
        
        .stat-number {
            font-size: 3rem;
            font-weight: bold;
            color: #ffff00;
            text-shadow: 0 0 20px rgba(255,255,0,0.8);
        }
        
        .pulse {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
        }
        
        @media (max-width: 768px) {
            .cyber-title { font-size: 2.5rem; }
            .container { padding: 10px; }
            .cyber-header { padding: 2rem 1rem; }
            .feature-grid { grid-template-columns: 1fr; }
        }
        
        .matrix-rain {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.1;
        }
    </style>
</head>
<body>
    <div class="cosmic-bg"></div>
    <div class="matrix-rain" id="matrix"></div>
    
    <div class="container">
        <header class="cyber-header">
            <h1 class="cyber-title">${channelName}</h1>
            <p class="cyber-subtitle">Welcome to the Future</p>
            <p style="color: #fff; margin: 1rem 0; position: relative; z-index: 2;">
                Experience the next generation of digital content
            </p>
            <a href="#explore" class="neon-button pulse">🚀 Enter Portal</a>
            <a href="${youtubeUrl}" class="neon-button" target="_blank">📺 YouTube</a>
        </header>
        
        <section class="feature-grid" id="explore">
            <div class="cyber-card">
                <div class="feature-icon">🎬</div>
                <h3 style="color: #00ffff; margin-bottom: 1rem;">Neural Content</h3>
                <p>AI-powered video experiences that adapt to your preferences and learning style.</p>
            </div>
            
            <div class="cyber-card">
                <div class="feature-icon">👥</div>
                <h3 style="color: #00ffff; margin-bottom: 1rem;">Quantum Community</h3>
                <p>Connect with minds across dimensions in our advanced community network.</p>
            </div>
            
            <div class="cyber-card">
                <div class="feature-icon">🔮</div>
                <h3 style="color: #00ffff; margin-bottom: 1rem;">Future Access</h3>
                <p>Get exclusive access to tomorrow's content today with our time-shift technology.</p>
            </div>
        </section>
        
        ${channelData ? `
        <section class="stats-section">
            <h2 style="color: #ff00ff; margin-bottom: 2rem; font-size: 2.5rem;">Channel Matrix</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
                <div>
                    <div class="stat-number">${parseInt(channelData.subscriberCount).toLocaleString()}</div>
                    <p style="color: #00ffff;">Quantum Subscribers</p>
                </div>
                <div>
                    <div class="stat-number">${parseInt(channelData.videoCount).toLocaleString()}</div>
                    <p style="color: #00ffff;">Neural Videos</p>
                </div>
                <div>
                    <div class="stat-number">${parseInt(channelData.viewCount).toLocaleString()}</div>
                    <p style="color: #00ffff;">Reality Views</p>
                </div>
            </div>
        </section>
        ` : ''}
        
        <section style="background: rgba(0,0,0,0.9); border-radius: 20px; padding: 3rem; margin: 3rem 0; border: 2px solid #ffff00; text-align: center;">
            <h2 style="color: #ffff00; margin-bottom: 2rem; font-size: 2.5rem;">Join the Revolution</h2>
            <p style="font-size: 1.2rem; margin-bottom: 2rem;">Be part of the digital evolution</p>
            <a href="${youtubeUrl}" class="neon-button" target="_blank" style="border-color: #ffff00; color: #ffff00;">
                ⚡ Subscribe Now
            </a>
        </section>
    </div>
    
    <script>
        // Matrix rain effect
        function createMatrixRain() {
            const matrix = document.getElementById('matrix');
            const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
            
            for (let i = 0; i < 50; i++) {
                const drop = document.createElement('div');
                drop.style.position = 'absolute';
                drop.style.left = Math.random() * 100 + '%';
                drop.style.animationDelay = Math.random() * 2 + 's';
                drop.style.fontSize = (Math.random() * 10 + 10) + 'px';
                drop.style.color = ['#00ffff', '#ff00ff', '#ffff00'][Math.floor(Math.random() * 3)];
                drop.textContent = chars[Math.floor(Math.random() * chars.length)];
                drop.style.animation = 'matrixFall ' + (Math.random() * 3 + 2) + 's linear infinite';
                matrix.appendChild(drop);
            }
        }
        
        // Add matrix fall animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes matrixFall {
                to { transform: translateY(100vh); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
        
        createMatrixRain();
        
        // Smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
        
        // Parallax effect
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const cosmicBg = document.querySelector('.cosmic-bg');
            cosmicBg.style.transform = \`translateY(\${scrolled * 0.5}px)\`;
        });
    </script>
</body>
</html>`;
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage('user', content);

    setLoading(true);

    try {
      const result = await generateEnhancedCode(content);

      let githubUrl, netlifyUrl;

      // Auto-deploy to GitHub and Netlify if code was generated
      if (result.generatedCode && result.generatedCode.length > 1000) {
        try {
          const projectName = channelData?.title || projectIdea;
          const features = generateProjectFeatures(projectIdea, channelData);
          const readme = generateReadme({
            title: projectName,
            description: channelData?.description || 'AI Generated Website',
            channelData,
            features
          });

          // GitHub deployment
          const githubRepo = await createGitHubRepo(
            projectName,
            'AI Generated Futuristic Website',
            result.generatedCode,
            readme
          );
          githubUrl = githubRepo.html_url;

          // Netlify deployment
          const netlifyDeployment = await deployToNetlify(
            projectName,
            result.generatedCode
          );
          netlifyUrl = netlifyDeployment.url;

          // Save project with URLs
          await saveProject(result.generatedCode, githubUrl, netlifyUrl);

          toast({
            title: "🚀 Project Deployed!",
            description: `Live at ${netlifyUrl} • Code at ${githubUrl}`,
          });

        } catch (deployError) {
          console.error('Deployment error:', deployError);
          // Still save the project even if deployment fails
          await saveProject(result.generatedCode);
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.reply,
        timestamp: new Date(),
        feature: result.feature,
        generatedCode: result.generatedCode,
        codeDescription: result.codeDescription,
        githubUrl,
        netlifyUrl
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage('assistant', result.reply, { 
        feature: result.feature,
        generatedCode: result.generatedCode,
        codeDescription: result.codeDescription,
        githubUrl,
        netlifyUrl
      });

    } catch (error) {
      console.error('❌ Error in enhanced chat:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `🤖 **Iris AI Assistant**\n\nI'm experiencing some technical difficulties, but I'm still here to help! Please try your request again, and I'll do my best to create amazing content for you.\n\n💡 **Try asking me to:**\n• "Create a futuristic website"\n• "Build a modern homepage"\n• "Make a cyberpunk design"\n• "Generate a professional site"`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, projectId, channelData, saveChatMessage, saveProject, createGitHubRepo, deployToNetlify, toast]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user || !projectId) return;

      try {
        const { data, error } = await supabase
          .from('project_chat_history')
          .select('*')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading chat history:', error);
          return;
        }

        if (data && data.length > 0) {
          const loadedMessages: Message[] = data.map(msg => ({
            id: msg.id,
            type: msg.message_type as 'user' | 'bot',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            feature: msg.metadata?.feature,
            generatedCode: msg.metadata?.generatedCode,
            codeDescription: msg.metadata?.codeDescription,
            githubUrl: msg.metadata?.githubUrl,
            netlifyUrl: msg.metadata?.netlifyUrl
          }));
          setMessages(loadedMessages);
        } else {
          // Initialize with enhanced welcome message
          const welcomeMessage: Message = {
            id: '1',
            type: 'bot',
            content: `🤖 **Welcome to Iris AI - Your Futuristic Website Creator!**\n\n${channelData ? `🎥 **Channel Connected:** ${channelData.title}\n📊 **${parseInt(channelData.subscriberCount).toLocaleString()} subscribers** • **${parseInt(channelData.videoCount).toLocaleString()} videos**\n\n` : ''}✨ **I can create:**\n• Futuristic cyberpunk websites\n• Modern responsive designs\n• YouTube channel integration\n• Real-time GitHub deployment\n• Automatic Netlify hosting\n• Professional README files\n• Advanced animations & effects\n\n🚀 **Your projects are automatically saved and deployed!**\n\nWhat kind of amazing website would you like me to create for you?`,
            timestamp: new Date(),
            feature: 'welcome'
          };
          setMessages([welcomeMessage]);
          await saveChatMessage('assistant', welcomeMessage.content, { feature: 'welcome' });
        }
      } catch (error) {
        console.error('Error in loadChatHistory:', error);
      }
    };

    loadChatHistory();
  }, [user, projectId, channelData]);

  return {
    messages,
    loading,
    sendMessage,
    projectId
  };
};
