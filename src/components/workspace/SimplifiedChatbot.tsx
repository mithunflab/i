
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OpenRouterService } from '@/utils/openRouterService';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface SimplifiedChatbotProps {
  projectId: string;
  sourceCode?: string;
  channelData?: any;
  onCodeUpdate?: (code: string, targetFile?: string) => void;
  onChatHistoryUpdate?: (history: Message[]) => void;
}

const SimplifiedChatbot: React.FC<SimplifiedChatbotProps> = ({
  projectId,
  sourceCode,
  channelData,
  onCodeUpdate,
  onChatHistoryUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load chat history from localStorage on component mount
    const savedHistory = localStorage.getItem(`chat-history-${projectId}`);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    }
  }, [projectId]);

  useEffect(() => {
    // Update parent component with chat history
    if (onChatHistoryUpdate) {
      onChatHistoryUpdate(messages);
    }
    
    // Save to localStorage
    if (messages.length > 0) {
      localStorage.setItem(`chat-history-${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId, onChatHistoryUpdate]);

  const addMessage = (role: 'user' | 'assistant', content: string, metadata?: any) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      metadata
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    addMessage('user', userMessage);
    setIsLoading(true);

    try {
      // Prepare context for the AI
      const systemPrompt = `You are an expert web developer specializing in YouTube channel websites. 
You can generate, modify, and improve HTML, CSS, and JavaScript code.

Current project context:
${channelData ? `- Channel: ${channelData.title} (${channelData.subscriberCount} subscribers)` : ''}
${channelData ? `- Description: ${channelData.description?.substring(0, 200)}...` : ''}
${sourceCode ? `- Current code length: ${sourceCode.length} characters` : ''}

When the user asks for changes:
1. Generate complete, working HTML code with embedded CSS and JavaScript
2. Make the website responsive and modern
3. Include the YouTube channel data appropriately
4. Follow modern web development best practices
5. Always provide complete code that can be directly used

Respond with complete HTML code when making changes, or provide helpful guidance when asked questions.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ];

      // Call OpenRouter API
      const response = await OpenRouterService.makeRequest(
        '', // Use default free model
        messages,
        user?.id || 'anonymous',
        'chat'
      );

      const aiResponse = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      // Add AI response
      const aiMessage = addMessage('assistant', aiResponse, {
        model: response.selectedModel,
        timestamp: new Date()
      });

      // Check if the response contains HTML code
      const htmlMatch = aiResponse.match(/```html\n([\s\S]*?)\n```/) || 
                       aiResponse.match(/<!DOCTYPE html[\s\S]*<\/html>/);
      
      if (htmlMatch) {
        const code = htmlMatch[1] || htmlMatch[0];
        if (onCodeUpdate) {
          onCodeUpdate(code, 'index.html');
        }
        
        toast({
          title: "Code Updated",
          description: "Your website has been updated with the new code",
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-red-950/20 backdrop-blur-sm">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-red-300/70 py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Ask me to modify your YouTube website!</p>
              <p className="text-xs mt-1">Examples: "Make the header bigger", "Add animation", "Change colors"</p>
            </div>
          )}
          
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-red-600' 
                    : 'bg-red-800'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-3 h-3 text-white" />
                  ) : (
                    <Bot className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className={`rounded-lg p-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-red-600/80 text-white'
                    : 'bg-red-900/60 text-red-100 border border-red-500/30'
                }`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.metadata?.model && (
                    <div className="text-xs opacity-70 mt-1">
                      via {message.metadata.model}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="flex gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-red-800 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-white" />
                </div>
                <div className="bg-red-900/60 text-red-100 border border-red-500/30 rounded-lg p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Generating response...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t border-red-500/30 bg-red-950/30 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to modify your website..."
            disabled={isLoading}
            className="flex-1 bg-red-950/60 border-red-500/40 text-white placeholder-red-300/70 text-sm h-8"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !input.trim()}
            className="bg-red-600 hover:bg-red-700 px-3 h-8"
          >
            <Send className="w-3 h-3" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SimplifiedChatbot;
