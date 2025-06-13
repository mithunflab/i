
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
      
      // Fetch active OpenRouter API key directly from database
      const { data: openrouterKeys, error: keyError } = await supabase
        .from('openrouter_api_keys')
        .select('api_key, name')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (keyError || !openrouterKeys || openrouterKeys.length === 0) {
        throw new Error('No active OpenRouter API keys found. Please configure API keys.');
      }

      const apiKey = openrouterKeys[0].api_key;
      console.log('✅ Using OpenRouter API key:', openrouterKeys[0].name);

      // Generate enhanced prompt for website creation
      const enhancedPrompt = `You are an expert web developer creating stunning, modern websites.

USER REQUEST: ${message}

${channelData ? `
YOUTUBE CHANNEL DATA:
- Channel: ${channelData.title}
- Subscribers: ${parseInt(channelData.subscriberCount || '0').toLocaleString()}
- Description: ${channelData.description}
- Latest Videos: ${channelData.videos?.slice(0, 3).map((v: any) => v.snippet?.title || v.title).join(', ') || 'None'}
` : ''}

Generate a complete, modern HTML website with:
1. Responsive design using Tailwind CSS
2. Professional styling with gradients and animations
3. Real YouTube channel integration if data provided
4. Interactive elements and hover effects
5. Mobile-optimized layout
6. SEO-friendly structure

Return ONLY the complete HTML code, no explanations. Make it visually stunning and professional.`;

      // Free models for random selection
      const freeModels = [
        'nousresearch/hermes-3-llama-3.1-405b:free',
        'meta-llama/llama-3.1-8b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free'
      ];
      
      const selectedModel = freeModels[Math.floor(Math.random() * freeModels.length)];
      console.log('🎲 Selected AI model:', selectedModel);

      // Call OpenRouter API directly
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://lovable.ai',
          'X-Title': 'AI Website Builder'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert web developer creating professional, modern websites with real-time data integration.'
            },
            {
              role: 'user',
              content: enhancedPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const generatedCode = data.choices[0]?.message?.content;

      if (!generatedCode) {
        throw new Error('No code generated from AI');
      }

      console.log('✅ Real-time AI generation completed using:', selectedModel);

      // Log API usage
      await supabase.from('api_usage_logs').insert({
        user_id: user.id,
        provider: 'openrouter',
        model: selectedModel,
        tokens_used: data.usage?.total_tokens || 0,
        status: 'success',
        request_data: { message, projectId }
      });

      return {
        reply: `🎨 **Professional Website Generated!**\n\n✨ **AI Model**: ${selectedModel}\n\n🎯 **Features Created**:\n• Modern responsive design\n• Real-time YouTube integration\n• Professional animations\n• Mobile-optimized layout\n• SEO-friendly structure\n\n🚀 **Your stunning website is ready for deployment!**`,
        feature: 'professional-website',
        generatedCode: generatedCode.replace(/```html|```/g, '').trim(),
        codeDescription: `Professional website generated using ${selectedModel} with real-time features`
      };

    } catch (error) {
      console.error('❌ Real-time AI generation error:', error);
      
      // Log error
      await supabase.from('api_usage_logs').insert({
        user_id: user.id,
        provider: 'openrouter',
        model: 'unknown',
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "AI Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  return {
    generateWithAI,
    loading
  };
};
