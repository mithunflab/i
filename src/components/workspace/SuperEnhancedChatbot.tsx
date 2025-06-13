import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Users, Eye, ChevronDown, ChevronUp, Maximize2, Minimize2, X, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealTimeWebsiteGeneration } from '@/hooks/useRealTimeWebsiteGeneration';
import { useRealTimeGitSync } from '@/hooks/useRealTimeGitSync';

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
  const [currentProject, setCurrentProject] = useState(projectData);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateWebsite, isGenerating, isGroqConnected } = useRealTimeWebsiteGeneration();
  const { syncToGit } = useRealTimeGitSync(currentProject?.id);

  useEffect(() => {
    setCurrentProject(projectData);
  }, [projectData]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `🚀 **Real-Time AI Website Builder Ready!**\n\n**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n⚡ **Groq AI Active** - Ultra-fast real-time website generation!\n\n💡 **Tell me what you want** and I'll generate it instantly using Groq AI!\n\n✨ **Features**:\n• Real-time generation with Groq AI\n• Instant code updates\n• Auto-sync to GitHub\n• Professional designs\n• Working YouTube integrations`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [channelData, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      console.log('🎯 Starting real-time generation with Groq AI...');
      
      const result = await generateWebsite(
        inputValue.trim(),
        channelData,
        currentProject?.source_code
      );

      if (result?.code) {
        console.log('🔄 Real-time code generated, updating preview...');
        onCodeGenerated(result.code);
        await saveProject(result.code, result.reply);
        
        // Auto-sync to GitHub if connected
        if (currentProject?.github_url) {
          try {
            await syncToGit({ 'index.html': result.code }, 'Real-time AI update');
            console.log('✅ Auto-synced to GitHub');
          } catch (syncError) {
            console.warn('GitHub sync failed:', syncError);
          }
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result?.reply || '✅ Website generated in real-time with Groq AI!',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Real-time AI Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Generation Error**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to generate website. Please try again.",
        variant: "destructive"
      });
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
          : 'Real-Time AI Website';

        const { data, error } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            name: projectName,
            description: projectIdea || `Real-time website for ${channelData?.title || 'YouTube Channel'}`,
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

  // Handle collapsed state
  if (isClosed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsClosed(false)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
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
      <div className="p-2 border-b border-green-500/30 bg-black/70 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Bot size={12} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-xs flex items-center gap-1">
                Real-Time AI
                {isGroqConnected && <Zap size={10} className="text-green-400" />}
              </h3>
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

        {/* Groq Status Indicator */}
        {isExpanded && (
          <div className="mt-1 p-1 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded border border-green-500/20">
            <div className="flex items-center gap-2 text-xs">
              <Zap size={12} className={isGroqConnected ? "text-green-400" : "text-gray-400"} />
              <span className={isGroqConnected ? "text-green-400" : "text-gray-400"}>
                {isGroqConnected ? "Groq AI Active - Real-Time Generation Ready" : "Groq AI Disconnected"}
              </span>
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
                <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
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
          
          {isGenerating && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <div className="w-5 h-5 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <Bot size={10} className="text-white" />
              </div>
              <div className="bg-gray-800/50 text-gray-100 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 size={10} className="animate-spin" />
                  <Zap size={10} className="text-green-400" />
                  <span className="text-xs">Generating with Groq AI...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Enhanced Input */}
      {isExpanded && (
        <div className="p-2 border-t border-green-500/30 bg-black/70 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isGroqConnected ? "Tell me what to generate..." : "Groq AI not connected"}
              className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-xs h-8"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isGenerating || !isGroqConnected}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating || !isGroqConnected}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-2 h-8"
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
