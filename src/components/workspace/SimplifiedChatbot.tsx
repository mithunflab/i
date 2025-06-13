
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Code
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  generatedCode?: string;
}

interface SimplifiedChatbotProps {
  projectId: string;
  sourceCode?: string;
  channelData?: any;
  onCodeUpdate?: (newCode: string, targetFile?: string) => void;
}

const SimplifiedChatbot: React.FC<SimplifiedChatbotProps> = ({
  projectId,
  sourceCode = '',
  channelData,
  onCodeUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `🤖 **AI Website Builder**\n\n${channelData ? `**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n` : ''}💬 **Tell me what you want to create:**\n• "Create a modern landing page"\n• "Build a YouTube channel website"\n• "Make a professional portfolio"\n• "Add a contact form"\n• "Change the color scheme"\n\n✨ **I'll help you build your website step by step!**`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [channelData]);

  const generateMockCode = (userRequest: string, channelData: any) => {
    const isContactForm = userRequest.toLowerCase().includes('contact');
    const isColorChange = userRequest.toLowerCase().includes('color');
    const isLayout = userRequest.toLowerCase().includes('layout') || userRequest.toLowerCase().includes('design');

    if (isContactForm) {
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'My Website'} - Contact</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Poppins', sans-serif; }
        .red-gradient { background: linear-gradient(135deg, #dc2626, #b91c1c); }
        .glass-effect { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.1); }
    </style>
</head>
<body class="bg-gradient-to-br from-red-950 via-red-900 to-black text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="glass-effect rounded-2xl p-6 mb-8">
            <h1 class="text-4xl font-bold text-center mb-4">${channelData?.title || 'Contact Us'}</h1>
        </header>
        
        <main class="glass-effect rounded-2xl p-8">
            <form class="max-w-md mx-auto space-y-6">
                <div>
                    <label class="block text-red-200 text-sm font-bold mb-2">Name</label>
                    <input type="text" class="w-full px-3 py-2 bg-red-950/50 border border-red-500/30 rounded text-white" required>
                </div>
                <div>
                    <label class="block text-red-200 text-sm font-bold mb-2">Email</label>
                    <input type="email" class="w-full px-3 py-2 bg-red-950/50 border border-red-500/30 rounded text-white" required>
                </div>
                <div>
                    <label class="block text-red-200 text-sm font-bold mb-2">Message</label>
                    <textarea rows="4" class="w-full px-3 py-2 bg-red-950/50 border border-red-500/30 rounded text-white" required></textarea>
                </div>
                <button type="submit" class="w-full red-gradient text-white font-bold py-2 px-4 rounded hover:scale-105 transition-transform">
                    Send Message
                </button>
            </form>
        </main>
    </div>
</body>
</html>`;
    }

    // Default website generation
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'My Website'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }
        .red-gradient { background: linear-gradient(135deg, #dc2626, #b91c1c, #991b1b); }
        .glass-effect { backdrop-filter: blur(20px); background: rgba(255, 255, 255, 0.1); }
        .shine { background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%); }
    </style>
</head>
<body class="bg-gradient-to-br from-red-950 via-red-900 to-black text-white min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="glass-effect rounded-2xl p-6 mb-8 shine">
            <div class="flex items-center justify-center gap-4">
                ${channelData?.thumbnail ? `<img src="${channelData.thumbnail}" alt="${channelData.title}" class="w-16 h-16 rounded-full border-4 border-red-500">` : ''}
                <div class="text-center">
                    <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400">
                        ${channelData?.title || 'Welcome to My Website'}
                    </h1>
                    ${channelData?.subscriberCount ? `<p class="text-red-300">${parseInt(channelData.subscriberCount).toLocaleString()} subscribers</p>` : ''}
                </div>
            </div>
        </header>
        
        <main class="glass-effect rounded-2xl p-8 shine">
            <div class="text-center mb-8">
                <h2 class="text-3xl font-bold mb-4">Your request: "${userRequest}"</h2>
                <p class="text-xl text-red-300">This website was generated based on your request!</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
                    <h3 class="text-xl font-semibold mb-4 text-red-300">Modern Design</h3>
                    <p>Beautiful, responsive design with YouTube-inspired red theme</p>
                </div>
                <div class="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
                    <h3 class="text-xl font-semibold mb-4 text-red-300">AI Powered</h3>
                    <p>Generated with advanced AI to match your specific requirements</p>
                </div>
                <div class="glass-effect rounded-xl p-6 hover:scale-105 transition-transform">
                    <h3 class="text-xl font-semibold mb-4 text-red-300">Fully Customizable</h3>
                    <p>Ask me to modify anything and I'll update the code instantly</p>
                </div>
            </div>
        </main>
    </div>
</body>
</html>`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

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
      // Generate code based on user request
      const mockCode = generateMockCode(currentInput, channelData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ **Website Updated!**\n\nI've created/updated your website based on: "${currentInput}"\n\n**Changes made:**\n• Generated responsive HTML structure\n• Applied YouTube-inspired red theme\n• Added glass morphism effects\n• Integrated your ${channelData ? 'channel data' : 'custom content'}\n\n🎨 **You can see the live preview on the right!**\n\nWant me to modify anything? Just ask!`,
        timestamp: new Date(),
        generatedCode: mockCode
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (onCodeUpdate) {
        onCodeUpdate(mockCode, 'index.html');
        toast({
          title: "🎨 Website Generated!",
          description: "Check the preview and code files!",
        });
      }

    } catch (error) {
      console.error('Error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ **Error Occurred**\n\nSorry, I couldn't process your request right now. Please try again.\n\n💡 **Try simpler requests like:**\n• "Make it blue"\n• "Add a contact form"\n• "Change the layout"`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
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
    <Card className="h-full flex flex-col bg-red-950/30 border-red-500/30 backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-red-500/20">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-red-400" />
            AI Assistant
          </div>
          <Badge variant="default" className="text-xs bg-red-600/30 text-red-300 border-red-500/30">
            Active
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                  <Bot className="w-4 h-4 text-red-300" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  message.role === 'user'
                    ? 'bg-red-600/50 text-white border border-red-500/30'
                    : 'bg-red-950/50 text-red-100 border border-red-500/30'
                }`}
              >
                {message.content}
                
                {message.generatedCode && (
                  <div className="mt-2">
                    <Badge variant="outline" className="bg-green-500/20 text-green-300 border-green-500/30 text-xs">
                      <Code className="w-3 h-3 mr-1" />
                      Code Generated
                    </Badge>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-red-700/30 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                  <User className="w-4 h-4 text-red-300" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center border border-red-500/30">
                <Loader2 className="w-4 h-4 text-red-300 animate-spin" />
              </div>
              <div className="bg-red-950/50 text-red-100 border border-red-500/30 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-red-300">Generating your website...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-red-500/20 p-4 bg-red-950/20">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me what to build or modify..."
              className="flex-1 bg-red-950/50 border-red-500/30 text-white placeholder-red-300/60"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-red-600 hover:bg-red-700"
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

export default SimplifiedChatbot;
