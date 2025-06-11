
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
}

interface ApiUsageLog {
  user_id: string;
  api_key_id: string;
  model: string;
  provider: string;
  tokens_used: number;
  cost_usd: number;
  response_time_ms: number;
  status: string;
  error_message?: string;
  request_data?: any;
  response_data?: any;
}

export class OpenRouterService {
  private static async getActiveApiKeys(): Promise<any[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('provider', 'OpenRouter')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching API keys:', error);
      return [];
    }

    return data || [];
  }

  private static async getModelPricing(model: string) {
    const { data, error } = await supabase
      .from('model_pricing')
      .select('*')
      .eq('model', model)
      .single();

    if (error) {
      console.error('Error fetching model pricing:', error);
      return { input_cost_per_token: 0, output_cost_per_token: 0 };
    }

    return data;
  }

  private static async logApiUsage(logData: ApiUsageLog) {
    const { error } = await supabase
      .from('api_usage_logs')
      .insert(logData);

    if (error) {
      console.error('Error logging API usage:', error);
    }
  }

  static async makeRequest(model: string, messages: any[], userId: string) {
    const startTime = Date.now();
    const apiKeys = await this.getActiveApiKeys();
    
    if (apiKeys.length === 0) {
      throw new Error('No active OpenRouter API keys found');
    }

    // Load balance by selecting a random API key
    const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const pricing = await this.getModelPricing(model);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${randomKey.key_value}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Developer Portal",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1000
        })
      });

      const responseTime = Date.now() - startTime;
      const data: OpenRouterResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'API request failed');
      }

      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = (data.usage?.prompt_tokens || 0) * pricing.input_cost_per_token + 
                   (data.usage?.completion_tokens || 0) * pricing.output_cost_per_token;

      // Log the API usage
      await this.logApiUsage({
        user_id: userId,
        api_key_id: randomKey.id,
        model,
        provider: 'OpenRouter',
        tokens_used: tokensUsed,
        cost_usd: cost,
        response_time_ms: responseTime,
        status: 'success',
        request_data: { messages },
        response_data: data
      });

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log the failed request
      await this.logApiUsage({
        user_id: userId,
        api_key_id: randomKey.id,
        model,
        provider: 'OpenRouter',
        tokens_used: 0,
        cost_usd: 0,
        response_time_ms: responseTime,
        status: 'error',
        error_message: error.message,
        request_data: { messages }
      });

      throw error;
    }
  }
}

