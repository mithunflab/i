
import { supabase } from '@/integrations/supabase/client';

interface OpenRouterResponse {
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
  error?: {
    message: string;
  };
}

export class OpenRouterService {
  private static async getModelPricing(model: string) {
    // Mock pricing data until model_pricing table is available in types
    const mockPricing = {
      'gpt-4': { input_cost_per_token: 0.00003, output_cost_per_token: 0.00006 },
      'gpt-3.5-turbo': { input_cost_per_token: 0.000001, output_cost_per_token: 0.000002 },
      'claude-3-sonnet': { input_cost_per_token: 0.000015, output_cost_per_token: 0.000075 },
      'default': { input_cost_per_token: 0.00001, output_cost_per_token: 0.00002 }
    };

    return mockPricing[model] || mockPricing['default'];
  }

  static async makeRequest(model: string, messages: any[], userId: string) {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Getting OpenRouter API key from Supabase tables...');
      
      // Get OpenRouter key from Supabase tables
      const { data: openrouterKeys, error: openrouterError } = await supabase
        .from('openrouter_api_keys')
        .select('api_key')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (openrouterError) {
        console.error('❌ Error fetching OpenRouter keys:', openrouterError);
        throw new Error('Failed to fetch OpenRouter API keys from database');
      }

      if (!openrouterKeys || openrouterKeys.length === 0) {
        console.error('❌ No active OpenRouter API keys found in database');
        throw new Error('No active OpenRouter API keys found. Please contact admin to add API keys.');
      }

      const apiKey = openrouterKeys[0].api_key;
      console.log('✅ Found OpenRouter API key in database, making request...');

      const pricing = await this.getModelPricing(model);

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Developer Portal",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages,
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error:', response.status, errorText);
        throw new Error(`OpenRouter API request failed: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();

      if (data.error) {
        console.error('OpenRouter API error in response:', data.error);
        throw new Error(data.error.message || 'OpenRouter API returned an error');
      }

      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = (data.usage?.prompt_tokens || 0) * pricing.input_cost_per_token + 
                   (data.usage?.completion_tokens || 0) * pricing.output_cost_per_token;

      console.log('✅ OpenRouter request successful:', {
        model,
        tokensUsed,
        cost,
        responseTime
      });

      // Log usage to database
      try {
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: userId,
            provider: 'openrouter',
            model: model,
            tokens_used: tokensUsed,
            cost_usd: cost,
            response_time_ms: responseTime,
            status: 'success'
          });
      } catch (logError) {
        console.warn('Failed to log API usage:', logError);
      }

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('❌ OpenRouter request failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
        responseTime
      });

      // Log error to database
      try {
        await supabase
          .from('api_usage_logs')
          .insert({
            user_id: userId,
            provider: 'openrouter',
            model: model,
            tokens_used: 0,
            cost_usd: 0,
            response_time_ms: responseTime,
            status: 'error',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
      } catch (logError) {
        console.warn('Failed to log API error:', logError);
      }

      throw error;
    }
  }
}
