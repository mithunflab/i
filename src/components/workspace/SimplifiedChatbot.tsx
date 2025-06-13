
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Code, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useEnhancedProjectChat } from '@/hooks/useEnhancedProjectChat';

interface SimplifiedChatbotProps {
  projectId: string;
  sourceCode: string;
  channelData?: any;
  onCodeUpdate: (newCode: string, targetFile?: string) => void;
  onChatHistoryUpdate: (history: any[]) => void;
}

const SimplifiedChatbot: React.FC<SimplifiedChatbotProps> = ({
  projectId,
  sourceCode,
  channelData,
  onCodeUpdate,
  onChatHistoryUpdate
}) => {
  const [input, setInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    loading,
    sendMessage,
    isProcessing,
    deploymentStatus
  } = useEnhancedProjectChat(
    channelData?.customUrl || '',
    'AI-generated website',
    channelData
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    onChatHistoryUpdate(messages);
  }, [messages, onChatHistoryUpdate]);

  useEffect(() => {
    // Handle code updates from AI responses
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.type === 'bot' && latestMessage.generatedCode) {
      onCodeUpdate(latestMessage.generatedCode);
    }
  }, [messages, onCodeUpdate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setConnectionStatus('connecting');
    try {
      await sendMessage(input);
      setInput('');
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to send message:', error);
      setConnectionStatus('disconnected');
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = () => {
    if (isProcessing) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-700">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Processing
      </Badge>;
    }
    if (deploymentStatus === 'deploying') {
      return <Badge variant="secondary" className="bg-purple-100 text-purple-700">
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Deploying
      </Badge>;
    }
    if (deploymentStatus === 'deployed') {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Live
      </Badge>;
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-red-200/50 bg-red-50/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">AI Assistant</h3>
              <div className="flex items-center gap-2">
                {getConnectionIcon()}
                <span className="text-xs text-gray-600 capitalize">{connectionStatus}</span>
              </div>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-red-600 text-white ml-auto'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  
                  {message.generatedCode && (
                    <div className="mt-2 p-2 bg-black/10 rounded border-l-2 border-green-500">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Code className="w-3 h-3" />
                        Code Generated
                      </div>
                      <div className="text-xs opacity-80">
                        {message.codeDescription}
                      </div>
                    </div>
                  )}
                  
                  {message.githubUrl && (
                    <div className="mt-2 p-2 bg-black/10 rounded">
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Pushed to GitHub</span>
                      </div>
                    </div>
                  )}
                  
                  {message.netlifyUrl && (
                    <div className="mt-2 p-2 bg-black/10 rounded">
                      <div className="flex items-center gap-1 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>Deployed Live</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 mt-1 px-1">
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-red-200/50 bg-red-50/80">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI to modify your website..."
            disabled={loading}
            className="flex-1 bg-white/90 border-red-200 focus:border-red-400"
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {connectionStatus === 'disconnected' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            Connection lost. Trying to reconnect...
          </div>
        )}
      </form>
    </div>
  );
};

export default SimplifiedChatbot;
