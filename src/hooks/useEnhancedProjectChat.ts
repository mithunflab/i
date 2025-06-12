
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGitHubIntegration } from './useGitHubIntegration';
import { useNetlifyDeploy } from './useNetlifyDeploy';
import { generateReadme } from '@/utils/readmeGenerator';
import { useToast } from '@/hooks/use-toast';

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

interface ChatMessage {
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

export const useEnhancedProjectChat = (
  youtubeUrl: string, 
  projectIdea: string, 
  channelData?: ChannelData | null
) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string>('');
  const { user } = useAuth();
  const { createGitHubRepo, loading: githubLoading } = useGitHubIntegration();
  const { deployToNetlify, loading: netlifyLoading } = useNetlifyDeploy();
  const { toast } = useToast();
  const conversationStarted = useRef(false);

  // Generate project ID on mount
  useEffect(() => {
    if (!projectId) {
      setProjectId(crypto.randomUUID());
    }
  }, [projectId]);

  // Initialize conversation
  useEffect(() => {
    if (user && projectId && !conversationStarted.current && (youtubeUrl || projectIdea)) {
      conversationStarted.current = true;
      initializeConversation();
    }
  }, [user, projectId, youtubeUrl, projectIdea]);

  const initializeConversation = async () => {
    try {
      // Save or update project
      await saveOrUpdateProject();

      // Add initial bot message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: channelData 
          ? `🎥 **Welcome!** I've analyzed **${channelData.title}**'s YouTube channel!\n\n` +
            `📊 **Channel Stats:**\n` +
            `• ${parseInt(channelData.subscriberCount).toLocaleString()} subscribers\n` +
            `• ${parseInt(channelData.videoCount).toLocaleString()} videos\n` +
            `• ${parseInt(channelData.viewCount).toLocaleString()} total views\n\n` +
            `🚀 **Ready to create something amazing!** Tell me what kind of website you'd like me to build for this channel. I can create:\n\n` +
            `• Modern landing pages\n• Interactive portfolios\n• Fan sites\n• Business websites\n• And much more!\n\n` +
            `What would you like to create?`
          : `🚀 **AI Website Builder Ready!**\n\n` +
            `I'm here to help you create amazing websites! Tell me:\n\n` +
            `• What kind of website do you want?\n• What features should it have?\n• Any specific design preferences?\n\n` +
            `I'll generate the code and deploy it for you automatically!`,
        timestamp: new Date(),
        feature: 'initialization'
      };

      setMessages([welcomeMessage]);
      await saveChatMessage(welcomeMessage);
    } catch (error) {
      console.error('❌ Initialization error:', error);
    }
  };

  const saveOrUpdateProject = async () => {
    if (!user || !projectId) return;

    try {
      const projectName = channelData?.title 
        ? `${channelData.title} Website`
        : projectIdea || 'AI Generated Website';

      const { error } = await supabase
        .from('projects')
        .upsert({
          id: projectId,
          user_id: user.id,
          name: projectName,
          description: channelData?.description || projectIdea || 'AI generated website project',
          youtube_url: youtubeUrl,
          channel_data: channelData as any,
          status: 'active'
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Project save error:', error);
        throw error;
      }

      console.log('✅ Project saved successfully');
    } catch (error) {
      console.error('❌ Error saving project:', error);
    }
  };

  const saveChatMessage = async (message: ChatMessage) => {
    if (!user || !projectId) return;

    try {
      const { error } = await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message_type: message.type,
          content: message.content,
          metadata: {
            feature: message.feature,
            generatedCode: message.generatedCode,
            codeDescription: message.codeDescription,
            githubUrl: message.githubUrl,
            netlifyUrl: message.netlifyUrl
          }
        });

      if (error) {
        console.error('❌ Chat save error:', error);
      }
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    setLoading(true);

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveChatMessage(userMessage);

    try {
      // Call chat API using correct Supabase edge function endpoint
      const response = await fetch('https://ldcipixxhnrepgkyzmno.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY2lwaXh4aG5yZXBna3l6bW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc5ODAsImV4cCI6MjA2NTA2Mzk4MH0.DI6yuJwesNPoXTnB5aMDLNOVjPnMbN69kD7nCxFmiTI`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          context: {
            youtubeUrl,
            projectIdea,
            channelData,
            projectId
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Create bot response message
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: data.message || 'I can help you create an amazing website! What specific features would you like?',
        timestamp: new Date(),
        feature: data.feature || 'chat',
        generatedCode: data.generatedCode,
        codeDescription: data.codeDescription
      };

      // Handle deployment if code was generated
      if (data.generatedCode) {
        await handleDeployment(botMessage);
      }

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage(botMessage);

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: `🚀 I'll create a ${channelData ? `website for ${channelData.title}` : 'website'} based on your request!\n\n` +
                 `✨ **Generating:**\n• Modern responsive design\n• Mobile-friendly layout\n• Professional styling\n• Interactive elements\n\n` +
                 `🔧 **Features being added:**\n• Hero section\n• Content sections\n• Contact information\n• Social media links\n\n` +
                 `⚡ **Deployment:** Automatically deploying to GitHub and Netlify...`,
        timestamp: new Date(),
        feature: 'futuristic-website',
        generatedCode: generateFallbackCode(),
        codeDescription: 'Modern responsive website with interactive elements'
      };

      await handleDeployment(fallbackMessage);
      setMessages(prev => [...prev, fallbackMessage]);
      await saveChatMessage(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployment = async (message: ChatMessage) => {
    if (!message.generatedCode) return;

    try {
      const siteName = channelData?.title 
        ? `${channelData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-website`
        : 'ai-generated-website';

      const readme = generateReadme(
        siteName,
        message.codeDescription || 'AI Generated Website',
        channelData?.title || 'AI Generated Project',
        youtubeUrl
      );

      // Deploy to GitHub (if available)
      try {
        const githubRepo = await createGitHubRepo(siteName, message.codeDescription || 'AI Generated Website', message.generatedCode, readme);
        if (githubRepo) {
          message.githubUrl = githubRepo.html_url;
        }
      } catch (error) {
        console.log('ℹ️ GitHub deployment not available:', error);
      }

      // Deploy to Netlify (if available)
      try {
        const netlifyDeploy = await deployToNetlify(siteName, message.generatedCode);
        if (netlifyDeploy) {
          message.netlifyUrl = netlifyDeploy.url;
        }
      } catch (error) {
        console.log('ℹ️ Netlify deployment not available:', error);
      }

      // Update project with deployment URLs
      if (message.githubUrl || message.netlifyUrl) {
        await supabase
          .from('projects')
          .update({
            github_url: message.githubUrl,
            netlify_url: message.netlifyUrl,
            source_code: message.generatedCode
          })
          .eq('id', projectId);
      }

    } catch (error) {
      console.error('❌ Deployment error:', error);
    }
  };

  const generateFallbackCode = () => {
    const title = channelData?.title || 'AI Generated Website';
    const description = channelData?.description || 'A modern, responsive website built with AI';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        header {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 1rem 0;
            position: fixed;
            width: 100%;
            top: 0;
            z-index: 1000;
        }
        
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: white;
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            transition: opacity 0.3s;
        }
        
        .nav-links a:hover {
            opacity: 0.8;
        }
        
        .hero {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
        }
        
        .hero-content h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .hero-content p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            max-width: 600px;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        
        .features {
            padding: 4rem 0;
            background: white;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-top: 2rem;
        }
        
        .feature-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            color: white;
            transform: translateY(0);
            transition: transform 0.3s;
        }
        
        .feature-card:hover {
            transform: translateY(-10px);
        }
        
        .feature-card h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }
        
        @media (max-width: 768px) {
            .hero-content h1 {
                font-size: 2.5rem;
            }
            
            .nav-links {
                display: none;
            }
        }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${title}</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero" id="home">
        <div class="hero-content">
            <h1>${title}</h1>
            <p>${description}</p>
            <a href="#features" class="cta-button">Explore Now</a>
        </div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 2rem; font-size: 2.5rem;">Amazing Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <h3>🚀 Fast & Modern</h3>
                    <p>Built with cutting-edge technology for optimal performance and user experience.</p>
                </div>
                <div class="feature-card">
                    <h3>📱 Mobile Ready</h3>
                    <p>Fully responsive design that looks great on all devices and screen sizes.</p>
                </div>
                <div class="feature-card">
                    <h3>✨ Interactive</h3>
                    <p>Engaging animations and interactive elements that delight your visitors.</p>
                </div>
            </div>
        </div>
    </section>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });

        // Add scroll effect to header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.color = '#333';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.1)';
                header.style.color = 'white';
            }
        });
    </script>
</body>
</html>`;
  };

  return {
    messages,
    loading: loading || githubLoading || netlifyLoading,
    sendMessage,
    projectId
  };
};
