
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Youtube, Users, Eye, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEnhancedTargetedChanges } from '@/hooks/useEnhancedTargetedChanges';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface SuperEnhancedChatbotProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: any;
  onCodeGenerated: (code: string) => void;
  projectData?: any;
  onProjectUpdate?: (project: any) => void;
}

const SuperEnhancedChatbot: React.FC<SuperEnhancedChatbotProps> = ({
  youtubeUrl,
  projectIdea,
  channelData,
  onCodeGenerated,
  projectData,
  onProjectUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState(projectData);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateEnhancedPrompt } = useEnhancedTargetedChanges();

  useEffect(() => {
    setCurrentProject(projectData);
  }, [projectData]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `👋 Welcome! I'm here to help you create an amazing website for **${channelData.title}**.\n\n🎯 **Channel Stats:**\n• ${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers\n• ${parseInt(channelData.videoCount || '0').toLocaleString()} videos\n\n💡 I can help you build, customize, and enhance your website. What would you like to work on today?`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [channelData, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let chatSystemPrompt = '';
      
      // Generate enhanced prompt if we have a project
      if (currentProject) {
        const enhancedPrompt = await generateEnhancedPrompt({
          userRequest: inputValue.trim(),
          projectId: currentProject.id,
          channelData
        });
        chatSystemPrompt = enhancedPrompt.prompt;
        console.log('🎯 Using enhanced targeted prompt for changes');
      } else {
        // Standard prompt for new projects
        chatSystemPrompt = `
You are an expert web developer creating a stunning website for the YouTube channel "${channelData?.title || 'YouTube Channel'}".

Channel Information:
- Name: ${channelData?.title || 'Unknown'}
- Subscribers: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}
- Videos: ${parseInt(channelData?.videoCount || '0').toLocaleString()}
- Thumbnail: ${channelData?.thumbnail || ''}

Create a modern, responsive website that showcases this YouTube channel beautifully. Use the actual channel data provided above.

Requirements:
- Modern, professional design
- YouTube brand colors (#FF0000 for primary buttons)
- Responsive design (mobile-first)
- Real subscriber and video counts
- Channel thumbnail integration
- Clean, readable typography
- Smooth animations and hover effects

Generate complete HTML with embedded CSS and JavaScript. Make it visually stunning and engaging.
`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: chatSystemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: inputValue.trim() }
          ]
        })
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      const assistantContent = data.message || 'Sorry, I encountered an error.';

      // Extract code from the response
      const codeMatch = assistantContent.match(/```html([\s\S]*?)```/);
      if (codeMatch) {
        const generatedCode = codeMatch[1].trim();
        onCodeGenerated(generatedCode);

        // Save or update project
        await saveProject(generatedCode, assistantContent);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProject = async (sourceCode: string, chatContent: string) => {
    if (!user || !youtubeUrl) return;

    try {
      if (currentProject) {
        // Update existing project
        const { data, error } = await supabase
          .from('projects')
          .update({
            source_code: sourceCode,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentProject.id)
          .select()
          .single();

        if (error) throw error;

        setCurrentProject(data);
        onProjectUpdate?.(data);
        console.log('✅ Project updated successfully');
      } else {
        // Create new project
        const projectName = channelData?.title 
          ? `${channelData.title} Website` 
          : 'YouTube Channel Website';

        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName,
            description: projectIdea || `Website for ${channelData?.title || 'YouTube Channel'}`,
            youtube_url: youtubeUrl,
            source_code: sourceCode,
            channel_data: channelData,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        setCurrentProject(data);
        onProjectUpdate?.(data);
        console.log('✅ New project created successfully');
      }

      // Save chat message
      if (currentProject?.id) {
        await supabase
          .from('project_chat_history')
          .insert({
            project_id: currentProject.id,
            user_id: user.id,
            message_type: 'assistant',
            content: chatContent
          });
      }

    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```html[\s\S]*?```/g, '<div class="bg-gray-800 p-3 rounded text-green-400 font-mono text-sm">✅ Code generated and applied to preview</div>')
      .replace(/```[\s\S]*?```/g, '<div class="bg-gray-800 p-3 rounded text-gray-300 font-mono text-sm">Code block</div>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="h-full flex flex-col bg-black/30 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-purple-500/30 bg-black/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">AI Website Builder</h3>
            <p className="text-gray-400 text-sm">
              {currentProject ? 'Editing your project' : 'Creating your website'}
            </p>
          </div>
        </div>

        {/* Channel Info */}
        {channelData && (
          <div className="mt-3 p-3 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center gap-3">
              {channelData.thumbnail && (
                <img 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
                />
              )}
              <div className="flex-1">
                <h4 className="text-white font-medium">{channelData.title}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {parseInt(channelData.subscriberCount || '0').toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {parseInt(channelData.videoCount || '0').toLocaleString()} videos
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Status */}
        {currentProject && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Calendar size={12} className="mr-1" />
              Last updated: {new Date(currentProject.updated_at).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'assistant' && (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800/50 text-gray-100'
            }`}>
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatMessage(message.content) 
                }} 
              />
              <div className="text-xs opacity-50 mt-2">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
            {message.role === 'user' && (
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div className="bg-gray-800/50 text-gray-100 p-3 rounded-lg">
              <Loader2 size={16} className="animate-spin" />
              <span className="ml-2">Generating response...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-purple-500/30 bg-black/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={currentProject ? "What would you like to change?" : "Describe your website idea..."}
            className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuperEnhancedChatbot;
