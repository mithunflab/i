
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Youtube, Users, Smartphone, Palette, Play, Eye, Lightbulb, Code, FileText, Github, Globe, Zap } from 'lucide-react';
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

interface ChatbotProps {
  youtubeUrl: string;
  projectIdea: string;
  channelData?: ChannelData | null;
}

const Chatbot: React.FC<ChatbotProps> = ({ youtubeUrl, projectIdea, channelData }) => {
  const [inputValue, setInputValue] = useState('');
  const [showQuickIdeas, setShowQuickIdeas] = useState(false);
  const { messages, loading, sendMessage, projectId, currentProject, deploymentStatus } = useEnhancedProjectChat(youtubeUrl, projectIdea, channelData);

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
    { label: 'Change hero section colors', icon: '🎨' },
    { label: 'Update navigation menu', icon: '🧭' },
    { label: 'Modify video gallery layout', icon: '📺' },
    { label: 'Edit call-to-action buttons', icon: '🔔' },
    { label: 'Change footer content', icon: '📄' },
    { label: 'Update statistics display', icon: '📊' }
  ];

  return (
    <div className="h-full flex flex-col bg-rough">
      {/* Enhanced Chat Header with Project Info */}
      <div className="p-4 border-b border-border glass">
        {channelData ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src={channelData.thumbnail} 
                alt={channelData.title}
                className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold neon-text text-sm truncate">{channelData.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Users size={12} />
                  {parseInt(channelData.subscriberCount).toLocaleString()} subscribers
                  <Play size={12} />
                  {parseInt(channelData.videoCount).toLocaleString()} videos
                </p>
              </div>
            </div>
            
            {/* Project Status */}
            {currentProject && (
              <div className="bg-black/30 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-cyan-400">Active Project</p>
                    <p className="text-xs text-gray-300">{currentProject.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {currentProject.github_url && (
                      <a
                        href={currentProject.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                      >
                        <Github size={10} className="inline" />
                      </a>
                    )}
                    {currentProject.netlify_url && (
                      <a
                        href={currentProject.netlify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
                      >
                        <Globe size={10} className="inline" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Deployment Status */}
            {deploymentStatus.status !== 'idle' && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  {deploymentStatus.status === 'deploying' && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  )}
                  {deploymentStatus.status === 'success' && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                  {deploymentStatus.status === 'failed' && (
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  )}
                  <span className="text-xs text-blue-300">{deploymentStatus.message}</span>
                </div>
                {deploymentStatus.status === 'deploying' && (
                  <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                    <div 
                      className="bg-blue-400 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${deploymentStatus.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
              <Youtube className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-semibold neon-text">Enhanced AI Builder</h3>
              <p className="text-xs text-muted-foreground">Targeted Modifications</p>
            </div>
          </div>
        )}
        <div className="mt-2 text-xs text-gray-500">
          Project ID: {projectId}
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
                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  {message.feature === 'targeted-modification' ? (
                    <Zap size={14} className="text-white" />
                  ) : message.feature === 'video' ? (
                    <Youtube size={14} className="text-white" />
                  ) : message.feature === 'branding' ? (
                    <Palette size={14} className="text-white" />
                  ) : message.feature === 'audience' ? (
                    <Users size={14} className="text-white" />
                  ) : message.feature === 'mobile' ? (
                    <Smartphone size={14} className="text-white" />
                  ) : message.feature === 'website' ? (
                    <Code size={14} className="text-white" />
                  ) : (
                    <Bot size={14} className="text-white" />
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground cyber-button'
                    : 'bg-card/80 border border-border/50 glass'
                }`}
              >
                <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
                
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
                        ✨ Preserved existing design • 🎯 Modified specific element • 📱 Maintained responsiveness
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
                
                <span className="text-xs opacity-70 mt-2 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              {message.type === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-primary" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <Zap size={14} className="text-white animate-pulse" />
              </div>
              <div className="bg-card/80 border border-border/50 glass p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm text-muted-foreground ml-2">Making targeted changes...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Enhanced Input with Targeted Suggestions */}
      <div className="p-4 border-t border-border glass">
        <div className="relative">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Input
                placeholder={`Tell me specifically what to change in ${channelData?.title || 'your'} website...`}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-input/80 border-border backdrop-blur-sm pr-10"
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
                <Lightbulb size={14} className="text-yellow-500" />
              </Button>
            </div>
            <Button onClick={handleSendMessage} size="sm" className="cyber-button" disabled={loading || !inputValue.trim()}>
              <Send size={16} />
            </Button>
          </div>

          {/* Targeted Quick Ideas */}
          {showQuickIdeas && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg p-3 z-50">
              <h4 className="text-sm font-medium text-primary mb-2">🎯 Targeted Changes:</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickIdeas.map((idea) => (
                  <Button
                    key={idea.label}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-left"
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
        
        {/* Enhanced Feature Status */}
        <div className="text-xs text-muted-foreground text-center">
          🎯 Targeted AI Changes • 📁 Single Repository • 🚀 Real-time Deployment • 🧠 Project Memory
          {channelData && ` • ${channelData.title} Context Loaded`}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
