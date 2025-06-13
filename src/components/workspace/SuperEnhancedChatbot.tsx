import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Users, Eye, ChevronDown, ChevronUp, Maximize2, Minimize2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedAIMemory } from '@/hooks/useAdvancedAIMemory';
import { useYouTubeIntegration } from '@/hooks/useYouTubeIntegration';

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
  const [isClosed, setIsClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { memory, generateTargetedPrompt } = useAdvancedAIMemory(currentProject?.id || '');
  const { generateWebsiteWithRealData } = useYouTubeIntegration();

  useEffect(() => {
    setCurrentProject(projectData);
  }, [projectData]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `🎉 **Professional Website Builder Ready!**\n\n**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n🧠 **Enhanced AI Memory Active** - I remember everything and only change what you request!\n\n💡 **Tell me exactly what to modify** (e.g., "change the hero title to..." or "add a contact form")\n\n✨ **Features**:\n• Real video integration with ${channelData.videos?.length || 0} latest videos\n• Professional multi-page structure\n• Targeted modifications that preserve your design\n• Working YouTube embeds and subscribe buttons`,
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
      console.log('🎯 Sending enhanced AI request with memory...');
      
      // Generate enhanced website with real data and AI memory
      const result = await generateWebsiteWithRealData(
        channelData,
        projectIdea,
        inputValue.trim()
      );

      if (result?.generatedCode) {
        console.log('🔄 Professional code generated, updating preview...');
        onCodeGenerated(result.generatedCode);
        await saveProject(result.generatedCode, result.reply);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result?.reply || '✅ I\'ve made your requested changes while preserving your existing design!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Enhanced AI Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Error Processing Request**\n\nI encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 Please try again with a more specific request.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your request. Please try again.",
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
      } else {
        const projectName = channelData?.title 
          ? `${channelData.title} Website` 
          : 'YouTube Channel Website';

        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName,
            description: projectIdea || `Professional website for ${channelData?.title || 'YouTube Channel'}`,
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
      }
    } catch (error) {
      console.error('❌ Error saving project:', error);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  // Handle collapsed state
  if (isClosed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsClosed(false)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
        >
          <Bot size={20} className="text-white" />
        </Button>
      </div>
    );
  }

  const chatHeight = isMaximized ? 'h-screen fixed inset-0 z-50' : (isExpanded ? 'h-full' : 'h-12');

  return (
    <div className={`${chatHeight} flex flex-col bg-black/90 backdrop-blur-sm transition-all duration-300 ease-in-out ${isMaximized ? 'rounded-none' : 'rounded-lg'}`}>
      {/* Enhanced Header */}
      <div className="p-2 border-b border-purple-500/30 bg-black/70 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-xs">AI Assistant</h3>
              {channelData && (
                <p className="text-gray-400 text-xs truncate max-w-32">{channelData.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 p-0 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClosed(true)}
              className="w-6 h-6 p-0 text-gray-400 hover:text-white"
            >
              <X size={12} />
            </Button>
          </div>
        </div>

        {/* Compact Channel Info */}
        {isExpanded && channelData && (
          <div className="mt-1 p-1 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded border border-red-500/20">
            <div className="flex items-center gap-2">
              {channelData.thumbnail && (
                <img 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  className="w-6 h-6 rounded-full object-cover border border-red-500"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={8} />
                    {parseInt(channelData.subscriberCount || '0').toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={8} />
                    {parseInt(channelData.videoCount || '0').toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              {message.role === 'assistant' && (
                <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={10} className="text-white" />
                </div>
              )}
              <div className={`max-w-[85%] p-2 rounded-lg transition-all duration-200 hover:scale-[1.01] ${
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
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={10} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot size={10} className="text-white" />
              </div>
              <div className="bg-gray-800/50 text-gray-100 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="text-xs">Processing with AI memory...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Enhanced Input */}
      {isExpanded && (
        <div className="p-2 border-t border-purple-500/30 bg-black/70 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Tell me exactly what to change (e.g., 'update hero title')"
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-xs h-8"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-2 h-8"
            >
              <Send size={10} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperEnhancedChatbot;
