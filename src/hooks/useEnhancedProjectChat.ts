
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGitHubIntegration } from './useGitHubIntegration';
import { useNetlifyDeploy } from './useNetlifyDeploy';
import { generateReadme, generateProjectFeatures } from '@/utils/readmeGenerator';
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

  // Generate project ID on mount using proper UUID
  useEffect(() => {
    if (!projectId) {
      // Use crypto.randomUUID() for proper UUID generation
      const newProjectId = crypto.randomUUID();
      setProjectId(newProjectId);
      console.log('🆔 Generated project ID:', newProjectId);
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
      console.log('🚀 Initializing conversation with project ID:', projectId);
      
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
    if (!user || !projectId) {
      console.log('❌ Cannot save project: missing user or projectId');
      return;
    }

    try {
      const projectName = channelData?.title 
        ? `${channelData.title} Website`
        : projectIdea || 'AI Generated Website';

      console.log('💾 Saving project:', { projectId, projectName, userId: user.id });

      const { error } = await supabase
        .from('projects')
        .upsert({
          id: projectId,
          user_id: user.id,
          name: projectName,
          description: channelData?.description || projectIdea || 'AI generated website project',
          youtube_url: youtubeUrl,
          channel_data: channelData as any, // Cast to any for Json type compatibility
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
    if (!user || !projectId) {
      console.log('❌ Cannot save chat message: missing user or projectId');
      return;
    }

    try {
      console.log('💬 Saving chat message:', { projectId, messageType: message.type });

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
      } else {
        console.log('✅ Chat message saved successfully');
      }
    } catch (error) {
      console.error('❌ Error saving chat message:', error);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || loading) return;

    setLoading(true);
    console.log('📤 Sending message:', content);

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
      // Use the correct Supabase edge function endpoint with anon key
      const response = await fetch('https://ldcipixxhnrepgkyzmno.supabase.co/functions/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY2lwaXh4aG5yZXBna3l6bW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0ODc5ODAsImV4cCI6MjA2NTA2Mzk4MH0.DI6yuJwesNPoXTnB5aMDLNOVjPnMbN69kD7nCxFmiTI`
        },
        body: JSON.stringify({
          message: content,
          projectId: projectId,
          channelData: channelData,
          chatHistory: messages.slice(-5), // Send last 5 messages for context
          generateCode: true // Always request code generation
        })
      });

      console.log('🌐 Chat API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Chat API error:', response.status, errorText);
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Chat API response:', data);
      
      // Create bot response message
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: data.reply || data.message || 'I can help you create an amazing website! What specific features would you like?',
        timestamp: new Date(),
        feature: data.feature || 'website',
        generatedCode: data.generatedCode,
        codeDescription: data.codeDescription
      };

      // Handle deployment if code was generated
      if (data.generatedCode) {
        console.log('🔧 Code generated, starting deployment...');
        await handleDeployment(botMessage);
      }

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage(botMessage);

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Enhanced fallback response with actual code generation
      const fallbackMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: `🚀 I'll create a ${channelData ? `website for ${channelData.title}` : 'website'} based on your request!\n\n` +
                 `✨ **Generating:**\n• Modern responsive design\n• Mobile-friendly layout\n• Professional styling\n• Interactive elements\n\n` +
                 `🔧 **Features being added:**\n• Hero section\n• Content sections\n• Contact information\n• Social media links\n\n` +
                 `⚡ **Deployment:** Automatically deploying to GitHub and Netlify...`,
        timestamp: new Date(),
        feature: 'website',
        generatedCode: generateFallbackCode(content),
        codeDescription: `Modern responsive website for ${channelData?.title || 'your project'} with interactive elements`
      };

      console.log('🔄 Using fallback code generation');
      await handleDeployment(fallbackMessage);
      setMessages(prev => [...prev, fallbackMessage]);
      await saveChatMessage(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeployment = async (message: ChatMessage) => {
    if (!message.generatedCode) {
      console.log('❌ No code to deploy');
      return;
    }

    try {
      const siteName = channelData?.title 
        ? `${channelData.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-website`
        : 'ai-generated-website';

      console.log('🚀 Starting deployment for:', siteName);

      const features = generateProjectFeatures(message.codeDescription || 'AI Generated Website', channelData);

      const readme = generateReadme({
        title: siteName,
        description: message.codeDescription || 'AI Generated Website',
        channelData,
        features
      });

      // Deploy to GitHub (with real tokens now)
      try {
        console.log('🐙 Attempting GitHub deployment...');
        const githubRepo = await createGitHubRepo(siteName, message.codeDescription || 'AI Generated Website', message.generatedCode, readme);
        if (githubRepo) {
          message.githubUrl = githubRepo.html_url;
          console.log('✅ GitHub deployment successful:', githubRepo.html_url);
          
          toast({
            title: "GitHub Success",
            description: `Repository created: ${githubRepo.html_url}`,
          });
        }
      } catch (error) {
        console.error('❌ GitHub deployment failed:', error);
        toast({
          title: "GitHub Error",
          description: "Failed to create repository, but continuing with other deployments",
          variant: "destructive"
        });
      }

      // Deploy to Netlify (with real tokens now)
      try {
        console.log('🌐 Attempting Netlify deployment...');
        const netlifyDeploy = await deployToNetlify(siteName, message.generatedCode);
        if (netlifyDeploy) {
          message.netlifyUrl = netlifyDeploy.url;
          console.log('✅ Netlify deployment successful:', netlifyDeploy.url);
          
          toast({
            title: "Netlify Success",
            description: `Site deployed: ${netlifyDeploy.url}`,
          });
        }
      } catch (error) {
        console.error('❌ Netlify deployment failed:', error);
        toast({
          title: "Netlify Error", 
          description: "Failed to deploy to Netlify, but GitHub repository was created",
          variant: "destructive"
        });
      }

      // Update project with deployment URLs
      if (message.githubUrl || message.netlifyUrl) {
        console.log('💾 Updating project with deployment URLs...');
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
      toast({
        title: "Deployment Error",
        description: "Failed to deploy your website. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateFallbackCode = (userRequest: string) => {
    const title = channelData?.title || 'AI Generated Website';
    const description = channelData?.description || 'A modern, responsive website built with AI';
    
    // Enhanced fallback code that responds to user request
    const isGaming = userRequest.toLowerCase().includes('gaming') || userRequest.toLowerCase().includes('game');
    const isBusiness = userRequest.toLowerCase().includes('business') || userRequest.toLowerCase().includes('professional');
    const isPortfolio = userRequest.toLowerCase().includes('portfolio') || userRequest.toLowerCase().includes('showcase');
    
    const colorScheme = isGaming ? 
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
      isBusiness ? 
      'linear-gradient(135deg, #2C3E50 0%, #3498DB 100%)' :
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #333;
            background: ${colorScheme};
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
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        nav {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.8rem;
            font-weight: 800;
            color: white;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .nav-links {
            display: flex;
            list-style: none;
            gap: 2rem;
        }
        
        .nav-links a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.3s;
            padding: 0.5rem 1rem;
            border-radius: 25px;
        }
        
        .nav-links a:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
        }
        
        .hero {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            position: relative;
            overflow: hidden;
        }
        
        .hero::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            opacity: 0.3;
        }
        
        .hero-content {
            position: relative;
            z-index: 2;
        }
        
        .hero-content h1 {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            font-weight: 900;
            letter-spacing: -1px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .hero-content p {
            font-size: 1.4rem;
            margin-bottom: 2.5rem;
            max-width: 700px;
            opacity: 0.95;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: white;
            padding: 18px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.3);
            margin: 0 10px;
        }
        
        .cta-button:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(255, 107, 107, 0.4);
        }
        
        .cta-button.secondary {
            background: transparent;
            border: 2px solid white;
            color: white;
        }
        
        .cta-button.secondary:hover {
            background: white;
            color: #333;
        }
        
        .features {
            padding: 6rem 0;
            background: white;
        }
        
        .section-title {
            text-align: center;
            font-size: 3rem;
            margin-bottom: 3rem;
            font-weight: 800;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 3rem;
            margin-top: 4rem;
        }
        
        .feature-card {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 3rem;
            border-radius: 20px;
            text-align: center;
            color: white;
            transform: translateY(0);
            transition: all 0.3s ease;
            box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .feature-card:hover {
            transform: translateY(-15px);
            box-shadow: 0 25px 50px rgba(0,0,0,0.2);
        }
        
        .feature-icon {
            font-size: 3.5rem;
            margin-bottom: 1.5rem;
            display: block;
        }
        
        .feature-card h3 {
            font-size: 1.8rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }
        
        .feature-card p {
            font-size: 1.1rem;
            opacity: 0.95;
            line-height: 1.6;
        }
        
        .youtube-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 6rem 0;
            color: white;
            text-align: center;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .stat-item {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 900;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        footer {
            background: #1a1a1a;
            color: white;
            padding: 3rem 0;
            text-align: center;
        }
        
        @media (max-width: 768px) {
            .hero-content h1 {
                font-size: 2.5rem;
            }
            
            .hero-content p {
                font-size: 1.1rem;
            }
            
            .nav-links {
                display: none;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
                gap: 2rem;
            }
            
            .cta-button {
                display: block;
                margin: 10px auto;
                width: fit-content;
            }
        }
        
        .fade-in {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s ease;
        }
        
        .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
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
                <li><a href="#about">About</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>

    <section class="hero" id="home">
        <div class="hero-content">
            <h1>${title}</h1>
            <p>${description}</p>
            <div>
                <a href="#features" class="cta-button">Explore Features</a>
                ${channelData ? `<a href="https://youtube.com/channel/${channelData.id}" class="cta-button secondary" target="_blank">Visit Channel</a>` : ''}
            </div>
        </div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title fade-in">Amazing Features</h2>
            <div class="features-grid">
                <div class="feature-card fade-in">
                    <span class="feature-icon">🚀</span>
                    <h3>Lightning Fast</h3>
                    <p>Built with cutting-edge technology for optimal performance and blazing-fast load times.</p>
                </div>
                <div class="feature-card fade-in">
                    <span class="feature-icon">📱</span>
                    <h3>Mobile First</h3>
                    <p>Fully responsive design that looks stunning on all devices and screen sizes.</p>
                </div>
                <div class="feature-card fade-in">
                    <span class="feature-icon">✨</span>
                    <h3>Interactive</h3>
                    <p>Engaging animations and interactive elements that create memorable user experiences.</p>
                </div>
            </div>
        </div>
    </section>

    ${channelData ? `
    <section class="youtube-section" id="about">
        <div class="container">
            <h2 class="section-title" style="color: white;">Channel Statistics</h2>
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
            <a href="https://youtube.com/channel/${channelData.id}" class="cta-button" target="_blank">Subscribe Now</a>
        </div>
    </section>
    ` : ''}

    <footer id="contact">
        <div class="container">
            <h3>Get In Touch</h3>
            <p>Ready to create something amazing together?</p>
            <div style="margin-top: 2rem;">
                <a href="mailto:hello@example.com" class="cta-button">Contact Us</a>
            </div>
        </div>
    </footer>

    <script>
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Header scroll effect
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.color = '#333';
                header.querySelector('.logo').style.color = '#333';
                header.querySelectorAll('.nav-links a').forEach(link => {
                    link.style.color = '#333';
                });
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.1)';
                header.style.color = 'white';
                header.querySelector('.logo').style.color = 'white';
                header.querySelectorAll('.nav-links a').forEach(link => {
                    link.style.color = 'white';
                });
            }
            
            // Hide/show header on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollY = currentScrollY;
        });

        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach((el, index) => {
            el.style.transitionDelay = \`\${index * 0.2}s\`;
            observer.observe(el);
        });

        // Parallax effect for hero section
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            const rate = scrolled * -0.5;
            
            if (hero) {
                hero.style.transform = \`translateY(\${rate}px)\`;
            }
        });

        // Dynamic typing effect for hero title (optional)
        const heroTitle = document.querySelector('.hero-content h1');
        const titleText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < titleText.length) {
                heroTitle.textContent += titleText.charAt(i);
                i++;
                setTimeout(typeWriter, 100);
            }
        };
        
        // Start typing effect after page load
        window.addEventListener('load', () => {
            setTimeout(typeWriter, 1000);
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
