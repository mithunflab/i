
import { supabase } from '@/integrations/supabase/client';

export interface ApiKeyWithUsage {
  id: string;
  name: string;
  api_key?: string;
  api_token?: string;
  quota_used?: number;
  quota_limit?: number;
  credits_used?: number;
  credits_limit?: number;
  rate_limit_used?: number;
  rate_limit_limit?: number;
  deployments_count?: number;
  deployments_limit?: number;
  requests_count?: number;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
}

export const apiKeyManager = {
  async getAllKeys(userId: string): Promise<Record<string, ApiKeyWithUsage[]>> {
    try {
      console.log('Loading API keys for user:', userId);

      // Load YouTube keys
      const { data: youtubeKeys, error: youtubeError } = await supabase
        .from('youtube_api_keys')
        .select('*')
        .eq('user_id', userId);

      if (youtubeError) {
        console.error('Error loading YouTube keys:', youtubeError);
      }

      // Load OpenRouter keys
      const { data: openrouterKeys, error: openrouterError } = await supabase
        .from('openrouter_api_keys')
        .select('*')
        .eq('user_id', userId);

      if (openrouterError) {
        console.error('Error loading OpenRouter keys:', openrouterError);
      }

      // Load GitHub keys
      const { data: githubKeys, error: githubError } = await supabase
        .from('github_api_keys')
        .select('*')
        .eq('user_id', userId);

      if (githubError) {
        console.error('Error loading GitHub keys:', githubError);
      }

      // Load Netlify keys
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('*')
        .eq('user_id', userId);

      if (netlifyError) {
        console.error('Error loading Netlify keys:', netlifyError);
      }

      return {
        youtube: (youtubeKeys || []) as ApiKeyWithUsage[],
        openrouter: (openrouterKeys || []) as ApiKeyWithUsage[],
        github: (githubKeys || []) as ApiKeyWithUsage[],
        netlify: (netlifyKeys || []) as ApiKeyWithUsage[]
      };
    } catch (error) {
      console.error('Error in getAllKeys:', error);
      return {
        youtube: [],
        openrouter: [],
        github: [],
        netlify: []
      };
    }
  },

  async getActiveKey(provider: string, userId: string): Promise<ApiKeyWithUsage | null> {
    try {
      let data, error;

      switch (provider) {
        case 'youtube':
          ({ data, error } = await supabase
            .from('youtube_api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1)
            .single());
          break;
        case 'openrouter':
          ({ data, error } = await supabase
            .from('openrouter_api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1)
            .single());
          break;
        case 'github':
          ({ data, error } = await supabase
            .from('github_api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1)
            .single());
          break;
        case 'netlify':
          ({ data, error } = await supabase
            .from('netlify_api_keys')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .limit(1)
            .single());
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      if (error && error.code !== 'PGRST116') {
        console.error(`Error loading active ${provider} key:`, error);
        return null;
      }

      return data as ApiKeyWithUsage || null;
    } catch (error) {
      console.error(`Error getting active key for ${provider}:`, error);
      return null;
    }
  },

  async getNextAvailableKey(provider: string, userId: string): Promise<ApiKeyWithUsage | null> {
    try {
      // For now, just return the first active key
      return await this.getActiveKey(provider, userId);
    } catch (error) {
      console.error(`Error getting next available key for ${provider}:`, error);
      return null;
    }
  },

  async updateUsage(provider: string, keyId: string, usageData: any): Promise<boolean> {
    try {
      let error;

      switch (provider) {
        case 'youtube':
          ({ error } = await supabase
            .from('youtube_api_keys')
            .update({
              quota_used: usageData.quota_used,
              last_used_at: new Date().toISOString()
            })
            .eq('id', keyId));
          break;
        case 'openrouter':
          ({ error } = await supabase
            .from('openrouter_api_keys')
            .update({
              credits_used: usageData.credits_used,
              requests_count: usageData.requests_count,
              last_used_at: new Date().toISOString()
            })
            .eq('id', keyId));
          break;
        case 'github':
          ({ error } = await supabase
            .from('github_api_keys')
            .update({
              rate_limit_used: usageData.rate_limit_used,
              last_used_at: new Date().toISOString()
            })
            .eq('id', keyId));
          break;
        case 'netlify':
          ({ error } = await supabase
            .from('netlify_api_keys')
            .update({
              deployments_count: usageData.deployments_count,
              last_used_at: new Date().toISOString()
            })
            .eq('id', keyId));
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      if (error) {
        console.error(`Error updating ${provider} key usage:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error updating usage for ${provider}:`, error);
      return false;
    }
  },

  async updateKeyUsage(provider: string, keyId: string, usageData: any): Promise<boolean> {
    // Alias for updateUsage method for backward compatibility
    return await this.updateUsage(provider, keyId, usageData);
  },

  async trackUsage(
    provider: string, 
    keyId: string, 
    userId: string, 
    requestType: string, 
    tokensUsed: number = 0, 
    costUsd: number = 0, 
    responseTimeMs: number = 0, 
    success: boolean = true, 
    errorMessage?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('api_usage_tracking')
        .insert({
          api_key_id: keyId,
          user_id: userId,
          provider: provider,
          request_type: requestType,
          tokens_used: tokensUsed,
          cost_usd: costUsd,
          response_time_ms: responseTimeMs,
          success: success,
          error_message: errorMessage || null
        });

      if (error) {
        console.error(`Error tracking usage for ${provider}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error tracking usage for ${provider}:`, error);
      return false;
    }
  }
};
