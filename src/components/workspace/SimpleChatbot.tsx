
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
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
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
    // Add welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI assistant. I can help you modify your website by understanding natural language commands like:

• "Change the header background to blue"
• "Make the subscribe button bigger and red"
• "Update the hero title text"
• "Add animation to the video thumbnails"

What would you like to change?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const parseUserIntent = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Simple intent detection
    const intents = {
      color: /color|background|bg|red|blue|green|yellow|purple|orange|pink|black|white|gray/i,
      size: /size|bigger|smaller|large|small|width|height|scale/i,
      text: /text|title|heading|content|write|change.*to/i,
      button: /button|btn|click|subscribe|cta/i,
      header: /header|top|navigation|nav|logo/i,
      hero: /hero|banner|main.*title|welcome|intro/i,
      video: /video|thumbnail|gallery|content/i,
      animation: /animate|animation|effect|transition|hover/i
    };

    const detectedIntents = Object.entries(intents)
      .filter(([, regex]) => regex.test(input))
      .map(([intent]) => intent);

    return {
      intents: detectedIntents,
      hasValidIntent: detectedIntents.length > 0,
      confidence: detectedIntents.length / Object.keys(intents).length
    };
  };

  const generateResponse = (userInput: string, parseResult: any) => {
    if (!parseResult.hasValidIntent) {
      return `I understand you want to make changes, but I need more specific details. Try something like:
      
• "Change the header background color to blue"
• "Make the subscribe button red and larger"
• "Update the main title text"

What specific element would you like to modify?`;
    }

    const { intents } = parseResult;
    let response = `I understand you want to modify `;
    
    if (intents.includes('header')) {
      response += `the header section`;
    } else if (intents.includes('hero')) {
      response += `the hero/banner area`;
    } else if (intents.includes('button')) {
      response += `a button element`;
    } else if (intents.includes('video')) {
      response += `the video section`;
    } else {
      response += `page elements`;
    }

    if (intents.includes('color')) {
      response += ` with color changes`;
    }
    if (intents.includes('size')) {
      response += ` with size adjustments`;
    }
    if (intents.includes('text')) {
      response += ` with text updates`;
    }
    if (intents.includes('animation')) {
      response += ` with animations`;
    }

    response += `.

✅ **Intent Recognized**: ${intents.join(', ')}
🎯 **Target Elements**: Looking for matching components...
🔧 **Changes Planned**: Processing your request...

*Note: This is a simplified response. The full AI system will implement actual code changes.*`;

    return response;
  };

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
      // Simple parsing logic
      const parseResult = parseUserIntent(userMessage.content);
      console.log('🤖 Parsing result:', parseResult);

      // Generate response
      const responseContent = generateResponse(userMessage.content, parseResult);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

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
                content: userMessage.content,
                metadata: { parseResult }
              },
              {
                project_id: projectId,
                user_id: user.id,
                message_type: 'assistant',
                content: assistantMessage.content,
                metadata: { intents: parseResult.intents }
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
        content: '❌ Sorry, I encountered an error processing your request. Please try again with a more specific request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
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
            <Bot className="h-5 w-5 text-blue-400" />
            AI Assistant
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
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
                Smart Mode
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
                <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-400" />
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
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
              <div className="bg-gray-800 text-gray-100 border border-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-400">Processing...</span>
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
              placeholder="Describe what you want to change..."
              className="flex-1 bg-gray-800 border-gray-600 text-white"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
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

export default SimpleChatbot;
