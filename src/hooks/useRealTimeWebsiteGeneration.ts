
import { useState, useCallback } from 'react';
import { useGroqAI } from './useGroqAI';
import { useFileManager } from './useFileManager';
import { useToast } from '@/hooks/use-toast';

export const useRealTimeWebsiteGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const { generateWithGroq, isConnected } = useGroqAI();
  const { updateFile, appendToChatHistory } = useFileManager();
  const { toast } = useToast();

  const generateWebsite = useCallback(async (
    userRequest: string,
    channelData: any,
    currentCode?: string
  ) => {
    if (!isConnected) {
      toast({
        title: "Groq AI Not Connected",
        description: "Please configure Groq API keys in the database.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('🎯 Starting real-time website generation with Groq...');
      
      // Log user request
      appendToChatHistory(userRequest, 'user');

      // Create comprehensive prompt for website generation
      const systemPrompt = `You are an expert web developer. Generate a complete, professional HTML website with embedded CSS and JavaScript. 

Key Requirements:
- Generate ONLY the complete HTML code with embedded CSS and JavaScript
- Make it responsive and modern
- Include professional styling
- Make targeted changes based on user requests while preserving existing design
- Use real data from the channel information provided
- Include working YouTube embeds and subscribe buttons
- Make it visually appealing with animations and transitions

Return ONLY the HTML code, no explanations or markdown.`;

      const userPrompt = `
User Request: ${userRequest}

Channel Data: ${JSON.stringify(channelData, null, 2)}

Current Code: ${currentCode || 'Create a new website'}

Generate a complete, professional website that incorporates the user's request while using the provided channel data.
`;

      const result = await generateWithGroq(userPrompt, systemPrompt);
      
      if (!result?.content) {
        throw new Error('No content generated from Groq');
      }

      const finalCode = result.content;
      
      // Update the main HTML file
      await updateFile('index.html', finalCode);
      
      // Log success
      appendToChatHistory('✅ Website generated successfully with Groq AI!', 'assistant');
      
      setGeneratedCode(finalCode);
      
      toast({
        title: "🚀 Real-Time Website Generated",
        description: "Your website has been created using Groq AI in real-time!",
      });

      return {
        code: finalCode,
        reply: '✅ Your website has been generated and updated in real-time using Groq AI!'
      };

    } catch (error) {
      console.error('❌ Real-time generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      appendToChatHistory(`Error: ${errorMessage}`, 'assistant');
      
      toast({
        title: "Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [generateWithGroq, isConnected, updateFile, appendToChatHistory, toast]);

  return {
    generateWebsite,
    isGenerating,
    generatedCode,
    isGroqConnected: isConnected
  };
};
