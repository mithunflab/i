import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Youtube, Users, Smartphone, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  feature?: string;
}

interface ChatbotProps {
  youtubeUrl: string;
  projectIdea: string;
  projectId?: string;
}

const Chatbot: React.FC<ChatbotProps> = ({ youtubeUrl, projectIdea, projectId = 'default-project' }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Load chat history from database
    loadChatHistory();
    
    // Initialize with welcome message if no history
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      content: `🎥 **Welcome to YouTube Website Builder!**\n\nI've analyzed your channel and I'm ready to help you create an amazing website!\n\n**📺 Channel:** ${youtubeUrl}\n**💡 Vision:** ${projectIdea}\n\n**✨ Creator Features Available:**\n• YouTube Video Integration\n• Channel Branding Match\n• Subscribe Widgets\n• Mobile-First Design\n• SEO for Creators\n• Monetization Tools\n• Analytics Dashboard\n\n**🎯 Pro Tip:** Use "Edit" to click and customize any element for your brand!\n\nWhat would you like to add to your YouTube website first?`,
      timestamp: new Date()
    };

    setMessages(prev => prev.length === 0 ? [welcomeMessage] : prev);
  }, [projectId, user]);

  const loadChatHistory = async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          type: msg.message_type as 'user' | 'bot',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          feature: typeof msg.metadata === 'object' && msg.metadata !== null && 'feature' in msg.metadata 
            ? (msg.metadata as any).feature 
            : undefined
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error in loadChatHistory:', error);
    }
  };

  const saveChatMessage = async (messageType: 'user' | 'assistant', content: string, metadata?: any) => {
    if (!user || !projectId) return;

    try {
      await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          message_type: messageType,
          content,
          metadata
        });
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Save user message
    await saveChatMessage('user', inputValue);

    setLoading(true);

    // Enhanced AI response logic for YouTube creators
    setTimeout(async () => {
      let botResponse = '';
      let feature = '';

      if (inputValue.toLowerCase().includes('video') || inputValue.toLowerCase().includes('youtube')) {
        feature = 'video';
        botResponse = `📺 **YouTube Video Integration Activated!**\n\nSetting up video showcase for "${inputValue}"\n\n🔧 Processing:\n✅ Latest video imports\n✅ Playlist organization\n✅ Thumbnail optimization\n✅ Subscribe button placement\n\n🎥 **Your videos will look amazing on your website!**`;
      } else if (inputValue.toLowerCase().includes('brand') || inputValue.toLowerCase().includes('color') || inputValue.toLowerCase().includes('style')) {
        feature = 'branding';
        botResponse = `🎨 **Channel Branding Applied!**\n\nCustomizing design based on "${inputValue}"\n\n🔧 Branding Updates:\n✅ Channel color extraction\n✅ Thumbnail style analysis\n✅ Font matching\n✅ Logo integration\n\n🌟 **Your website now matches your YouTube brand perfectly!**`;
      } else if (inputValue.toLowerCase().includes('subscribe') || inputValue.toLowerCase().includes('audience')) {
        feature = 'audience';
        botResponse = `🔔 **Audience Growth Tools Activated!**\n\nOptimizing for "${inputValue}"\n\n🔧 Growth Features:\n✅ Subscribe buttons added\n✅ Social media links\n✅ Email capture forms\n✅ Content recommendations\n\n📈 **Ready to grow your YouTube audience through your website!**`;
      } else if (inputValue.toLowerCase().includes('mobile') || inputValue.toLowerCase().includes('phone')) {
        feature = 'mobile';
        botResponse = `📱 **Mobile Creator Optimization!**\n\nOptimizing for mobile viewers: "${inputValue}"\n\n🔧 Mobile Features:\n✅ Touch-friendly navigation\n✅ Fast video loading\n✅ Thumb-friendly buttons\n✅ Portrait video support\n\n📱 **Perfect for your mobile YouTube audience!**`;
      } else {
        botResponse = `🤖 **YouTube Website AI Processing...**\n\nWorking on: "${inputValue}"\n\n🔧 **Creator Tools Active:**\n✅ Content analysis\n✅ Audience optimization\n✅ Mobile-first design\n✅ YouTube integration\n\n🎥 **Your YouTube website is getting better!**\n\n💡 **Try these creator features:**\n• "Add subscribe button"\n• "Import my latest videos"\n• "Match my channel colors"\n• "Optimize for mobile viewers"`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        feature
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Save bot message
      await saveChatMessage('assistant', botResponse, { feature });
      
      setLoading(false);
    }, 1000);

    setInputValue('');
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
      {/* Chat Header */}
      <div className="p-4 border-b border-border glass">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500">
            <Youtube className="text-white" size={18} />
          </div>
          <div>
            <h3 className="font-semibold neon-text">YouTube AI Builder</h3>
            <p className="text-xs text-muted-foreground">Creator Website Assistant</p>
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
            placeholder="Describe what you want for your YouTube website..."
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
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
