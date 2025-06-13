
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Loader2, Github, Zap, CheckCircle, AlertCircle, Code, Globe } from 'lucide-react';
import { useUnifiedRealTimeGeneration } from '@/hooks/useUnifiedRealTimeGeneration';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    provider?: string;
    syncResult?: any;
    generatedCode?: string;
  };
}

interface UnifiedChatbotProps {
  projectData?: any;
  channelData?: any;
  onCodeGenerated?: (code: string) => void;
  onProjectUpdate?: (project: any) => void;
}

const UnifiedChatbot: React.FC<UnifiedChatbotProps> = ({
  projectData,
  channelData,
  onCodeGenerated,
  onProjectUpdate
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { 
    isGenerating, 
    isSyncing, 
    generatedCode, 
    lastSyncResult, 
    generateAndSync 
  } = useUnifiedRealTimeGeneration();

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: `🚀 **Unified AI Website Builder Ready!**\n\n${channelData ? `**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n` : ''}✨ **New Features:**\n• Reliable AI generation with multiple providers (OpenRouter → Groq → Fallback)\n• Automatic GitHub sync and repository creation\n• Real-time status updates\n• Error recovery and comprehensive logging\n\n💡 **Tell me what you want to create or modify!**`,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [channelData, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle code generation results
  useEffect(() => {
    if (generatedCode) {
      onCodeGenerated?.(generatedCode);
    }
  }, [generatedCode, onCodeGenerated]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    const processingMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: `🔄 **Processing your request...**\n\n🤖 Generating code with AI...\n📁 Will auto-sync to GitHub when complete...\n\n⚡ Using multiple AI providers for reliability`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, processingMessage]);
    
    const currentInput = inputValue;
    setInputValue('');

    try {
      const result = await generateAndSync(
        currentInput,
        channelData,
        projectData?.id || crypto.randomUUID(),
        projectData?.source_code,
        {
          autoSync: true,
          preserveDesign: true,
          createRepo: !projectData?.github_url
        }
      );

      // Remove processing message
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));

      if (result?.success) {
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: `✅ **Generation Complete!**\n\n🤖 **AI Provider**: ${result.provider}\n📝 **Response**: ${result.reply}\n\n${result.syncResult ? `🚀 **GitHub Sync**: ${result.syncResult.syncedFiles}/${result.syncResult.totalFiles} files synced\n📁 **Repository**: [View on GitHub](${result.syncResult.repositoryUrl})\n🔗 **Commit**: ${result.syncResult.commitHash}\n\n` : '⚠️ **Note**: GitHub sync was skipped or failed\n\n'}💡 **What's next?** Tell me what else you'd like to modify!`,
          timestamp: new Date(),
          metadata: {
            provider: result.provider,
            syncResult: result.syncResult,
            generatedCode: result.code
          }
        };

        setMessages(prev => [...prev, successMessage]);
        
        // Update project data if callback provided
        if (onProjectUpdate && result.syncResult?.repositoryUrl) {
          onProjectUpdate({
            ...projectData,
            github_url: result.syncResult.repositoryUrl,
            source_code: result.code
          });
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'bot',
          content: `❌ **Generation Failed**\n\n**Error**: ${result?.error || 'Unknown error'}\n\n🔄 **Please try again** - the system will automatically try different AI providers.\n\n💡 **Tip**: Try being more specific about what you want to change.`,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      // Remove processing message
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        type: 'bot',
        content: `❌ **Unexpected Error**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n🔄 Please try again.`,
        timestamp: new Date()
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

  const getStatusIcon = () => {
    if (isGenerating) return <Loader2 className="animate-spin" size={16} />;
    if (isSyncing) return <Github className="animate-pulse" size={16} />;
    return <Zap size={16} />;
  };

  const getStatusText = () => {
    if (isGenerating) return 'Generating with AI...';
    if (isSyncing) return 'Syncing to GitHub...';
    return 'Ready';
  };

  const getStatusColor = () => {
    if (isGenerating) return 'bg-blue-500';
    if (isSyncing) return 'bg-purple-500';
    return 'bg-green-500';
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Header */}
      <div className="p-4 border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-cyan-400">Unified AI Builder</h3>
              <p className="text-xs text-purple-300">Reliable AI + Auto GitHub Sync</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${getStatusColor()} text-white border-0`}>
              <div className="flex items-center gap-1">
                {getStatusIcon()}
                {getStatusText()}
              </div>
            </Badge>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1 text-blue-400">
            <div className={`w-2 h-2 rounded-full ${isGenerating ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></div>
            AI Generation
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-purple-400 animate-pulse' : 'bg-gray-600'}`}></div>
            GitHub Sync
          </div>
          <div className="flex items-center gap-1 text-green-400">
            <div className={`w-2 h-2 rounded-full ${lastSyncResult ? 'bg-green-400' : 'bg-gray-600'}`}></div>
            {lastSyncResult ? 'Synced' : 'Ready'}
          </div>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-black/80 border border-cyan-500/30 backdrop-blur-sm text-white'
                }`}
              >
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
                
                {/* Enhanced metadata display */}
                {message.metadata && (
                  <div className="mt-3 space-y-2">
                    {message.metadata.provider && (
                      <div className="flex items-center gap-2 text-xs text-cyan-400">
                        <Zap size={12} />
                        <span>Generated with {message.metadata.provider}</span>
                      </div>
                    )}
                    
                    {message.metadata.syncResult && (
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle size={12} />
                          <span>{message.metadata.syncResult.syncedFiles} files synced</span>
                        </div>
                        {message.metadata.syncResult.repositoryUrl && (
                          <a
                            href={message.metadata.syncResult.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                          >
                            <Github size={12} />
                            <span>Repository</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs opacity-70 mt-2 text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Enhanced Input */}
      <div className="p-4 border-t border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Tell me what to create or modify${channelData ? ` for ${channelData.title}` : ''}...`}
            className="flex-1 bg-black/80 border-cyan-500/50 text-white placeholder-gray-400 focus:border-cyan-400"
            disabled={isGenerating || isSyncing || !user}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating || isSyncing || !user}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isGenerating || isSyncing ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </div>
        
        {!user && (
          <p className="text-xs text-red-400 mt-2">Please log in to use AI generation</p>
        )}
      </div>
    </div>
  );
};

export default UnifiedChatbot;
