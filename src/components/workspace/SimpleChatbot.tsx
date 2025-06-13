
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Brain,
  Target,
  Code
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SmartProjectManager } from '@/utils/smartProjectManager';
import { useTargetedChanges } from '@/hooks/useTargetedChanges';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  component?: string;
  generatedCode?: string;
}

interface SimpleChatbotProps {
  projectId: string;
  sourceCode?: string;
  channelData?: any;
  onCodeUpdate?: (newCode: string) => void;
}

const SimpleChatbot: React.FC<SimpleChatbotProps> = ({
  projectId,
  sourceCode = '',
  channelData,
  onCodeUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [projectManager] = useState(() => new SmartProjectManager(projectId));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { generateTargetedPrompt } = useTargetedChanges();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize project with real channel data
    if (channelData && sourceCode) {
      projectManager.parseAndMapComponents(sourceCode);
      projectManager.extractDesignTokens(sourceCode);
      projectManager.generateREADME(`${channelData.title} Website`, channelData);
    }

    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🧠 **Smart AI Component Editor Ready!**\n\n**Channel**: ${channelData?.title || 'YouTube Channel'}\n**Subscribers**: ${parseInt(channelData?.subscriberCount || '0').toLocaleString()}\n\n🎯 **Intelligent Features Active:**\n• Component-level targeting\n• Real-time code validation\n• Project memory system\n• Design consistency preservation\n\n💡 **Smart Commands:**\n• "Make the subscribe button bigger and red"\n• "Change the hero title color to blue"\n• "Update header background"\n• "Add animation to video thumbnails"\n\n✨ **I understand your website structure and can make precise edits without changing unrelated code!**`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [channelData, sourceCode, projectManager]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      console.log('🎯 Processing targeted request with smart component editing...');

      // Identify target component
      const targetComponent = projectManager.identifyTargetComponent(currentInput);
      
      // Generate targeted prompt
      const targetedPrompt = generateTargetedPrompt(
        currentInput,
        sourceCode,
        { 
          id: projectId,
          designPrinciples: ['YouTube branding', 'responsive design', 'accessibility'],
          currentStructure: { 
            components: Array.from(projectManager['componentMap'].values()),
            styling: { colors: Array.from(projectManager['designTokens'].values()).filter(t => t.category === 'color') },
            layout: 'hero-focused'
          }
        },
        channelData
      );

      console.log('📝 Generated targeted prompt for component:', targetComponent);

      // Call AI with enhanced context
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          message: targetedPrompt,
          projectId: projectId,
          channelData: channelData,
          chatHistory: messages.slice(-5),
          generateCode: true,
          targetComponent: targetComponent,
          isSmartEdit: true,
          preserveDesign: true,
          currentCode: sourceCode
        }
      });

      if (aiError) {
        throw new Error(`AI API Error: ${aiError.message}`);
      }

      console.log('✅ Smart AI response received');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.reply || `🎯 **Smart Edit Applied Successfully!**\n\n**Modified Component**: ${targetComponent || 'detected element'}\n\nYour targeted changes have been applied while preserving the rest of your website design and functionality.`,
        timestamp: new Date(),
        component: targetComponent,
        generatedCode: aiResponse.generatedCode
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply generated code
      if (aiResponse.generatedCode && onCodeUpdate) {
        console.log('🎨 Applying smart component changes...');
        onCodeUpdate(aiResponse.generatedCode);
        
        // Log the change
        projectManager.logChange(
          targetComponent || 'unknown',
          'AI Edit',
          currentInput,
          `Applied targeted modification: ${currentInput.substring(0, 50)}...`
        );

        // Save chat message
        projectManager.saveChatMessage('user', currentInput);
        projectManager.saveChatMessage('assistant', assistantMessage.content, {
          component: targetComponent,
          parseResult: 'success'
        });

        // Update project files
        projectManager.updateFile('index.html', aiResponse.generatedCode);
        projectManager.parseAndMapComponents(aiResponse.generatedCode);

        toast({
          title: "🎯 Smart Edit Applied!",
          description: `Successfully modified ${targetComponent || 'component'} while preserving everything else.`,
        });
      }

    } catch (error) {
      console.error('❌ Error in smart chat processing:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ **Error Processing Request**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 **Please try again with a more specific request.**\n\n💡 **Tips:**\n• Be specific about which component to change\n• Mention colors, sizes, or text changes clearly\n• Use simple, direct language`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Processing Error",
        description: "Failed to process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <h2 className="font-semibold text-white">Smart AI Assistant</h2>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              <Target className="w-3 h-3 mr-1" />
              Component Editor
            </Badge>
          </div>
          <div className="text-xs text-white/60">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
            )}
            
            <div
              className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              }`}
            >
              {message.content}
              
              {message.component && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                    <Target className="w-3 h-3 mr-1" />
                    {message.component}
                  </Badge>
                  {message.generatedCode && (
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      <Code className="w-3 h-3 mr-1" />
                      Code Applied
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-600/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            </div>
            <div className="bg-gray-800 text-gray-100 border border-gray-700 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-400">Analyzing and applying smart changes...</span>
              </div>
            </div>
          )}
        </div>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what specific component to change..."
            className="flex-1 bg-gray-800 border-gray-600 text-white"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatbot;
