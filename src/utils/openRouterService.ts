
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
    try {
      // Try to get pricing from database first
      const { data: pricing } = await supabase
        .from('model_pricing')
        .select('input_cost_per_token, output_cost_per_token')
        .eq('model', model)
        .eq('is_active', true)
        .single();

      if (pricing) {
        return pricing;
      }
    } catch (error) {
      console.warn('Failed to get pricing from database, using fallback');
    }

    // Fallback pricing data
    const fallbackPricing: Record<string, any> = {
      'gpt-4o': { input_cost_per_token: 0.000005, output_cost_per_token: 0.000015 },
      'gpt-4o-mini': { input_cost_per_token: 0.00000015, output_cost_per_token: 0.0000006 },
      'gpt-4-turbo': { input_cost_per_token: 0.00001, output_cost_per_token: 0.00003 },
      'gpt-3.5-turbo': { input_cost_per_token: 0.0000005, output_cost_per_token: 0.0000015 },
      'claude-3-sonnet': { input_cost_per_token: 0.000003, output_cost_per_token: 0.000015 },
      'claude-3-haiku': { input_cost_per_token: 0.00000025, output_cost_per_token: 0.00000125 },
      'default': { input_cost_per_token: 0.00001, output_cost_per_token: 0.00002 }
    };

    return fallbackPricing[model] || fallbackPricing['default'];
  }

  static async makeRequest(model: string, messages: any[], userId: string, requestType: string = 'chat') {
    const startTime = Date.now();
    
    try {
      console.log('🔄 Getting OpenRouter API key from Supabase database...');
      
      // Get active OpenRouter key from database
      const { data: openrouterKeys, error: openrouterError } = await supabase
        .from('openrouter_api_keys')
        .select('*')
        .eq('is_active', true)
        .order('last_used_at', { ascending: true }) // Use least recently used key
        .limit(1);

      if (openrouterError) {
        console.error('❌ Error fetching OpenRouter keys:', openrouterError);
        throw new Error('Failed to fetch OpenRouter API keys from database');
      }

      if (!openrouterKeys || openrouterKeys.length === 0) {
        console.error('❌ No active OpenRouter API keys found in database');
        throw new Error('No active OpenRouter API keys found. Please contact admin to add API keys.');
      }

      const keyData = openrouterKeys[0];
      const apiKey = keyData.api_key;
      console.log('✅ Found OpenRouter API key in database');

      // Check credits and usage limits
      if (keyData.credits_used >= keyData.credits_limit) {
        throw new Error('OpenRouter API credits limit exceeded');
      }

      const pricing = await this.getModelPricing(model);

      // Make the actual API request
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Developer Portal",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          max_tokens: 4000,
          temperature: 0.7,
          stream: false
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
      const promptTokens = data.usage?.prompt_tokens || 0;
      const completionTokens = data.usage?.completion_tokens || 0;
      const cost = (promptTokens * pricing.input_cost_per_token) + (completionTokens * pricing.output_cost_per_token);

      console.log('✅ OpenRouter request successful:', {
        model,
        tokensUsed,
        cost: cost.toFixed(6),
        responseTime
      });

      // Update API key usage
      try {
        await supabase
          .from('openrouter_api_keys')
          .update({
            last_used_at: new Date().toISOString(),
            requests_count: keyData.requests_count + 1,
            credits_used: keyData.credits_used + cost
          })
          .eq('id', keyData.id);
      } catch (updateError) {
        console.warn('Failed to update API key usage:', updateError);
      }

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
            status: 'success',
            request_data: { request_type: requestType, message_count: messages.length },
            response_data: { 
              prompt_tokens: promptTokens, 
              completion_tokens: completionTokens,
              total_tokens: tokensUsed
            }
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
            error_message: error instanceof Error ? error.message : 'Unknown error',
            request_data: { request_type: requestType, message_count: messages.length }
          });
      } catch (logError) {
        console.warn('Failed to log API error:', logError);
      }

      throw error;
    }
  }
}
