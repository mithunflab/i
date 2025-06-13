
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
      // Simplified AI response with basic HTML generation
      let aiResponse = "I'll help you create a website! Here's a basic structure:";
      let generatedCode = '';

      if (userMessage.toLowerCase().includes('website') || userMessage.toLowerCase().includes('create')) {
        generatedCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'My Website'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; }
        .title { font-size: 3rem; margin-bottom: 10px; }
        .subtitle { font-size: 1.2rem; opacity: 0.9; }
        .content { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
            gap: 20px; 
            margin-top: 40px; 
        }
        .card { 
            background: rgba(255, 255, 255, 0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .card h3 { margin-bottom: 15px; font-size: 1.5rem; }
        .stats { display: flex; justify-content: space-around; margin-top: 40px; }
        .stat { text-align: center; }
        .stat-number { font-size: 2rem; font-weight: bold; }
        .stat-label { opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1 class="title">${channelData?.title || 'Welcome'}</h1>
            <p class="subtitle">${channelData?.description || 'Professional Website'}</p>
        </header>
        
        <div class="content">
            <div class="card">
                <h3>About</h3>
                <p>Welcome to our amazing platform! We create engaging content and build communities.</p>
            </div>
            <div class="card">
                <h3>Services</h3>
                <p>We offer professional web development, content creation, and digital marketing services.</p>
            </div>
            <div class="card">
                <h3>Contact</h3>
                <p>Get in touch with us for collaborations and business opportunities.</p>
            </div>
        </div>
        
        ${channelData ? `
        <div class="stats">
            <div class="stat">
                <div class="stat-number">${parseInt(channelData.subscriberCount || '0').toLocaleString()}</div>
                <div class="stat-label">Subscribers</div>
            </div>
            <div class="stat">
                <div class="stat-number">${parseInt(channelData.videoCount || '100').toLocaleString()}</div>
                <div class="stat-label">Videos</div>
            </div>
            <div class="stat">
                <div class="stat-number">${parseInt(channelData.viewCount || '1000000').toLocaleString()}</div>
                <div class="stat-label">Views</div>
            </div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;

        aiResponse += "\n\nI've created a modern website with a gradient background and responsive design!";
      }

      // Add AI response
      const aiMessage = addMessage('assistant', aiResponse, {
        model: 'local-generation',
        timestamp: new Date()
      });

      // Apply generated code if available
      if (generatedCode && onCodeUpdate) {
        onCodeUpdate(generatedCode, 'index.html');
        
        toast({
          title: "Website Created",
          description: "Your website has been generated successfully!",
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      addMessage('assistant', 'Sorry, I encountered an error. Please try again with a simpler request.', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast({
        title: "Error",
        description: "Failed to process request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-red-950/20 backdrop-blur-sm border-r border-red-500/20">
      {/* Header with Back Button */}
      <div className="p-3 border-b border-red-500/30 bg-red-950/40 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/')}
              size="sm"
              variant="ghost"
              className="text-red-200 hover:text-white hover:bg-red-600/40 p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse delay-200"></div>
              <div className="w-2 h-2 bg-red-700 rounded-full animate-pulse delay-300"></div>
            </div>
            <h2 className="font-semibold text-white text-sm">AI Assistant</h2>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-red-300/70 py-8">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Ask me to create your website!</p>
              <p className="text-xs mt-1">Try: "Create a modern website" or "Build a portfolio"</p>
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
                    <span>Creating your website...</span>
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
            placeholder="Ask AI to create your website..."
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
