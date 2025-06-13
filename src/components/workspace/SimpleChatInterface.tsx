
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SimpleChatInterfaceProps {
  onCodeGenerated: (code: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SimpleChatInterface: React.FC<SimpleChatInterfaceProps> = ({
  onCodeGenerated
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I can help you create websites with AI. What would you like to build?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    try {
      console.log('Calling unified-ai-generation function...');
      
      const { data, error } = await supabase.functions.invoke('unified-ai-generation', {
        body: {
          userRequest: inputValue.trim(),
          projectId: crypto.randomUUID(),
          channelData: {
            title: 'AI Generated Website',
            description: 'Created with AI'
          }
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message);
      }

      console.log('Function response:', data);

      if (data?.success && data?.generatedCode) {
        onCodeGenerated(data.generatedCode);
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply || 'Website generated successfully!',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        
        toast({
          title: "Success!",
          description: "Website generated successfully",
        });
      } else {
        throw new Error('No code generated');
      }

    } catch (error) {
      console.error('Generation error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to generate website",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h2 className="font-semibold">AI Website Builder</h2>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-sm">Generating your website...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the website you want to create..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isGenerating}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isGenerating}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatInterface;
