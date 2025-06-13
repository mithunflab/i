
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export const useGroqAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const checkGroqConnection = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('groq_api_keys')
        .select('api_key')
        .eq('is_active', true)
        .limit(1)
        .single();

      const connected = !error && !!data?.api_key;
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Error checking Groq connection:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  const generateWithGroq = useCallback(async (
    prompt: string,
    systemMessage: string = 'You are a helpful AI assistant.',
    model: string = 'llama3-70b-8192'
  ) => {
    setIsLoading(true);
    
    try {
      console.log('🚀 Using Groq AI for generation...');
      
      // Get Groq API key from database
      const { data: groqKeys, error: groqError } = await supabase
        .from('groq_api_keys')
        .select('*')
        .eq('is_active', true)
        .order('last_used_at', { ascending: true })
        .limit(1);

      if (groqError || !groqKeys || groqKeys.length === 0) {
        throw new Error('No active Groq API keys found');
      }

      const keyData = groqKeys[0];
      const apiKey = keyData.api_key;

      // Make direct API call to Groq
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.7,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data: GroqResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from Groq API');
      }

      const generatedContent = data.choices[0].message.content;
      
      // Update API key usage
      try {
        await supabase
          .from('groq_api_keys')
          .update({
            last_used_at: new Date().toISOString(),
            requests_count: keyData.requests_count + 1
          })
          .eq('id', keyData.id);
      } catch (updateError) {
        console.warn('Failed to update Groq API key usage:', updateError);
      }

      console.log('✅ Groq generation completed successfully');
      setIsConnected(true);
      
      return {
        content: generatedContent,
        usage: data.usage
      };

    } catch (error) {
      console.error('❌ Groq generation error:', error);
      setIsConnected(false);
      
      toast({
        title: "Groq AI Error",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    generateWithGroq,
    isLoading,
    isConnected,
    checkGroqConnection
  };
};
