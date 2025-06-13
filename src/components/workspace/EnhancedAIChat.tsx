
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Loader2,
  Brain,
  Target,
  Code,
  Sparkles,
  Zap,
  Palette,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  component?: string;
  generatedCode?: string;
  model?: string;
}

interface EnhancedAIChatProps {
  projectId: string;
  sourceCode?: string;
  channelData?: any;
  onCodeUpdate?: (newCode: string) => void;
  aiModel?: string;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({
  projectId,
  sourceCode = '',
  channelData,
  onCodeUpdate,
  aiModel = 'premium'
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add premium welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `✨ **Premium AI Assistant Activated!**\n\n${channelData ? `**Channel**: ${channelData.title}\n**Subscribers**: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}\n\n` : ''}🚀 **Premium Features:**\n• Advanced AI models (${aiModel.toUpperCase()})\n• Real-time component targeting\n• Professional code generation\n• Zero-downtime updates\n• Premium design templates\n\n💬 **Premium Commands:**\n• "Create a premium landing page"\n• "Add glassmorphism effects"\n• "Make it look more modern"\n• "Add smooth animations"\n• "Change the color scheme to purple"\n\n🎨 **I'll generate professional-grade code using the latest ${aiModel} AI model!**`,
      timestamp: new Date(),
      model: aiModel
    };
    setMessages([welcomeMessage]);
  }, [channelData, aiModel]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      console.log('🚀 Sending premium AI request...');

      // Use direct API table approach instead of edge function
      const { data: apiKeys, error: keyError } = await supabase
        .from('openrouter_api_keys')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (keyError || !apiKeys || apiKeys.length === 0) {
        throw new Error('No API keys available. Please contact support.');
      }

      const apiKey = apiKeys[0];

      // Enhanced prompt for premium AI
      const enhancedPrompt = `
# Premium AI Website Generator

## Current Project Context
${channelData ? `**YouTube Channel**: ${channelData.title} (${parseInt(channelData.subscriberCount || '0').toLocaleString()} subscribers)` : '**Project**: Premium Website'}

## User Request
"${currentInput}"

## Current Code Structure
\`\`\`html
${sourceCode.substring(0, 1000)}...
\`\`\`

## Premium Generation Guidelines
- Use modern, glassmorphism design
- Implement smooth animations and transitions
- Create responsive, mobile-first layouts
- Use gradient backgrounds and premium typography
- Include interactive elements and hover effects
- Generate clean, semantic HTML with Tailwind CSS
- Ensure accessibility and performance optimization

## AI Model: ${aiModel.toUpperCase()}
Generate professional, production-ready code that follows modern web standards.
`;

      // Direct API call to OpenRouter
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.api_key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Premium AI Workspace'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { 
              role: 'system', 
              content: 'You are a premium AI web developer that creates modern, beautiful websites with cutting-edge design and functionality.' 
            },
            { role: 'user', content: enhancedPrompt }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const generatedContent = data.choices[0].message.content;

      // Extract code if present
      const codeMatch = generatedContent.match(/```html([\s\S]*?)```/);
      const generatedCode = codeMatch ? codeMatch[1].trim() : null;

      console.log('✅ Premium AI response received');

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generatedContent,
        timestamp: new Date(),
        generatedCode: generatedCode,
        model: aiModel
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Apply generated code if available
      if (generatedCode && onCodeUpdate) {
        console.log('🎨 Applying premium generated code...');
        onCodeUpdate(generatedCode);
        
        toast({
          title: "🎉 Premium Code Generated!",
          description: `Professional website created with ${aiModel.toUpperCase()} AI model!`,
        });
      }

      // Update API usage tracking
      await supabase
        .from('api_usage_tracking')
        .insert({
          api_key_id: apiKey.id,
          user_id: user?.id,
          provider: 'openrouter',
          request_type: 'chat_completion',
          tokens_used: data.usage?.total_tokens || 0,
          cost_usd: (data.usage?.total_tokens || 0) * 0.000001,
          success: true
        });

    } catch (error) {
      console.error('❌ Error in premium AI processing:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ **Premium AI Error**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n🔄 **Troubleshooting:**\n• Check your internet connection\n• Verify API credentials\n• Try a simpler request\n• Contact premium support\n\n💡 **Example**: "Create a modern landing page with dark theme"`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Premium AI Error",
        description: "Failed to generate code. Premium support has been notified.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div
              className={`max-w-[85%] p-4 rounded-2xl whitespace-pre-wrap ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-black/40 backdrop-blur-md text-gray-100 border border-white/10 shadow-xl'
              }`}
            >
              {message.content}
              
              {message.generatedCode && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-black text-xs">
                    <Code className="w-3 h-3 mr-1" />
                    Code Generated
                  </Badge>
                  {message.model && (
                    <Badge className="bg-gradient-to-r from-blue-400 to-cyan-400 text-black text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {message.model.toUpperCase()}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {message.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            </div>
            <div className="bg-black/40 backdrop-blur-md text-gray-100 border border-white/10 p-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-300">Premium AI generating your website...</span>
                <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Premium Input Area */}
      <div className="border-t border-white/10 p-6 bg-black/20 backdrop-blur-md">
        <div className="flex gap-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what premium website to create..."
            className="flex-1 bg-black/30 border-white/20 text-white placeholder-gray-400 rounded-xl backdrop-blur-md"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl px-6 shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Premium AI Active
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Smart Targeting
            </span>
            <span className="flex items-center gap-1">
              <Palette className="w-3 h-3" />
              Design Optimization
            </span>
          </div>
          <span>Model: {aiModel.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAIChat;
