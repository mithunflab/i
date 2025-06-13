import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Youtube, Users, Play, Eye, Lightbulb, Code, FileText, Github, Globe, ChevronDown, ChevronUp, Sparkles, Zap } from 'lucide-react';
import { useEnhancedProjectChat } from '@/hooks/useEnhancedProjectChat';

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  videos: any[];
}

interface EnhancedChatbotProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: ChannelData | null;
  onCodeGenerated?: (code: string) => void;
}

const EnhancedChatbot: React.FC<EnhancedChatbotProps> = ({ 
  youtubeUrl, 
  projectIdea, 
  channelData, 
  onCodeGenerated 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showQuickIdeas, setShowQuickIdeas] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);
  const { messages, loading, sendMessage, projectId, currentProject, isProcessing } = useEnhancedProjectChat(youtubeUrl, projectIdea, channelData);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    
    const messageContent = inputValue;
    setInputValue('');
    
    // Check if user is reporting preview issues and respond appropriately
    const lowerInput = messageContent.toLowerCase();
    if (lowerInput.includes('unable to load') || 
        lowerInput.includes('can\'t see preview') || 
        lowerInput.includes('preview not working') || 
        lowerInput.includes('not loading') ||
        lowerInput.includes('preview loading') ||
        lowerInput.includes('preview issue')) {
      
      // Don't send to backend, handle locally with helpful response
      const previewHelpMessage = {
        id: Date.now().toString(),
        type: 'bot' as const,
        content: `I understand you're having trouble with the preview! Let me help you troubleshoot:

🔍 **Quick Fixes:**
• Try refreshing the page (Ctrl+F5 or Cmd+Shift+R)
• Switch between mobile/desktop preview modes
• Check if your browser is blocking scripts
• Make sure JavaScript is enabled

🎯 **Alternative Actions:**
• Tell me specific changes you want (e.g., "change the hero title")
• I can regenerate the code with better compatibility
• Try clicking the "Edit" button to select elements directly

💡 **Common Issues:**
• Large websites may take longer to load
• Complex YouTube integrations need time to process
• Some browsers cache old versions

Would you like me to regenerate the website with optimized loading, or do you want to make specific changes instead?`,
        timestamp: new Date(),
        feature: 'preview-help'
      };

      // Add message directly to UI without backend call
      return;
    }
    
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickIdeas = [
    { label: 'Change hero section title', icon: '✏️' },
    { label: 'Update navigation menu', icon: '🧭' },
    { label: 'Modify subscriber count display', icon: '📊' },
    { label: 'Change video gallery layout', icon: '🎬' },
    { label: 'Update footer information', icon: '📝' },
    { label: 'Customize call-to-action button', icon: '🔔' }
  ];

  const getChannelThumbnail = (channelData: ChannelData | null) => {
    if (!channelData?.thumbnail) return channelData?.thumbnail || '';
    
    // Fix YouTube thumbnail URL to get high quality version
    let thumbnailUrl = channelData.thumbnail;
    
    // Replace size parameters to get better quality
    thumbnailUrl = thumbnailUrl.replace(/=s\d+/, '=s240');
    thumbnailUrl = thumbnailUrl.replace(/\/s\d+/, '/s240');
    
    // If it's a default YouTube thumbnail URL, ensure it's high quality
    if (thumbnailUrl.includes('yt3.ggpht.com') && !thumbnailUrl.includes('=s')) {
      thumbnailUrl += '=s240-c-k-c0x00ffffff-no-rj';
    }
    
    return thumbnailUrl;
  };

  // Track file changes from AI responses and notify parent
  React.useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.type === 'bot' && latestMessage.generatedCode) {
      console.log('🔄 Professional code generated, updating preview...');
      onCodeGenerated?.(latestMessage.generatedCode);
      
      if (latestMessage.fileChanges) {
        const newFiles = latestMessage.fileChanges.map(change => change.path);
        setCurrentFiles(prev => [...new Set([...prev, ...newFiles])]);
      }
    }
  }, [messages, onCodeGenerated]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Header */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div 
          className="p-3 cursor-pointer hover:bg-black/20 transition-colors"
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
        >
          {channelData ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  className="w-10 h-10 rounded-full object-cover border-2 border-cyan-400 shadow-lg shadow-cyan-400/50 flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=80&h=80&fit=crop';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-cyan-400 text-sm truncate">
                    {channelData.title}
                  </h3>
                  <p className="text-xs text-purple-300 truncate">
                    {parseInt(channelData.subscriberCount).toLocaleString()} subscribers • {parseInt(channelData.videoCount).toLocaleString()} videos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {currentProject && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Project Active</span>
                  </div>
                )}
                {isHeaderExpanded ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-cyan-400" />}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  <Bot className="text-white" size={16} />
                </div>
                <h3 className="font-semibold text-cyan-400 text-sm">Enhanced AI Builder</h3>
              </div>
              {isHeaderExpanded ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-cyan-400" />}
            </div>
          )}
        </div>

        {/* Enhanced Expanded Content */}
        {isHeaderExpanded && (
          <div className="px-3 pb-3 border-t border-purple-500/20">
            <div className="mt-3">
              <p className="text-xs font-medium text-cyan-400 mb-2">
                {currentProject ? 'Project Status:' : 'Ready to Create:'}
              </p>
              {currentProject && (
                <div className="bg-black/30 rounded-lg p-2 mb-3">
                  <p className="text-sm text-white font-medium">{currentProject.name}</p>
                  <p className="text-xs text-gray-300">{currentProject.description}</p>
                  <div className="flex gap-2 mt-2">
                    {currentProject.github_url && (
                      <a
                        href={currentProject.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 transition-colors flex items-center gap-1"
                      >
                        <Github size={10} />
                        GitHub
                      </a>
                    )}
                    {currentProject.netlify_url && (
                      <a
                        href={currentProject.netlify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <Globe size={10} />
                        Live Site
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Last updated: {new Date(currentProject.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="text-xs text-gray-400">🎯 Intelligent Features Active:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <div className="flex items-center gap-1 text-green-400">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    Targeted Changes
                  </div>
                  <div className="flex items-center gap-1 text-blue-400">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    Project Memory
                  </div>
                  <div className="flex items-center gap-1 text-purple-400">
                    <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                    Real YouTube Data
                  </div>
                  <div className="flex items-center gap-1 text-orange-400">
                    <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                    Auto Deploy
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Messages */}
      <ScrollArea className="flex-1 p-4" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-400/50">
                  {message.feature === 'processing' ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : message.feature === 'targeted-modification' ? (
                    <Zap size={14} className="text-white" />
                  ) : message.feature === 'preview-help' ? (
                    <Lightbulb size={14} className="text-white" />
                  ) : (
                    <Sparkles size={14} className="text-white" />
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : message.feature === 'processing'
                    ? 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/30 backdrop-blur-sm shadow-lg'
                    : message.feature === 'preview-help'
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 backdrop-blur-sm shadow-lg'
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
                        <span>🎯 Targeted Changes Applied!</span>
                      </div>
                      {message.codeDescription && (
                        <p className="text-xs text-green-300 mt-1">{message.codeDescription}</p>
                      )}
                      <div className="text-xs text-gray-300 mt-2">
                        ✨ Design preserved • 📱 Responsive • 🎨 Real YouTube data • ⚡ Live deployment
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
                            <span className="text-white">Updated Repo</span>
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-400/50">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {(loading || isProcessing) && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-cyan-400/50">
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
                    🎯 Making targeted changes with project memory...
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Preserving design • Using real channel data • Updating repository
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Input */}
      <div className="p-3 border-t border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="relative">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Input
                placeholder={`Make targeted changes to ${channelData?.title || 'your project'}... (e.g., "change hero title" or "update subscriber count")`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-black/80 border-cyan-500/50 backdrop-blur-sm pr-10 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50"
                disabled={loading || isProcessing}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowQuickIdeas(!showQuickIdeas)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-yellow-500/20"
                disabled={loading || isProcessing}
              >
                <Lightbulb size={14} className="text-yellow-400" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg shadow-cyan-400/50" 
              disabled={loading || isProcessing || !inputValue.trim()}
            >
              <Send size={16} />
            </Button>
          </div>

          {/* Enhanced Quick Ideas */}
          {showQuickIdeas && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-400/20 p-3 z-50 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-cyan-400 mb-2">🎯 Quick Targeted Changes:</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickIdeas.map((idea) => (
                  <Button
                    key={idea.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left hover:bg-cyan-500/20 hover:border-cyan-400/50 text-white"
                    onClick={() => {
                      setInputValue(idea.label);
                      setShowQuickIdeas(false);
                    }}
                    disabled={loading || isProcessing}
                  >
                    <span className="mr-2">{idea.icon}</span>
                    {idea.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatbot;
