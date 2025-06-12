import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Youtube, Users, Play, Eye, Lightbulb, Code, FileText, Github, Globe, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
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
}

const EnhancedChatbot: React.FC<EnhancedChatbotProps> = ({ youtubeUrl, projectIdea, channelData }) => {
  const [inputValue, setInputValue] = useState('');
  const [showQuickIdeas, setShowQuickIdeas] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [currentFiles, setCurrentFiles] = useState<string[]>([]);
  const { messages, loading, sendMessage, projectId, currentProject } = useEnhancedProjectChat(youtubeUrl, projectIdea, channelData);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;
    
    const messageContent = inputValue;
    setInputValue('');
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickIdeas = [
    { label: 'Create futuristic website', icon: '🚀' },
    { label: 'Build cyberpunk design', icon: '🌆' },
    { label: 'Make modern homepage', icon: '🎨' },
    { label: 'Add YouTube integration', icon: '📺' },
    { label: 'Generate professional site', icon: '💼' },
    { label: 'Create gaming website', icon: '🎮' }
  ];

  // Mock latest videos for Chitti - Tamil channel
  const latestVideos = [
    {
      title: "Message with LASER 🤯 | How it works",
      thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=120&h=90&fit=crop",
      url: "https://youtube.com/watch?v=example1"
    },
    {
      title: "Ask Chitti: Floating Fire?! The Butane Velocity Secret! 🔥💨",
      thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=120&h=90&fit=crop",
      url: "https://youtube.com/watch?v=example2"
    },
    {
      title: "Chitti at School: Blow Out a Candle With Your PHONE?!",
      thumbnail: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=120&h=90&fit=crop",
      url: "https://youtube.com/watch?v=example3"
    },
    {
      title: "Amazing Science Experiment You Won't Believe!",
      thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=90&fit=crop",
      url: "https://youtube.com/watch?v=example4"
    }
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

  // Track file changes from AI responses
  React.useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.type === 'bot' && latestMessage.fileChanges) {
      const newFiles = latestMessage.fileChanges.map(change => change.path);
      setCurrentFiles(prev => [...new Set([...prev, ...newFiles])]);
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Compact Expandable Header */}
      <div className="border-b border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div 
          className="p-3 cursor-pointer hover:bg-black/20 transition-colors"
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
        >
          {channelData ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <img 
                  src={getChannelThumbnail(channelData)} 
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
                    {parseInt(channelData.subscriberCount).toLocaleString()} subscribers
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {parseInt(channelData.videoCount).toLocaleString()} videos
                </span>
                {isHeaderExpanded ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-cyan-400" />}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  <Bot className="text-white" size={16} />
                </div>
                <h3 className="font-semibold text-cyan-400 text-sm">Iris AI Assistant</h3>
              </div>
              {isHeaderExpanded ? <ChevronUp size={16} className="text-cyan-400" /> : <ChevronDown size={16} className="text-cyan-400" />}
            </div>
          )}
        </div>

        {/* Expanded Content - Project Files */}
        {isHeaderExpanded && (
          <div className="px-3 pb-3 border-t border-purple-500/20">
            <div className="mt-3">
              <p className="text-xs font-medium text-cyan-400 mb-2">
                {currentProject ? 'Editing Project:' : 'Project Files:'}
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
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 transition-colors"
                      >
                        <Github size={10} className="inline mr-1" />
                        GitHub
                      </a>
                    )}
                    {currentProject.netlify_url && (
                      <a
                        href={currentProject.netlify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                      >
                        <Globe size={10} className="inline mr-1" />
                        Live Site
                      </a>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto">
                {currentFiles.length > 0 ? (
                  currentFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-lg bg-black/30 hover:bg-black/50 transition-colors text-xs text-white"
                    >
                      <FileText size={12} />
                      <span className="truncate">{file}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No files generated yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages - Show file changes in real-time */}
      <ScrollArea className="flex-1 p-4" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-400/50">
                  {message.feature === 'video' ? (
                    <Youtube size={14} className="text-white" />
                  ) : message.feature === 'futuristic-website' ? (
                    <Sparkles size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-black/80 border border-cyan-500/30 backdrop-blur-sm shadow-lg'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed text-white">{message.content}</p>
                
                {/* Show file changes in real-time */}
                {message.fileChanges && message.fileChanges.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <Code size={12} />
                        <span>Code Changes Applied</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        {message.fileChanges.map((change, index) => (
                          <div key={index} className="text-xs text-blue-300 flex items-center gap-1">
                            {change.action === 'create' && <span className="text-green-400">+</span>}
                            {change.action === 'update' && <span className="text-yellow-400">~</span>}
                            {change.action === 'delete' && <span className="text-red-400">-</span>}
                            <span>{change.path}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Deployment info */}
                {message.generatedCode && (
                  <div className="mt-3 space-y-2">
                    <div className="p-2 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-green-400 text-xs">
                        <FileText size={12} />
                        <span>
                          {currentProject ? 'Project Updated & Redeployed' : 'Website Generated & Auto-Deployed'}
                        </span>
                      </div>
                      {message.codeDescription && (
                        <p className="text-xs text-green-300 mt-1">{message.codeDescription}</p>
                      )}
                    </div>
                    
                    {(message.githubUrl || message.netlifyUrl) && (
                      <div className="flex gap-2">
                        {message.githubUrl && (
                          <a 
                            href={message.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 transition-colors"
                          >
                            <Github size={10} />
                            <span className="text-white">Source Code</span>
                          </a>
                        )}
                        {message.netlifyUrl && (
                          <a 
                            href={message.netlifyUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
                          >
                            <Globe size={10} />
                            <span className="text-white">Live Site</span>
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
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0 animate-pulse shadow-lg shadow-cyan-400/50">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-black/80 border border-cyan-500/30 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-cyan-400 ml-2">
                    {currentProject ? 'Updating your project...' : 'Creating your website...'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Compact Input */}
      <div className="p-3 border-t border-purple-500/30 bg-black/50 backdrop-blur-sm">
        <div className="relative">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Input
                placeholder={`Tell AI what to ${currentProject ? 'change in' : 'create for'} ${channelData?.title || 'you'}...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-black/80 border-cyan-500/50 backdrop-blur-sm pr-10 text-white placeholder-gray-400 focus:border-cyan-400 focus:ring-cyan-400/50"
                disabled={loading}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowQuickIdeas(!showQuickIdeas)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-yellow-500/20"
                disabled={loading}
              >
                <Lightbulb size={14} className="text-yellow-400" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              size="sm" 
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 shadow-lg shadow-cyan-400/50" 
              disabled={loading || !inputValue.trim()}
            >
              <Send size={16} />
            </Button>
          </div>

          {/* Quick Ideas - Updated for editing vs creating */}
          {showQuickIdeas && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/90 border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-400/20 p-3 z-50 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-2">
                {(currentProject ? [
                  { label: 'Add a contact form', icon: '📝' },
                  { label: 'Change color scheme', icon: '🎨' },
                  { label: 'Add image gallery', icon: '🖼️' },
                  { label: 'Update navigation menu', icon: '🧭' },
                  { label: 'Add social media links', icon: '📱' },
                  { label: 'Improve mobile layout', icon: '📱' }
                ] : quickIdeas).map((idea) => (
                  <Button
                    key={idea.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left hover:bg-cyan-500/20 hover:border-cyan-400/50 text-white"
                    onClick={() => {
                      setInputValue(idea.label);
                      setShowQuickIdeas(false);
                    }}
                    disabled={loading}
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
