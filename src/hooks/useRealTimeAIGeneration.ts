
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
      console.log('🤖 Starting real-time AI generation with enhanced error handling...');
      
      // Call the chat edge function with proper error handling
      const { data: aiResponse, error } = await supabase.functions.invoke('chat', {
        body: {
          message,
          projectId,
          channelData,
          generateCode: true
        }
      });

      // Check for Supabase function invocation errors
      if (error) {
        console.error('❌ Supabase Function Error:', error);
        
        // Handle specific Supabase errors
        if (error.message?.includes('fetch')) {
          throw new Error('Network connection error. Please check your internet connection and try again.');
        } else if (error.message?.includes('timeout')) {
          throw new Error('Request timeout. The AI service is taking too long to respond. Please try again.');
        } else {
          throw new Error(`Service Error: ${error.message}`);
        }
      }

      if (!aiResponse) {
        throw new Error('No response received from AI service. Please try again.');
      }

      // Check if the response contains an error from the edge function
      if (aiResponse.error) {
        console.error('❌ AI API Error from edge function:', aiResponse.error);
        
        // Handle specific OpenRouter errors with user-friendly messages
        if (aiResponse.error.includes('authentication failed')) {
          throw new Error('🔑 **API Key Issue**\n\nThe OpenRouter API key is not properly configured. Please contact the administrator to update the API key in the admin panel.');
        } else if (aiResponse.error.includes('Rate limit exceeded')) {
          throw new Error('⏰ **Rate Limit Reached**\n\nToo many requests. Please wait a moment and try again.');
        } else if (aiResponse.error.includes('No active OpenRouter API keys found')) {
          throw new Error('🔧 **Configuration Issue**\n\nNo OpenRouter API keys are configured. Please contact the administrator to add API keys.');
        } else if (aiResponse.error.includes('credits')) {
          throw new Error('💳 **Credit Limit Reached**\n\nThe API credit limit has been exceeded. Please contact the administrator.');
        } else {
          throw new Error(aiResponse.error);
        }
      }

      // Validate the AI response structure
      if (!aiResponse.reply && !aiResponse.generatedCode) {
        throw new Error('Invalid response format received from AI service.');
      }

      console.log('✅ Real-time AI generation completed successfully');

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
      
      // Don't show toast for configuration errors - let the parent handle them
      if (!errorMessage.includes('API Key Issue') && !errorMessage.includes('Configuration Issue')) {
        toast({
          title: "AI Generation Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      // Return a helpful response instead of null
      return {
        reply: `❌ **AI Generation Failed**\n\n${errorMessage}\n\n🔄 **Please try:**\n• Refreshing the page\n• Using a simpler request\n• Contacting support if the issue persists\n\n💡 **Example**: "Create a modern portfolio website"`,
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
