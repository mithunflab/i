
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AIGenerationResponse {
  reply: string;
  feature: string;
  generatedCode?: string;
  codeDescription?: string;
}

export const useRealTimeAIGeneration = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateWithAI = useCallback(async (
    message: string,
    projectId: string,
    channelData?: any,
    projectContext?: any
  ): Promise<AIGenerationResponse | null> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI generation",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    
    try {
      console.log('🤖 Starting real-time AI generation...');
      
      // Call the chat edge function with proper error handling
      const { data: aiResponse, error } = await supabase.functions.invoke('chat', {
        body: {
          message,
          projectId,
          channelData,
          generateCode: true
        }
      });

      if (error) {
        console.error('❌ Edge Function Error:', error);
        throw new Error(`Edge Function Error: ${error.message}`);
      }

      if (!aiResponse) {
        throw new Error('No response received from AI service');
      }

      // Check if the response contains an error
      if (aiResponse.error) {
        console.error('❌ AI API Error:', aiResponse.error);
        throw new Error(aiResponse.error);
      }

      console.log('✅ Real-time AI generation completed');

      // Log successful API usage
      try {
        await supabase.from('api_usage_logs').insert({
          user_id: user.id,
          provider: 'openrouter',
          model: aiResponse.model || 'unknown',
          tokens_used: 0, // Will be updated by edge function if available
          status: 'success',
          request_data: { message, projectId }
        });
      } catch (logError) {
        console.warn('Failed to log API usage:', logError);
      }

      return {
        reply: aiResponse.reply || 'Website generated successfully!',
        feature: aiResponse.feature || 'website-generation',
        generatedCode: aiResponse.generatedCode,
        codeDescription: aiResponse.codeDescription || 'Professional website generated with AI'
      };

    } catch (error) {
      console.error('❌ Real-time AI generation error:', error);
      
      // Log error for debugging
      try {
        await supabase.from('api_usage_logs').insert({
          user_id: user.id,
          provider: 'openrouter',
          model: 'unknown',
          status: 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.warn('Failed to log error:', logError);
      }

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "AI Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Return a fallback response instead of null
      return {
        reply: `❌ **AI Generation Failed**\n\n${errorMessage}\n\n🔄 **Please try again with:**\n• A more specific request\n• Simpler language\n• Clear website goals\n\n💡 **Example**: "Create a modern portfolio website"`,
        feature: 'error-handling'
      };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    generateWithAI,
    loading
  };
};
