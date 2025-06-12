
import { apiKeyManager } from '@/utils/apiKeyManager';

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
    
    // Get shared OpenRouter API key
    const apiKey = await apiKeyManager.getOpenRouterKey();
    
    if (!apiKey) {
      throw new Error('No active OpenRouter API keys found in shared pool. Please contact admin to add API keys.');
    }

    const pricing = await this.getModelPricing(model);

    try {
      console.log('Making OpenRouter request with shared API key...');
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Developer Portal",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      const responseTime = Date.now() - startTime;
      const data: OpenRouterResponse = await response.json();

      if (!response.ok) {
        console.error('OpenRouter API error:', data);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      const tokensUsed = data.usage?.total_tokens || 0;
      const cost = (data.usage?.prompt_tokens || 0) * pricing.input_cost_per_token + 
                   (data.usage?.completion_tokens || 0) * pricing.output_cost_per_token;

      console.log('OpenRouter request successful:', {
        model,
        tokensUsed,
        cost,
        responseTime
      });

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      console.error('OpenRouter request failed:', {
        error: error.message,
        model,
        responseTime
      });

      throw error;
    }
  }
}
