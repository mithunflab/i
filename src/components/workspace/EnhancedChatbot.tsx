
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Zap,
  Brain,
  Code
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  generatedCode?: string;
  model?: string;
}

interface EnhancedChatbotProps {
  projectId: string;
  sourceCode?: string;
  channelData?: any;
  onCodeUpdate?: (newCode: string) => void;
}

const EnhancedChatbot: React.FC<EnhancedChatbotProps> = ({
  projectId,
  sourceCode = '',
  channelData,
  onCodeUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message with real AI capabilities
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **Real AI Website Builder Ready!**\n\n${channelData ? `**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n` : ''}🧠 **Real AI Features Active:**\n• OpenRouter AI models (Claude, GPT-4, Gemini)\n• Real-time code generation\n• Professional website creation\n• YouTube data integration\n• Responsive design optimization\n\n💬 **Tell me what you want to create:**\n• "Create a modern landing page"\n• "Build a YouTube channel website"\n• "Make a professional portfolio"\n• "Design an e-commerce site"\n\n✨ **I'll generate real code using advanced AI models!**`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [channelData]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending real AI request...');

      // Call the real chat edge function
      const { data: aiResponse, error } = await supabase.functions.invoke('chat', {
        body: {
          message: userMessage.content,
          projectId: projectId,
          channelData: channelData,
          generateCode: true
        }
      });

      if (error) {
        console.error('❌ AI API Error:', error);
        throw new Error(`AI API Error: ${error.message}`);
      }

      console.log('✅ Real AI response received:', aiResponse);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.reply || 'Website generated successfully!',
        timestamp: new Date(),
        generatedCode: aiResponse.generatedCode,
        model: aiResponse.model
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply generated code if available
      if (aiResponse.generatedCode && onCodeUpdate) {
        console.log('🎨 Applying generated code to preview...');
        onCodeUpdate(aiResponse.generatedCode);
        
        toast({
          title: "🎉 Website Generated!",
          description: `Created with ${aiResponse.model || 'AI'} - Check the preview!`,
        });
      }

      // Save to chat history
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('project_chat_history')
            .insert([
              {
                project_id: projectId,
                user_id: user.id,
                message_type: 'user',
                content: userMessage.content
              },
              {
                project_id: projectId,
                user_id: user.id,
                message_type: 'assistant',
                content: assistantMessage.content,
                metadata: { 
                  generatedCode: aiResponse.generatedCode,
                  model: aiResponse.model 
                }
              }
            ]);
        }
      } catch (error) {
        console.error('❌ Error saving chat history:', error);
      }

    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ **AI Error Occurred**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 **Please try again with:**\n• More specific requests\n• Simpler language\n• Clear website goals\n\n💡 **Example**: "Create a modern portfolio website with dark theme"`,
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "AI Error",
        description: "Failed to generate website. Please try again.",
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
    <Card className="h-full flex flex-col bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            Real AI Assistant
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  AI Ready
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
            {channelData && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                <Zap className="w-3 h-3 mr-1" />
                YouTube Data
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
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
                
                {message.generatedCode && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      <Code className="w-3 h-3 mr-1" />
                      Code Generated
                    </Badge>
                    {message.model && (
                      <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs">
                        {message.model}
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
                  <span className="text-sm text-gray-400">AI is generating your website...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what website to create..."
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
      </CardContent>
    </Card>
  );
};

export default EnhancedChatbot;
