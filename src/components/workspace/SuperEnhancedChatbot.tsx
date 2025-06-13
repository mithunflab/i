
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Youtube, Users, Eye, Calendar, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setCurrentProject(projectData);
  }, [projectData]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `👋 Welcome! I'm here to help you create an amazing website for **${channelData.title}**.\n\n🎯 **Channel Stats:**\n• ${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers\n• ${parseInt(channelData.videoCount || '0').toLocaleString()} videos\n\n💡 I can help you build, customize, and enhance your website. **Tell me specifically what element you'd like to change**, and I'll modify only that part while keeping everything else intact!\n\n**🎯 I can target specific changes to:**\n• Hero section titles\n• Navigation elements\n• Video gallery layout\n• Color schemes\n• Button styles\n• Contact information\n• Footer content\n\n✨ **My enhanced memory ensures I only change what you ask for!**`,
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
      console.log('🎯 Sending targeted request to Supabase Edge Function...');
      
      // Enhanced prompt for better targeting
      const enhancedPrompt = `
CRITICAL: TARGETED MODIFICATION ONLY - PRESERVE EXISTING DESIGN

User Request: "${inputValue.trim()}"

CURRENT PROJECT CONTEXT:
- Channel: ${channelData?.title || 'Unknown Channel'}
- Existing Code: ${currentProject?.source_code ? 'Available' : 'New Project'}
- Change Type: Targeted modification only

MANDATORY RULES:
1. 🚫 ONLY modify the specific element mentioned by user
2. 🚫 PRESERVE all other HTML, CSS, and JavaScript
3. 🚫 MAINTAIN existing color schemes and layout
4. 🚫 KEEP all YouTube branding and data integration
5. ✅ USE real channel data: ${channelData?.title}, ${parseInt(channelData?.subscriberCount || '0').toLocaleString()} subscribers

IMPORTANT: Make the SMALLEST possible change that satisfies the user request while preserving EVERYTHING else. Focus only on the specific element or feature mentioned.
`;

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: enhancedPrompt,
          projectId: currentProject?.id || crypto.randomUUID(),
          channelData: channelData,
          chatHistory: messages.slice(-5),
          generateCode: true,
          projectContext: {
            youtubeUrl,
            projectIdea,
            currentCode: currentProject?.source_code || '',
            preserveDesign: true,
            targetedChange: true
          },
          isTargetedChange: true,
          currentCode: currentProject?.source_code || ''
        }
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(`API Error: ${error.message}`);
      }

      console.log('✅ AI Response received with enhanced targeting');

      const assistantContent = data.reply || 'I\'ve made the targeted changes to your website!';
      const generatedCode = data.generatedCode;

      if (generatedCode) {
        console.log('🔄 Code generated, updating preview...');
        onCodeGenerated(generatedCode);
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
      console.error('❌ Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again with your specific request.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
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
      console.error('❌ Error saving project:', error);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```html[\s\S]*?```/g, '<div class="bg-gray-800 p-2 rounded text-green-400 font-mono text-xs">✅ Code generated and applied to preview</div>')
      .replace(/```[\s\S]*?```/g, '<div class="bg-gray-800 p-2 rounded text-gray-300 font-mono text-xs">Code block</div>')
      .replace(/\n/g, '<br/>');
  };

  const chatHeight = isMaximized ? 'h-screen' : (isExpanded ? 'h-full' : 'h-16');

  return (
    <div className={`${chatHeight} flex flex-col bg-black/30 backdrop-blur-sm transition-all duration-300 ease-in-out`}>
      {/* Header with controls */}
      <div className="p-3 border-b border-purple-500/30 bg-black/50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">AI Assistant</h3>
              {channelData && (
                <p className="text-gray-400 text-xs">{channelData.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-7 h-7 p-0 text-gray-400 hover:text-white"
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-7 h-7 p-0 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </Button>
          </div>
        </div>

        {/* Channel Info - only show when expanded */}
        {isExpanded && channelData && (
          <div className="mt-2 p-2 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded border border-red-500/20">
            <div className="flex items-center gap-2">
              {channelData.thumbnail && (
                <img 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  className="w-8 h-8 rounded-full object-cover border border-red-500"
                />
              )}
              <div className="flex-1">
                <h4 className="text-white font-medium text-xs">{channelData.title}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={10} />
                    {parseInt(channelData.subscriberCount || '0').toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={10} />
                    {parseInt(channelData.videoCount || '0').toLocaleString()} videos
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Status - only show when expanded and verified */}
        {isExpanded && currentProject && currentProject.verified && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
              <Calendar size={10} className="mr-1" />
              Last updated: {new Date(currentProject.updated_at).toLocaleDateString()}
            </Badge>
          </div>
        )}
      </div>

      {/* Messages - only show when expanded */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {message.role === 'assistant' && (
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] p-2 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-800/50 text-gray-100'
              }`}>
                <div 
                  className="text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content) 
                  }} 
                />
                <div className="text-xs opacity-50 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot size={12} className="text-white" />
              </div>
              <div className="bg-gray-800/50 text-gray-100 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs">Making targeted changes...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input - only show when expanded */}
      {isExpanded && (
        <div className="p-3 border-t border-purple-500/30 bg-black/50 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me specifically what to change (e.g., 'change the hero title to...')"
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-xs"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3"
            >
              <Send size={12} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperEnhancedChatbot;
