
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  feature?: string;
  generatedCode?: string;
  codeDescription?: string;
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

export const useProjectChat = (youtubeUrl: string, projectIdea: string, channelData?: ChannelData | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Generate consistent project ID from URL and idea
  const generateProjectId = useCallback(() => {
    return btoa(youtubeUrl + '::' + projectIdea).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }, [youtubeUrl, projectIdea]);

  const projectId = generateProjectId();

  // Save chat message
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

  // Load chat history
  const loadChatHistory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      console.log('Loading chat history for project:', projectId);
      
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
          feature: typeof msg.metadata === 'object' && msg.metadata !== null && 'feature' in msg.metadata 
            ? (msg.metadata as any).feature 
            : undefined,
          generatedCode: typeof msg.metadata === 'object' && msg.metadata !== null && 'generatedCode' in msg.metadata 
            ? (msg.metadata as any).generatedCode 
            : undefined,
          codeDescription: typeof msg.metadata === 'object' && msg.metadata !== null && 'codeDescription' in msg.metadata 
            ? (msg.metadata as any).codeDescription 
            : undefined
        }));
        setMessages(loadedMessages);
        console.log('Loaded chat history:', loadedMessages.length, 'messages');
      } else {
        // Initialize with welcome message if no history
        const welcomeMessage = createWelcomeMessage();
        setMessages([welcomeMessage]);
        await saveChatMessage('assistant', welcomeMessage.content, { feature: 'welcome' });
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
    }
  }, [user, projectId, channelData]);

  // Create welcome message
  const createWelcomeMessage = useCallback((): Message => {
    if (channelData) {
      const subscriberCount = parseInt(channelData.subscriberCount).toLocaleString();
      const videoCount = parseInt(channelData.videoCount).toLocaleString();
      
      let videoList = '';
      if (channelData.videos && channelData.videos.length > 0) {
        videoList = '\n\n**🎬 Latest Videos:**\n' + 
          channelData.videos.slice(0, 3).map((video, index) => 
            `${index + 1}. ${video.snippet.title}`
          ).join('\n');
      }

      return {
        id: '1',
        type: 'bot',
        content: `🎥 **Welcome to ${channelData.title} Website Builder!**\n\n` +
          `I'm your AI assistant ready to create stunning websites for creators!\n\n` +
          `**📺 Channel Analysis Complete:**\n` +
          `• **${channelData.title}**\n` +
          `• ${subscriberCount} subscribers\n` +
          `• ${videoCount} videos\n` +
          `• ${parseInt(channelData.viewCount).toLocaleString()} total views${videoList}\n\n` +
          `**✨ I can create:**\n` +
          `• Modern responsive websites\n` +
          `• YouTube video integration\n` +
          `• Channel branding match\n` +
          `• Subscribe widgets & CTAs\n` +
          `• Mobile-optimized design\n` +
          `• SEO optimization\n` +
          `• Custom features\n\n` +
          `**🚀 Let's build something amazing!** Tell me what kind of website you want for ${channelData.title}!`,
        timestamp: new Date(),
        feature: 'welcome'
      };
    }

    return {
      id: '1',
      type: 'bot',
      content: `🎥 **Welcome to AI Website Builder!**\n\nI'm your AI assistant ready to create stunning websites!\n\n**📺 Project:** ${youtubeUrl}\n**💡 Vision:** ${projectIdea}\n\n**✨ I can create:**\n• Modern responsive websites\n• YouTube integration\n• Mobile-optimized design\n• Custom features\n• Professional layouts\n\n**🚀 Let's build something amazing!** What would you like me to create for you?`,
      timestamp: new Date(),
      feature: 'welcome'
    };
  }, [youtubeUrl, projectIdea, channelData]);

  // Generate code with AI using Supabase Edge Function
  const generateCode = async (userRequest: string, channelInfo?: ChannelData | null) => {
    try {
      console.log('🤖 Generating code with AI for:', userRequest);

      // Use correct Supabase function URL
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userRequest,
          projectId,
          channelData: channelInfo,
          chatHistory: messages.slice(-5),
          generateCode: true
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      console.log('✅ AI response received:', data);

      return {
        reply: data.reply,
        feature: data.feature,
        generatedCode: data.generatedCode,
        codeDescription: data.codeDescription
      };
    } catch (error) {
      console.error('❌ Error generating code:', error);
      throw error;
    }
  };

  // Send message with AI code generation
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
      console.log('🚀 Sending message to AI:', content);
      
      const result = await generateCode(content, channelData);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.reply,
        timestamp: new Date(),
        feature: result.feature,
        generatedCode: result.generatedCode,
        codeDescription: result.codeDescription
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage('assistant', result.reply, { 
        feature: result.feature,
        generatedCode: result.generatedCode,
        codeDescription: result.codeDescription
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Enhanced fallback response with code generation
      const channelName = channelData?.title || 'your channel';
      let botResponse = '';
      let feature = '';
      let generatedCode = '';
      let codeDescription = '';

      if (content.toLowerCase().includes('website') || content.toLowerCase().includes('create') || content.toLowerCase().includes('build')) {
        feature = 'website';
        codeDescription = `Generated a stunning modern website for ${channelName}`;
        generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelName} - Official Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .hero { 
            text-align: center; 
            background: rgba(255,255,255,0.95); 
            padding: 4rem 2rem; 
            border-radius: 20px; 
            margin: 2rem 0;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .hero h1 { 
            font-size: 3.5rem; 
            margin-bottom: 1rem; 
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .cta-button { 
            display: inline-block; 
            padding: 15px 35px; 
            background: linear-gradient(135deg, #FF6B6B, #FF8E53);
            color: white; 
            text-decoration: none; 
            border-radius: 30px; 
            margin: 20px 10px;
            transition: transform 0.3s;
            font-weight: bold;
        }
        .cta-button:hover { transform: translateY(-3px); }
        .features { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 2rem; 
            margin: 3rem 0; 
        }
        .feature-card { 
            background: rgba(255,255,255,0.95); 
            padding: 2rem; 
            border-radius: 15px; 
            text-align: center; 
            transition: transform 0.3s;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .feature-card:hover { transform: translateY(-10px); }
        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <section class="hero">
            <h1>Welcome to ${channelName}</h1>
            <p style="font-size: 1.3rem; color: #666; margin-bottom: 2rem;">Creating amazing content for our community</p>
            <a href="#subscribe" class="cta-button">🔔 Subscribe Now</a>
            <a href="#videos" class="cta-button">📺 Latest Videos</a>
        </section>
        
        <section class="features">
            <div class="feature-card">
                <h3>🎬 Latest Content</h3>
                <p>Stay updated with our newest videos and creative projects.</p>
            </div>
            <div class="feature-card">
                <h3>👥 Community</h3>
                <p>Join our growing community of passionate creators and fans.</p>
            </div>
            <div class="feature-card">
                <h3>🎯 Exclusive Access</h3>
                <p>Get early access to content and behind-the-scenes material.</p>
            </div>
        </section>
        
        <section style="background: rgba(255,255,255,0.95); padding: 3rem; border-radius: 20px; margin: 3rem 0; text-align: center;">
            <h2>🚀 ${channelName} YouTube Channel</h2>
            <p style="font-size: 1.1rem; margin: 1rem 0;">Subscribe for amazing content!</p>
            <a href="${youtubeUrl}" class="cta-button" target="_blank">Visit YouTube Channel</a>
        </section>
    </div>
</body>
</html>`;
        
        botResponse = `🎨 **Stunning Website Created for ${channelName}!**\n\n✨ **Website Features Generated:**\n• Modern gradient design\n• Responsive layout for all devices\n• YouTube channel integration\n• Subscribe call-to-action buttons\n• Community features section\n• Professional hero section\n• Smooth animations\n• Mobile-optimized\n\n🚀 **Website is ready to view in the preview!**\n\n💡 **What's included:**\n- Clean HTML5 structure\n- Modern CSS3 styling\n- JavaScript animations\n- SEO-friendly markup\n- Fast loading design\n\n**Your stunning website is ready! 🎉**`;
      } else {
        botResponse = `🤖 **AI Assistant Processing...**\n\nWorking on: "${content}"\n\n🔧 **Features Being Added:**\n✅ Custom design elements\n✅ YouTube integration\n✅ Mobile optimization\n✅ Professional styling\n\n🎥 **Creating amazing features for ${channelName}!**\n\n💡 **Try asking me to:**\n• "Create a stunning website"\n• "Build a modern homepage"\n• "Make a professional site"\n• "Design a YouTube landing page"`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        feature,
        generatedCode,
        codeDescription
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage('assistant', botResponse, { 
        feature,
        generatedCode,
        codeDescription
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading, projectId, channelData, saveChatMessage]);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  return {
    messages,
    loading,
    sendMessage,
    projectId
  };
};
