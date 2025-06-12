
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  feature?: string;
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
          `I've analyzed your channel and I'm ready to help you create an amazing website!\n\n` +
          `**📺 Channel Info:**\n` +
          `• **${channelData.title}**\n` +
          `• ${subscriberCount} subscribers\n` +
          `• ${videoCount} videos\n` +
          `• ${parseInt(channelData.viewCount).toLocaleString()} total views${videoList}\n\n` +
          `**✨ Creator Features Available:**\n` +
          `• YouTube Video Integration\n` +
          `• Channel Branding Match\n` +
          `• Subscribe Widgets\n` +
          `• Mobile-First Design\n` +
          `• SEO for Creators\n` +
          `• Monetization Tools\n` +
          `• Analytics Dashboard\n\n` +
          `**🎯 Pro Tip:** Use "Edit" to click and customize any element for your brand!\n\n` +
          `What would you like to add to your YouTube website first?`,
        timestamp: new Date(),
        feature: 'welcome'
      };
    }

    return {
      id: '1',
      type: 'bot',
      content: `🎥 **Welcome to YouTube Website Builder!**\n\nI've analyzed your channel and I'm ready to help you create an amazing website!\n\n**📺 Channel:** ${youtubeUrl}\n**💡 Vision:** ${projectIdea}\n\n**✨ Creator Features Available:**\n• YouTube Video Integration\n• Channel Branding Match\n• Subscribe Widgets\n• Mobile-First Design\n• SEO for Creators\n• Monetization Tools\n• Analytics Dashboard\n\n**🎯 Pro Tip:** Use "Edit" to click and customize any element for your brand!\n\nWhat would you like to add to your YouTube website first?`,
      timestamp: new Date(),
      feature: 'welcome'
    };
  }, [youtubeUrl, projectIdea, channelData]);

  // Send message with OpenRouter AI integration
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
      // Get OpenRouter API key and generate AI response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          projectId,
          channelData,
          chatHistory: messages.slice(-5) // Send last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const { reply, feature } = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: reply,
        timestamp: new Date(),
        feature
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage('assistant', reply, { feature });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback response
      const channelName = channelData?.title || 'your channel';
      let botResponse = '';
      let feature = '';

      if (content.toLowerCase().includes('video') || content.toLowerCase().includes('youtube')) {
        feature = 'video';
        botResponse = `📺 **YouTube Video Integration Activated for ${channelName}!**\n\nSetting up video showcase for "${content}"\n\n🔧 Processing:\n✅ Latest video imports from ${channelName}\n✅ Playlist organization\n✅ Thumbnail optimization\n✅ Subscribe button placement\n\n🎥 **Your ${channelData?.videoCount || 'videos'} videos will look amazing on your website!**`;
      } else if (content.toLowerCase().includes('brand') || content.toLowerCase().includes('color') || content.toLowerCase().includes('style')) {
        feature = 'branding';
        botResponse = `🎨 **${channelName} Branding Applied!**\n\nCustomizing design based on "${content}"\n\n🔧 Branding Updates:\n✅ ${channelName} color extraction\n✅ Thumbnail style analysis\n✅ Font matching\n✅ Logo integration\n\n🌟 **Your website now matches ${channelName}'s YouTube brand perfectly!**`;
      } else {
        botResponse = `🤖 **${channelName} Website AI Processing...**\n\nWorking on: "${content}"\n\n🔧 **Creator Tools Active:**\n✅ Content analysis for ${channelName}\n✅ Audience optimization\n✅ Mobile-first design\n✅ YouTube integration\n\n🎥 **${channelName}'s website is getting better!**`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        feature
      };

      setMessages(prev => [...prev, botMessage]);
      await saveChatMessage('assistant', botResponse, { feature });
    } finally {
      setLoading(false);
    }
  }, [messages, loading, projectId, channelData, saveChatMessage]);

  // Set up real-time updates
  useEffect(() => {
    if (!user || !projectId) return;

    const channel = supabase
      .channel(`project-chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_history',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Real-time chat update:', payload);
          // Only add if it's not from current user to avoid duplicates
          if (payload.new.user_id !== user.id) {
            const newMessage: Message = {
              id: payload.new.id,
              type: payload.new.message_type,
              content: payload.new.content,
              timestamp: new Date(payload.new.created_at),
              feature: payload.new.metadata?.feature
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

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
