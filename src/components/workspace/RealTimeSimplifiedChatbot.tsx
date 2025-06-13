
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Send, Bot, User, Zap, Code, Globe, Github, Settings, AlertCircle } from 'lucide-react';
import { useRealTimeAIGeneration } from '@/hooks/useRealTimeAIGeneration';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  feature?: string;
  generatedCode?: string;
  codeDescription?: string;
}

interface RealTimeSimplifiedChatbotProps {
  projectId: string;
  sourceCode: string;
  channelData?: any;
  onCodeUpdate: (newCode: string, targetFile?: string) => void;
  onChatHistoryUpdate: (history: Message[]) => void;
}

const RealTimeSimplifiedChatbot: React.FC<RealTimeSimplifiedChatbotProps> = ({
  projectId,
  sourceCode,
  channelData,
  onCodeUpdate,
  onChatHistoryUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { generateWithAI, loading } = useRealTimeAIGeneration();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: `🎯 **Real-Time AI Website Builder Ready!**\n\n${channelData?.title ? `Building for **${channelData.title}** (${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers)` : 'Ready to build your website!'}\n\n**What I can do:**\n• Generate complete website code\n• Make real-time modifications\n• Add new features and pages\n• Deploy to GitHub & Netlify\n\n**Example requests:**\n• "Create a modern portfolio homepage"\n• "Add a video gallery section"\n• "Make the design more professional"\n• "Add a contact form with animation"\n\n💡 **Tip:** Be specific about what you want - I'll generate it instantly!`,
        timestamp: new Date(),
        feature: 'welcome'
      };
      setMessages([welcomeMessage]);
    }
  }, [channelData]);

  useEffect(() => {
    scrollToBottom();
    onChatHistoryUpdate(messages);
  }, [messages, onChatHistoryUpdate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the AI assistant",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage.trim();
    setInputMessage('');

    try {
      console.log('🤖 Sending message to AI:', currentInput);
      
      const projectContext = {
        sourceCode,
        channelData,
        projectId,
        currentMessages: messages
      };

      const aiResponse = await generateWithAI(
        currentInput,
        projectId,
        channelData,
        projectContext
      );

      if (aiResponse) {
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          type: 'ai',
          content: aiResponse.reply,
          timestamp: new Date(),
          feature: aiResponse.feature,
          generatedCode: aiResponse.generatedCode,
          codeDescription: aiResponse.codeDescription
        };

        setMessages(prev => [...prev, aiMessage]);

        // Update code if generated
        if (aiResponse.generatedCode) {
          console.log('🔄 Updating code with AI response');
          onCodeUpdate(aiResponse.generatedCode);
          
          toast({
            title: "✨ Code Updated!",
            description: aiResponse.codeDescription || "Website updated with AI-generated code",
          });
        }

        console.log('✅ AI response processed successfully');
      }

    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: `❌ **AI Generation Error**\n\nSorry, I encountered an issue processing your request. This could be due to:\n\n• **API Configuration**: OpenRouter API key might not be configured\n• **Network Issues**: Connection problems\n• **Rate Limits**: Too many requests\n\n🔄 **Please try:**\n• Refreshing the page\n• Using a simpler request\n• Checking your internet connection\n\n💡 **Example**: "Create a simple homepage with my channel info"`,
        timestamp: new Date(),
        feature: 'error-handling'
      };

      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFeatureBadge = (feature?: string) => {
    switch (feature) {
      case 'website-generation':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs"><Code size={10} className="mr-1" />Code Generated</Badge>;
      case 'deployment':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"><Globe size={10} className="mr-1" />Deployed</Badge>;
      case 'github-integration':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs"><Github size={10} className="mr-1" />GitHub</Badge>;
      case 'error-handling':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs"><AlertCircle size={10} className="mr-1" />Error</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Bot className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-white text-sm">AI Assistant</span>
            </div>
            <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Real-time
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white ml-auto' 
                    : 'bg-gray-800 text-gray-100'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.type === 'user' && <User className="w-3 h-3" />}
                    {getFeatureBadge(message.feature)}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.generatedCode && (
                    <div className="mt-2 p-2 bg-gray-700 rounded text-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <Code className="w-3 h-3" />
                        <span className="text-green-400">Code Generated</span>
                      </div>
                      <div className="text-gray-300">{message.codeDescription}</div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 px-3">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-800 text-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-gray-400 ml-1">AI is generating...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-4 bg-gray-800/50">
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe what you want to build or modify..."
            className="bg-gray-700 border-gray-600 text-white text-sm"
            disabled={loading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default RealTimeSimplifiedChatbot;
