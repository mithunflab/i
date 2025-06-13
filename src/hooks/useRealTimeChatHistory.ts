
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface ChatMessageMetadata {
  feature?: string;
  generatedCode?: string;
  codeDescription?: string;
  githubUrl?: string;
  netlifyUrl?: string;
}

export const useRealTimeChatHistory = (projectId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load chat history from database
  const loadChatHistory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      console.log('📚 Loading chat history for project:', projectId);
      
      const { data: chatHistory, error } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error loading chat history:', error);
        return;
      }

      if (chatHistory && chatHistory.length > 0) {
        const loadedMessages: ChatMessage[] = chatHistory.map(msg => {
          const metadata = (msg.metadata as ChatMessageMetadata) || {};
          
          return {
            id: msg.id,
            type: msg.message_type as 'user' | 'bot',
            content: msg.content,
            timestamp: new Date(msg.created_at),
            feature: metadata.feature,
            generatedCode: metadata.generatedCode,
            codeDescription: metadata.codeDescription,
            githubUrl: metadata.githubUrl,
            netlifyUrl: metadata.netlifyUrl
          };
        });
        
        setMessages(loadedMessages);
        console.log('✅ Loaded chat history:', loadedMessages.length, 'messages');
      }
    } catch (error) {
      console.error('❌ Error in loadChatHistory:', error);
    }
  }, [user, projectId]);

  // Save message to database in real-time
  const saveMessage = useCallback(async (
    message: ChatMessage
  ): Promise<void> => {
    if (!user || !projectId) return;

    try {
      console.log('💾 Saving message to database...');
      
      const { error } = await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message_type: message.type === 'user' ? 'user' : 'assistant',
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
        console.error('❌ Error saving message:', error);
      } else {
        console.log('✅ Message saved to database');
      }
    } catch (error) {
      console.error('❌ Error in saveMessage:', error);
    }
  }, [user, projectId]);

  // Add message to local state and save to database
  const addMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    // Add to local state immediately for real-time UI
    setMessages(prev => [...prev, newMessage]);
    
    // Save to database in background
    await saveMessage(newMessage);
  }, [saveMessage]);

  // Set up real-time subscription for chat updates
  useEffect(() => {
    if (!user || !projectId) return;

    console.log('🔄 Setting up real-time chat subscription...');
    
    const channel = supabase
      .channel(`chat-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_chat_history',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('📨 Real-time chat update received:', payload);
          
          const metadata = (payload.new.metadata as ChatMessageMetadata) || {};
          
          const newMessage: ChatMessage = {
            id: payload.new.id,
            type: payload.new.message_type === 'user' ? 'user' : 'bot',
            content: payload.new.content,
            timestamp: new Date(payload.new.created_at),
            feature: metadata.feature,
            generatedCode: metadata.generatedCode,
            codeDescription: metadata.codeDescription,
            githubUrl: metadata.githubUrl,
            netlifyUrl: metadata.netlifyUrl
          };
          
          // Only add if it's from another user (avoid duplicates)
          if (payload.new.user_id !== user.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up chat subscription');
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
    addMessage,
    setMessages,
    loadChatHistory
  };
};
