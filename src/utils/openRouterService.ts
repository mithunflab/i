
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
    // Mock pricing data until model_pricing table is available in types
    const mockPricing = {
      'gpt-4': { input_cost_per_token: 0.00003, output_cost_per_token: 0.00006 },
      'gpt-3.5-turbo': { input_cost_per_token: 0.000001, output_cost_per_token: 0.000002 },
      'claude-3-sonnet': { input_cost_per_token: 0.000015, output_cost_per_token: 0.000075 },
      'default': { input_cost_per_token: 0.00001, output_cost_per_token: 0.00002 }
    };

    return mockPricing[model] || mockPricing['default'];
  }

  private static async logApiUsage(logData: ApiUsageLog) {
    // For now, just log to console until api_usage_logs table is available in types
    console.log('API Usage Log:', logData);
    
    // Store in analytics table as a workaround
    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: logData.user_id,
          event_type: 'api_usage',
          event_data: {
            api_key_id: logData.api_key_id,
            model: logData.model,
            provider: logData.provider,
            tokens_used: logData.tokens_used,
            cost_usd: logData.cost_usd,
            response_time_ms: logData.response_time_ms,
            status: logData.status,
            error_message: logData.error_message
          }
        });

      if (error) {
        console.error('Error logging API usage to analytics:', error);
      }
    } catch (err) {
      console.error('Failed to log API usage:', err);
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
