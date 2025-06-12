
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Youtube, Users, Smartphone, Palette, Play, Eye } from 'lucide-react';
import { useProjectChat } from '@/hooks/useProjectChat';

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
  const { messages, loading, sendMessage, projectId } = useProjectChat(youtubeUrl, projectIdea, channelData);

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

  const quickActions = [
    { label: 'Add subscribe button', icon: '🔔' },
    { label: 'Import latest videos', icon: '📺' },
    { label: 'Match channel colors', icon: '🎨' },
    { label: 'Mobile optimize', icon: '📱' },
    { label: 'Add video gallery', icon: '🎬' },
    { label: 'Setup analytics', icon: '📊' }
  ];

  return (
    <div className="h-full flex flex-col bg-rough">
      {/* Chat Header with Channel Info */}
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
            
            {channelData.videos && channelData.videos.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-300">Latest Videos:</p>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {channelData.videos.slice(0, 3).map((video, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Play size={10} className="text-red-400 flex-shrink-0" />
                      <span className="truncate text-gray-400">{video.snippet.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
              <Youtube className="text-white" size={18} />
            </div>
            <div>
              <h3 className="font-semibold neon-text">YouTube AI Builder</h3>
              <p className="text-xs text-muted-foreground">Creator Website Assistant</p>
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
                  {message.feature === 'video' ? (
                    <Youtube size={14} className="text-white" />
                  ) : message.feature === 'branding' ? (
                    <Palette size={14} className="text-white" />
                  ) : message.feature === 'audience' ? (
                    <Users size={14} className="text-white" />
                  ) : message.feature === 'mobile' ? (
                    <Smartphone size={14} className="text-white" />
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
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-card/80 border border-border/50 glass p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <span className="text-sm text-muted-foreground ml-2">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border glass">
        <div className="flex gap-2 mb-3">
          <Input
            placeholder={`Describe what you want for ${channelData?.title || 'your YouTube'} website...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bg-input/80 border-border backdrop-blur-sm"
            disabled={loading}
          />
          <Button onClick={handleSendMessage} size="sm" className="cyber-button" disabled={loading || !inputValue.trim()}>
            <Send size={16} />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-1">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="text-xs h-7 glass border-border/30"
              onClick={() => setInputValue(action.label)}
              disabled={loading}
            >
              {action.icon} {action.label}
            </Button>
          ))}
        </div>
        
        {/* Feature Status */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          🎥 YouTube tools active • Creator-focused features ready • Chat history saved
          {channelData && ` • ${channelData.title} data loaded`}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
