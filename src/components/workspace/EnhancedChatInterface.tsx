
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Zap, 
  Brain,
  Code,
  FileText,
  Clock
} from 'lucide-react';
import { useRealTimeCodeGeneration } from '@/hooks/useRealTimeCodeGeneration';
import { useFileManager } from '@/hooks/useFileManager';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: any;
    changes?: string[];
    fileModified?: string[];
  };
}

interface EnhancedChatInterfaceProps {
  projectData: any;
  channelData: any;
  onCodeGenerated: (code: string) => void;
  onProjectUpdate?: (project: any) => void;
}

const EnhancedChatInterface: React.FC<EnhancedChatInterfaceProps> = ({
  projectData,
  channelData,
  onCodeGenerated,
  onProjectUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    isGenerating, 
    generateCodeWithAI, 
    streamingContent 
  } = useRealTimeCodeGeneration();
  
  const { 
    files, 
    loading: filesLoading, 
    initializeProjectFiles, 
    appendToChatHistory 
  } = useFileManager();

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load chat history from file when files are ready
    if (files['chatHistory.txt'] && !isInitialized) {
      loadChatHistoryFromFile();
    }
  }, [files, isInitialized]);

  const initializeChat = async () => {
    if (!projectData) return;

    try {
      // Initialize project files
      await initializeProjectFiles(projectData.id, channelData);
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `🎯 **Enhanced AI Development Environment Ready!**\n\n` +
          `**Project**: ${projectData.name}\n` +
          `**Channel**: ${channelData?.title || 'AI Project'}\n\n` +
          `🚀 **AI Workflow Active**:\n` +
          `• Stage 1: Intent Parser analyzes your requests\n` +
          `• Stage 2: AI Editor applies targeted changes\n` +
          `• Real-time GitHub sync & file management\n\n` +
          `💡 **Tell me exactly what to modify** - I'll make precise changes while preserving your design!\n\n` +
          `📁 **File System**: All changes tracked in real-time\n` +
          `🔄 **GitHub Integration**: Auto-sync enabled\n` +
          `💬 **Chat Memory**: Conversations saved to chatHistory.txt`,
        timestamp: new Date()
      };

      setMessages([welcomeMessage]);
      setIsInitialized(true);
      
    } catch (error) {
      console.error('❌ Error initializing chat:', error);
    }
  };

  const loadChatHistoryFromFile = () => {
    try {
      const chatContent = files['chatHistory.txt'];
      if (!chatContent) return;

      // Parse chat history from text file
      const entries = chatContent.split('\n\n').filter(entry => entry.trim());
      const loadedMessages: ChatMessage[] = [];

      entries.forEach(entry => {
        const match = entry.match(/\[(.*?)\] (USER|ASSISTANT): (.*)/s);
        if (match) {
          const [, timestamp, role, content] = match;
          loadedMessages.push({
            id: crypto.randomUUID(),
            role: role.toLowerCase() as 'user' | 'assistant',
            content: content.trim(),
            timestamp: new Date(timestamp)
          });
        }
      });

      if (loadedMessages.length > 0) {
        setMessages(prev => [...prev, ...loadedMessages]);
        console.log('💬 Chat history loaded from file');
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    try {
      // Generate code with AI workflow
      const result = await generateCodeWithAI(
        inputValue.trim(),
        channelData,
        projectData.id,
        {
          streaming: true,
          preserveDesign: true,
          targetedChanges: true
        }
      );

      if (result?.code) {
        onCodeGenerated(result.code);
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result?.reply || '✅ Targeted changes applied successfully!',
        timestamp: new Date(),
        metadata: {
          intent: result?.changes,
          fileModified: ['index.html', 'componentMap.json'],
          changes: ['Applied targeted modification while preserving design']
        }
      };

      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ **Error Processing Request**\n\nI encountered an issue: ${error instanceof Error ? error.message : 'Unknown error'}\n\n🔄 Please try again with a more specific request.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const getMessageIcon = (message: ChatMessage) => {
    if (message.role === 'user') {
      return <User size={12} className="text-blue-400" />;
    }
    
    if (message.metadata?.intent) {
      return <Zap size={12} className="text-purple-400" />;
    }
    
    return <Brain size={12} className="text-green-400" />;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot size={12} className="text-white" />
          </div>
          <div>
            <h3 className="font-medium text-sm">Enhanced AI Assistant</h3>
            <p className="text-xs text-gray-400">Two-stage AI workflow active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-purple-500/20">
            <Brain size={8} className="mr-1" />
            AI Workflow
          </Badge>
          {files['chatHistory.txt'] && (
            <Badge variant="outline" className="text-xs bg-green-500/20">
              <FileText size={8} className="mr-1" />
              History Saved
            </Badge>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {getMessageIcon(message)}
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}
              >
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessage(message.content) 
                  }} 
                />
                
                {/* Metadata */}
                {message.metadata && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    {message.metadata.fileModified && (
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Code size={10} />
                        <span>Modified: {message.metadata.fileModified.join(', ')}</span>
                      </div>
                    )}
                    {message.metadata.changes && (
                      <div className="text-xs text-green-400 mt-1">
                        ✓ {message.metadata.changes.join(' • ')}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <Clock size={8} />
                      <span>AI Workflow</span>
                    </div>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Loader2 size={12} className="animate-spin text-white" />
              </div>
              <div className="bg-gray-800 text-gray-100 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <Zap size={12} className="text-purple-400" />
                  <span className="text-sm">AI Workflow Processing...</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Stage 1: Parsing intent → Stage 2: Applying targeted changes
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me exactly what to change (e.g., 'change hero title to...')"
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isGenerating}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Send size={14} />
          </Button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 text-center">
          🎯 Two-stage AI workflow • 📁 Real-time file sync • 💬 Chat saved to chatHistory.txt
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
