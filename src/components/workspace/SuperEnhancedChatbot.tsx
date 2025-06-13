
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Users, Eye, ChevronDown, ChevronUp, Maximize2, Minimize2, X, Brain } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTargetedChanges } from '@/hooks/useTargetedChanges';
import { useAdvancedAIMemory } from '@/hooks/useAdvancedProjectMemory';
import { useYouTubeIntegration } from '@/hooks/useYouTubeIntegration';
import { useIntelligentChatParser } from '@/hooks/useIntelligentChatParser';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  component?: string;
  parseResult?: 'success' | 'failed' | 'error';
  suggestions?: string[];
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
  const { parseUserChat, validateAndApplyEdit, getChatHistory, initializeProjectFiles } = useIntelligentChatParser(currentProject?.id || '');

  useEffect(() => {
    setCurrentProject(projectData);
    
    // Initialize project files when project is loaded
    if (projectData?.source_code) {
      initializeProjectFiles(projectData.source_code);
    }
  }, [projectData, initializeProjectFiles]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      // Load chat history first
      const chatHistory = getChatHistory();
      
      if (chatHistory.length > 0) {
        // Convert chat history to messages
        const historicalMessages: Message[] = chatHistory.map(entry => ({
          id: entry.id,
          role: entry.role,
          content: entry.content,
          timestamp: new Date(entry.timestamp),
          component: entry.metadata?.component,
          parseResult: entry.metadata?.parseResult as any
        }));
        setMessages(historicalMessages);
      } else {
        // Show welcome message for new projects
        const welcomeMessage: Message = {
          id: '1',
          role: 'assistant',
          content: `🧠 **Intelligent Component Editor Ready!**\n\n**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n🎯 **Smart Parsing Active** - I understand natural language and edit only what you request!\n\n💡 **Natural Commands**:\n• "Make the subscribe button bigger and red"\n• "Change the hero title to something catchy"\n• "Update header background color"\n• "Add highlight to navigation menu"\n\n✨ **Intelligent Features**:\n• Intent parsing for precise edits\n• Component targeting system\n• Design consistency preservation\n• Chat history with project files`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [channelData, messages.length, getChatHistory]);

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
      console.log('🧠 Processing intelligent chat request...');
      
      // Parse user intent using intelligent chat parser
      const parseResult = await parseUserChat(
        currentInput,
        currentProject?.source_code || '',
        channelData
      );

      if (!parseResult.success) {
        // Show parsing error with suggestions
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ **Understanding Issue**\n\n${parseResult.error}\n\n💡 **Try These Instead**:\n${parseResult.suggestions?.map(s => `• ${s}`).join('\n') || '• Be more specific about the component and change you want'}`,
          timestamp: new Date(),
          parseResult: 'failed',
          suggestions: parseResult.suggestions
        };
        
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      console.log('✅ Intent parsed successfully:', parseResult);

      // Store original code for validation
      const originalCode = currentProject?.source_code || '';

      // Generate website with intelligent prompt
      const result = await generateWebsiteWithRealData(
        channelData,
        projectIdea,
        parseResult.prompt! // Use the intelligent prompt
      );

      if (result?.generatedCode) {
        console.log('🔄 Intelligent edit applied, validating...');
        
        // Validate the edit
        const isValid = validateAndApplyEdit(
          originalCode,
          result.generatedCode,
          parseResult.targetComponent!,
          currentInput
        );

        if (isValid) {
          onCodeGenerated(result.generatedCode);
          
          // Save the change to project memory
          if (memory && saveChange) {
            await saveChange(
              parseResult.targetComponent!,
              currentInput,
              originalCode,
              result.generatedCode
            );
          }
          
          await saveProject(result.generatedCode, result.reply);
        } else {
          throw new Error('Edit validation failed - changes may have been too broad');
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ **${parseResult.targetComponent} Updated!**\n\n**Action**: ${parseResult.action}\n**Changes**: ${parseResult.changes}\n\n${result?.reply || 'I\'ve made the targeted changes while preserving your existing design and functionality!'}`,
        timestamp: new Date(),
        component: parseResult.targetComponent,
        parseResult: 'success'
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('❌ Intelligent chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Processing Error**\n\nI encountered an issue while making your changes: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 **Please Try**:\n• Being more specific about the component\n• Using simpler language\n• Mentioning specific elements like "button", "header", or "title"`,
        timestamp: new Date(),
        parseResult: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: "Failed to understand or apply your request. Please be more specific.",
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
          <Brain size={20} className="text-white" />
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
              <Brain size={12} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-xs">Intelligent Editor</h3>
              {channelData && (
                <p className="text-gray-400 text-xs truncate max-w-32">{channelData.title}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {memory && (
              <Badge variant="outline" className="text-xs px-1 py-0 text-green-400 border-green-400/30">
                Smart: {Object.keys(memory.components || {}).length}
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
                  <Brain size={10} className="text-white" />
                </div>
              )}
              <div className={`max-w-[85%] p-2 rounded-lg transition-all duration-200 hover:scale-[1.01] ${
                message.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : message.parseResult === 'failed' 
                    ? 'bg-yellow-800/50 text-yellow-100 border border-yellow-600/30'
                    : message.parseResult === 'error'
                      ? 'bg-red-800/50 text-red-100 border border-red-600/30'
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
                  <div className="flex items-center gap-1">
                    {message.component && (
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {message.component}
                      </Badge>
                    )}
                    {message.parseResult && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-1 py-0 ${
                          message.parseResult === 'success' 
                            ? 'text-green-400 border-green-400/30'
                            : message.parseResult === 'failed'
                              ? 'text-yellow-400 border-yellow-400/30'
                              : 'text-red-400 border-red-400/30'
                        }`}
                      >
                        {message.parseResult}
                      </Badge>
                    )}
                  </div>
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
                <Brain size={10} className="text-white" />
              </div>
              <div className="bg-gray-800/50 text-gray-100 p-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 size={10} className="animate-spin" />
                  <span className="text-xs">Parsing intent & applying targeted changes...</span>
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
              placeholder="Natural language (e.g., 'make the button bigger and red')"
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
              Intelligent parsing: {Object.keys(memory.components || {}).length} components mapped
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperEnhancedChatbot;
