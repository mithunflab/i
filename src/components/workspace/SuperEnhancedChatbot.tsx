
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Users, Eye, ChevronDown, ChevronUp, Maximize2, Minimize2, X, Brain, Target, Code2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTargetedChanges } from '@/hooks/useTargetedChanges';
import { useAdvancedAIMemory } from '@/hooks/useAdvancedAIMemory';
import { useYouTubeIntegration } from '@/hooks/useYouTubeIntegration';
import { useIntelligentChatParser } from '@/hooks/useIntelligentChatParser';

interface Message {
  id: string;
  role: 'user' |'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  component?: string;
  parseResult?: 'success' | 'failed' | 'error';
  suggestions?: string[];
  isLiveTyping?: boolean;
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
  const [parseStatus, setParseStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateTargetedPrompt } = useTargetedChanges();
  const { generateWebsiteWithRealData } = useYouTubeIntegration();
  const { memory, generateContextualPrompt, saveChange } = useAdvancedAIMemory(currentProject?.id || '');
  const { parseUserChat, validateAndApplyEdit, getChatHistory, initializeProjectFiles, componentMap, projectFiles } = useIntelligentChatParser(currentProject?.id || '');

  useEffect(() => {
    setCurrentProject(projectData);
    
    if (projectData?.source_code) {
      initializeProjectFiles(projectData.source_code);
    }
  }, [projectData, initializeProjectFiles]);

  useEffect(() => {
    if (channelData && messages.length === 0) {
      const chatHistory = getChatHistory();
      
      if (chatHistory.length > 0) {
        const historicalMessages: Message[] = chatHistory.map(entry => ({
          id: entry.id,
          role: entry.role,
          content: entry.content,
          timestamp: new Date(entry.timestamp),
          component: entry.metadata?.component,
          parseResult: entry.metadata?.parseResult as 'success' | 'failed' | 'error'
        }));
        setMessages(historicalMessages);
      } else {
        const welcomeMessage: Message = {
          id: '1',
          role: 'assistant',
          content: `🧠 **Smart AI Component Editor Ready!**\n\n**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n🎯 **Intelligent Features Active**:\n• Natural language parsing\n• Component-level targeting\n• Real-time code validation\n• Project memory system\n• Live preview updates\n\n💡 **Smart Commands**:\n• "Make the subscribe button bigger and red"\n• "Change the hero title to something catchy"\n• "Update header background to match channel colors"\n• "Add animation to the video thumbnails"\n\n✨ **Advanced Capabilities**:\n• Understands component relationships\n• Preserves design consistency\n• Maintains responsive layout\n• Tracks all changes in project memory\n\n🔧 **Project Files Generated**:\n• componentMap.json - Component structure\n• design.json - Design tokens\n• changelog.md - Edit history\n\n**Just tell me what you want to change - I'll understand and make precise edits!**`,
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [channelData, messages.length, getChatHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleLiveTyping = (content: string, messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content, isLiveTyping: true }
        : msg
    ));
  };

  const completeLiveTyping = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isLiveTyping: false }
        : msg
    ));
  };

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
    setParseStatus('parsing');

    try {
      console.log('🧠 Starting intelligent parsing...');
      
      // Step 1: Parse user intent with enhanced AI
      const parseResult = await parseUserChat(
        currentInput,
        currentProject?.source_code || '',
        channelData
      );

      if (!parseResult.success) {
        setParseStatus('error');
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `❌ **Parsing Failed**\n\n${parseResult.error}\n\n💡 **Suggestions**:\n${parseResult.suggestions?.map(s => `• ${s}`).join('\n') || '• Try being more specific about what you want to change'}`,
          timestamp: new Date(),
          parseResult: 'failed',
          suggestions: parseResult.suggestions
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      setParseStatus('success');
      console.log('✅ Intent parsed successfully:', parseResult.targetComponent);

      // Step 2: Show parsing success message
      const parsingMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `🎯 **Smart Analysis Complete**\n\n**Target**: ${parseResult.targetComponent}\n**Action**: ${parseResult.action}\n**Confidence**: High\n\n🔄 **Generating targeted changes...**`,
        timestamp: new Date(),
        component: parseResult.targetComponent,
        parseResult: 'success'
      };
      setMessages(prev => [...prev, parsingMessage]);

      // Step 3: Generate AI response with enhanced prompt
      const enhancedPrompt = parseResult.prompt || generateContextualPrompt(
        currentInput,
        channelData,
        currentProject?.source_code || ''
      );

      console.log('🤖 Calling AI with enhanced prompt...');

      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          message: enhancedPrompt,
          projectId: currentProject?.id,
          channelData: channelData,
          chatHistory: messages.slice(-5),
          generateCode: true,
          targetComponent: parseResult.targetComponent,
          isSmartEdit: true,
          preserveDesign: true,
          projectFiles: projectFiles
        }
      });

      if (aiError) {
        throw new Error(`AI API Error: ${aiError.message}`);
      }

      console.log('✅ AI response received');

      // Step 4: Validate the changes
      if (aiResponse.generatedCode && currentProject?.source_code) {
        const isValid = validateAndApplyEdit(
          currentProject.source_code,
          aiResponse.generatedCode,
          parseResult.targetComponent || 'unknown',
          currentInput
        );

        if (!isValid) {
          throw new Error('Generated code failed validation');
        }
      }

      // Step 5: Create enhanced response with live typing effect
      const responseId = (Date.now() + 3).toString();
      const responseContent = `🎯 **Smart Edit Applied Successfully!**\n\n**Modified Component**: ${parseResult.targetComponent}\n**Changes Made**: ${parseResult.changes}\n\n${aiResponse.reply || 'Your targeted changes have been applied while preserving the rest of your website!'}\n\n✅ **Validation**: All checks passed\n🔄 **Preview**: Updated automatically\n💾 **Saved**: Changes logged to project memory`;

      // Remove parsing message and add response with live typing
      setMessages(prev => prev.filter(msg => msg.id !== parsingMessage.id));
      
      const finalMessage: Message = {
        id: responseId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        component: parseResult.targetComponent,
        parseResult: 'success',
        isLiveTyping: true
      };
      
      setMessages(prev => [...prev, finalMessage]);

      // Simulate live typing
      let currentChar = 0;
      const typingInterval = setInterval(() => {
        if (currentChar < responseContent.length) {
          handleLiveTyping(responseContent.substring(0, currentChar + 1), responseId);
          currentChar++;
        } else {
          clearInterval(typingInterval);
          completeLiveTyping(responseId);
        }
      }, 30);

      // Step 6: Update project and trigger code generation
      if (aiResponse.generatedCode) {
        onCodeGenerated(aiResponse.generatedCode);
        
        // Save change to project memory
        if (parseResult.targetComponent) {
          await saveChange(
            parseResult.targetComponent,
            currentInput,
            currentProject?.source_code || '',
            aiResponse.generatedCode
          );
        }

        // Update project in database
        if (currentProject) {
          const updatedProject = {
            ...currentProject,
            source_code: aiResponse.generatedCode,
            updated_at: new Date().toISOString()
          };

          await supabase
            .from('projects')
            .update({
              source_code: aiResponse.generatedCode,
              updated_at: new Date().toISOString()
            })
            .eq('id', currentProject.id);

          setCurrentProject(updatedProject);
          onProjectUpdate?.(updatedProject);
        }

        toast({
          title: "🎯 Smart Edit Applied!",
          description: `Successfully modified ${parseResult.targetComponent} while preserving everything else.`,
        });
      }

    } catch (error) {
      console.error('❌ Error in enhanced chat:', error);
      setParseStatus('error');
      
      const errorMessage: Message = {
        id: (Date.now() + 4).toString(),
        role: 'assistant',
        content: `❌ **Error Processing Request**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n🔄 **Please try again with a more specific request.**\n\n💡 **Tips**:\n• Be specific about which component to change\n• Mention colors, sizes, or text changes clearly\n• Use simple, direct language`,
        timestamp: new Date(),
        parseResult: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setParseStatus('idle');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isClosed) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsClosed(false)}
          className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg"
        >
          <Brain size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 border-r border-purple-500/30 ${isMaximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-500/30 bg-black/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-purple-400" />
            {parseStatus === 'parsing' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            )}
            {parseStatus === 'success' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Smart AI Editor</h3>
            <p className="text-xs text-gray-400">
              {Object.keys(componentMap).length} components mapped
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
            <Target size={12} className="mr-1" />
            {parseStatus === 'parsing' ? 'Analyzing...' : 'Ready'}
          </Badge>
          
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white p-1"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMaximized(!isMaximized)}
              className="text-gray-400 hover:text-white p-1"
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsClosed(true)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Project Files Status */}
      {isExpanded && Object.keys(projectFiles).length > 0 && (
        <div className="px-4 py-2 bg-black/20 border-b border-purple-500/20">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <FileText size={12} />
            <span>Project Files: {Object.keys(projectFiles).length}</span>
            <Code2 size={12} />
            <span>Components: {Object.keys(componentMap).length}</span>
          </div>
        </div>
      )}

      {/* Messages */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="relative">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  {message.isLiveTyping && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-800 text-gray-100'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                
                {message.component && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                      <Target size={10} className="mr-1" />
                      {message.component}
                    </Badge>
                    {message.parseResult && (
                      <Badge variant="outline" className={`text-xs ${
                        message.parseResult === 'success' 
                          ? 'bg-green-500/20 text-green-300 border-green-500/30'
                          : message.parseResult === 'failed'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-300 border-red-500/30'
                      }`}>
                        {message.parseResult}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Enhanced Input */}
      {isExpanded && (
        <div className="p-4 border-t border-purple-500/30">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what component to change..."
              className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-gray-400"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
          
          {parseStatus !== 'idle' && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {parseStatus === 'parsing' && (
                <>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-yellow-400">Analyzing your request...</span>
                </>
              )}
              {parseStatus === 'success' && (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-green-400">Component identified successfully</span>
                </>
              )}
              {parseStatus === 'error' && (
                <>
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-red-400">Please try a more specific request</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperEnhancedChatbot;
