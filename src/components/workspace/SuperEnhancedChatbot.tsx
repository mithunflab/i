import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Users, Eye, ChevronDown, ChevronUp, Maximize2, Minimize2, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTargetedChanges } from '@/hooks/useTargetedChanges';
import { useAdvancedAIMemory } from '@/hooks/useAdvancedProjectMemory';
import { useYouTubeIntegration } from '@/hooks/useYouTubeIntegration';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  component?: string;
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
  const { generateTargetedPrompt } = useTargetedChanges();
  const { generateWebsiteWithRealData } = useYouTubeIntegration();
  const { memory, generateContextualPrompt, saveChange } = useAdvancedAIMemory(currentProject?.id || '');

  useEffect(() => {
    setCurrentProject(projectData);
  }, [projectData]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        role: 'assistant',
        content: `🎉 **Component-Level Website Editor Ready!**\n\n**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n🧠 **Advanced Component Memory Active** - I can edit specific parts without changing your entire website!\n\n💡 **Component-Level Commands**:\n• "Change the subscribe button text to 'Join Now'"\n• "Update the hero title to 'Welcome to My Channel'"\n• "Make the header background blue"\n• "Add contact info to footer"\n\n✨ **Smart Features**:\n• Real video integration with ${channelData.videos?.length || 0} latest videos\n• Component mapping for precise edits\n• Design preservation system\n• Multi-file code generation (HTML/CSS/JS)`,
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
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    try {
      console.log('🎯 Processing component-level edit request...');
      
      // Generate contextual prompt using project memory
      let enhancedPrompt = '';
      
      if (memory && currentProject?.source_code) {
        // Use advanced project memory for existing projects
        enhancedPrompt = generateContextualPrompt(currentInput, currentProject.source_code);
        console.log('🧠 Using advanced project memory for targeted editing');
      } else {
        // Use targeted changes for new projects or fallback
        enhancedPrompt = generateTargetedPrompt(
          currentInput,
          currentProject?.source_code || '',
          currentProject,
          channelData
        );
        console.log('🎯 Using targeted changes system');
      }

      // Store original code for change tracking
      const originalCode = currentProject?.source_code || '';

      // Generate website with enhanced targeting
      const result = await generateWebsiteWithRealData(
        channelData,
        projectIdea,
        enhancedPrompt // Use the enhanced prompt instead of raw user input
      );

      if (result?.generatedCode) {
        console.log('🔄 Component-level code generated, updating preview...');
        onCodeGenerated(result.generatedCode);
        
        // Save the change to project memory
        if (memory && saveChange) {
          await saveChange(
            'auto-detected', // Component detection could be improved
            currentInput,
            originalCode,
            result.generatedCode
          );
        }
        
        await saveProject(result.generatedCode, result.reply);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result?.reply || '✅ I\'ve made the targeted changes you requested while preserving your existing website design and all other components!',
        timestamp: new Date(),
        component: 'auto-detected'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Component-level edit error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Component Edit Error**\n\nI encountered an issue while making your targeted changes: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 **Try Again With**:\n• More specific component names (e.g., "header", "button", "video section")\n• Clear action words (e.g., "change", "update", "modify")\n• Specific values (e.g., colors, text, sizes)`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Component Edit Error",
        description: "Failed to process your targeted request. Please be more specific about which component to modify.",
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
              <h3 className="text-white font-medium text-xs">Component Editor</h3>
              {channelData && (
                <p className="text-gray-400 text-xs truncate max-w-32">{channelData.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {memory && (
              <Badge variant="outline" className="text-xs px-1 py-0 text-green-400 border-green-400/30">
                Memory: {Object.keys(memory.componentMap || {}).length}
              </Badge>
            )}
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
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  {message.component && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {message.component}
                    </Badge>
                  )}
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
                  <span className="text-xs">Analyzing components & applying targeted changes...</span>
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
              placeholder="Component edit (e.g., 'change button text to Subscribe Now')"
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
          {memory && (
            <div className="mt-1 text-xs text-gray-500">
              Memory: {Object.keys(memory.componentMap || {}).length} components tracked
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperEnhancedChatbot;
