
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Sparkles, Zap, CheckCircle, Github, Globe, RefreshCw } from 'lucide-react';
import { useEnhancedProjectChat } from '@/hooks/useEnhancedProjectChat';
import { useEnhancedTargetedChanges } from '@/hooks/useEnhancedTargetedChanges';
import { useGitHubReconnection } from '@/hooks/useGitHubReconnection';
import { Badge } from '@/components/ui/badge';

interface SuperEnhancedChatbotProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: any;
  onCodeGenerated?: (code: string) => void;
  projectData?: any;
}

const SuperEnhancedChatbot: React.FC<SuperEnhancedChatbotProps> = ({ 
  youtubeUrl, 
  projectIdea, 
  channelData, 
  onCodeGenerated,
  projectData
}) => {
  const [inputValue, setInputValue] = useState('');
  const [repositoryStatus, setRepositoryStatus] = useState<any>(null);
  
  const { messages, loading, sendMessage, projectId, currentProject, isProcessing } = useEnhancedProjectChat(youtubeUrl, projectIdea, channelData);
  const { generateEnhancedPrompt } = useEnhancedTargetedChanges();
  const { checkRepositoryConnection, reconnectRepository, loading: repoLoading } = useGitHubReconnection();

  // Check repository connection when project loads
  useEffect(() => {
    if (currentProject?.id) {
      checkRepositoryConnection(currentProject.id).then(setRepositoryStatus);
    }
  }, [currentProject?.id, checkRepositoryConnection]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    
    console.log('🎯 Processing enhanced targeted request...');
    
    try {
      // Generate enhanced prompt with full project context
      const enhancedPrompt = await generateEnhancedPrompt({
        userRequest: inputValue,
        projectId: currentProject?.id || projectId,
        channelData
      });

      console.log('✅ Enhanced prompt generated:', enhancedPrompt.targetComponent);
      
      // Send enhanced message with preservation rules
      const messageContent = `${enhancedPrompt.prompt}

CRITICAL INSTRUCTION: ${inputValue}

Target Component: ${enhancedPrompt.targetComponent}
Change Scope: ${enhancedPrompt.changeScope}
Preservation Rules: ${enhancedPrompt.preservationRules.length} rules active`;

      setInputValue('');
      await sendMessage(messageContent);
      
    } catch (error) {
      console.error('❌ Error generating enhanced prompt:', error);
      // Fallback to regular message
      const messageContent = inputValue;
      setInputValue('');
      await sendMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReconnectRepository = async () => {
    if (currentProject?.id) {
      const success = await reconnectRepository(currentProject.id);
      if (success) {
        const newStatus = await checkRepositoryConnection(currentProject.id);
        setRepositoryStatus(newStatus);
      }
    }
  };

  // Track code generation and notify parent
  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.type === 'bot' && latestMessage.generatedCode) {
      console.log('🔄 Enhanced code generated, updating preview...');
      onCodeGenerated?.(latestMessage.generatedCode);
    }
  }, [messages, onCodeGenerated]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Header */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {channelData?.thumbnail && (
              <img 
                src={channelData.thumbnail} 
                alt={channelData.title}
                className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-lg flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-cyan-400 text-sm truncate">
                {channelData?.title || 'Enhanced AI Builder'}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-purple-300">
                  {channelData ? `${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers` : 'Advanced targeting active'}
                </span>
                {currentProject?.verified && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-1 py-0">
                    <CheckCircle size={10} className="mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Repository Status */}
          {repositoryStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                repositoryStatus.isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className={`text-xs ${
                repositoryStatus.isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {repositoryStatus.isConnected ? 'GitHub Connected' : 'GitHub Disconnected'}
              </span>
              {!repositoryStatus.isConnected && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleReconnectRepository}
                  disabled={repoLoading}
                  className="text-xs px-2 py-1 h-6"
                >
                  {repoLoading ? <RefreshCw size={10} className="animate-spin" /> : 'Reconnect'}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Project Status Indicators */}
        <div className="mt-2 flex gap-2 text-xs">
          <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            🎯 Targeted Changes
          </Badge>
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            🧠 Project Memory
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
            📊 Real Data
          </Badge>
          {repositoryStatus?.isConnected && (
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30">
              🚀 Auto Deploy
            </Badge>
          )}
        </div>
      </div>

      {/* Enhanced Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {message.feature === 'processing' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : message.feature === 'targeted-modification' ? (
                    <Zap size={14} className="text-white" />
                  ) : (
                    <Sparkles size={14} className="text-white" />
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : message.feature === 'processing'
                    ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 backdrop-blur-sm shadow-lg'
                    : 'bg-black/80 border border-cyan-500/30 backdrop-blur-sm shadow-lg'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed text-white">{message.content}</p>
                
                {/* Enhanced code generation status */}
                {message.generatedCode && (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                        <Zap size={14} />
                        <span>🎯 Targeted Changes Applied Successfully!</span>
                      </div>
                      {message.codeDescription && (
                        <p className="text-xs text-green-300 mt-1">{message.codeDescription}</p>
                      )}
                      <div className="text-xs text-gray-300 mt-2 flex flex-wrap gap-1">
                        <span className="bg-blue-500/20 px-2 py-1 rounded">✨ Design preserved</span>
                        <span className="bg-green-500/20 px-2 py-1 rounded">📱 Responsive</span>
                        <span className="bg-purple-500/20 px-2 py-1 rounded">🎨 Real data</span>
                        <span className="bg-orange-500/20 px-2 py-1 rounded">⚡ Live deployment</span>
                      </div>
                    </div>
                    
                    {(message.githubUrl || message.netlifyUrl) && (
                      <div className="flex gap-2">
                        {message.githubUrl && (
                          <a 
                            href={message.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg border border-gray-600 transition-colors"
                          >
                            <Github size={12} />
                            <span className="text-white">Updated Code</span>
                          </a>
                        )}
                        {message.netlifyUrl && (
                          <a 
                            href={message.netlifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-2 rounded-lg transition-colors"
                          >
                            <Globe size={12} />
                            <span className="text-white">Live Changes</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <span className="text-xs opacity-70 mt-2 block text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {(loading || isProcessing) && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="bg-black/80 border border-cyan-500/30 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-cyan-400 font-medium">
                    🎯 Reading project files & making targeted changes...
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Analyzing current structure • Preserving design • Using real channel data
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Input */}
      <div className="p-3 border-t border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Input
            placeholder={`Make targeted changes to ${channelData?.title || 'your project'}... (e.g., "change hero title" or "update navigation menu")`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-black/80 border-cyan-500/50 backdrop-blur-sm text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50"
            disabled={loading || isProcessing}
          />
          <Button 
            onClick={handleSendMessage} 
            size="sm" 
            className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg" 
            disabled={loading || isProcessing || !inputValue.trim()}
          >
            <Send size={16} />
          </Button>
        </div>
        
        <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
          <span>💡 Tip:</span>
          <span>Be specific about what element you want to change (e.g., "update hero title", "change button color")</span>
        </div>
      </div>
    </div>
  );
};

export default SuperEnhancedChatbot;
