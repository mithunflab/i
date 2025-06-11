
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
      console.log('Loading all API keys for user:', userId);

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

      const result = {
        youtube: (youtubeKeys || []).map(key => ({
          id: key.id,
          name: key.name,
          api_key: key.api_key,
          quota_used: key.quota_used,
          quota_limit: key.quota_limit,
          is_active: key.is_active,
          last_used_at: key.last_used_at,
          created_at: key.created_at
        })) as ApiKeyWithUsage[],
        openrouter: (openrouterKeys || []).map(key => ({
          id: key.id,
          name: key.name,
          api_key: key.api_key,
          credits_used: key.credits_used,
          credits_limit: key.credits_limit,
          requests_count: key.requests_count,
          is_active: key.is_active,
          last_used_at: key.last_used_at,
          created_at: key.created_at
        })) as ApiKeyWithUsage[],
        github: (githubKeys || []).map(key => ({
          id: key.id,
          name: key.name,
          api_token: key.api_token,
          rate_limit_used: key.rate_limit_used,
          rate_limit_limit: key.rate_limit_limit,
          is_active: key.is_active,
          last_used_at: key.last_used_at,
          created_at: key.created_at
        })) as ApiKeyWithUsage[],
        netlify: (netlifyKeys || []).map(key => ({
          id: key.id,
          name: key.name,
          api_token: key.api_token,
          deployments_count: key.deployments_count,
          deployments_limit: key.deployments_limit,
          is_active: key.is_active,
          last_used_at: key.last_used_at,
          created_at: key.created_at
        })) as ApiKeyWithUsage[]
      };

      console.log('All API keys loaded:', result);
      return result;
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
      console.log(`Getting active key for provider: ${provider}, user: ${userId}`);
      
      let tableName: string;
      switch (provider) {
        case 'youtube':
          tableName = 'youtube_api_keys';
          break;
        case 'openrouter':
          tableName = 'openrouter_api_keys';
          break;
        case 'github':
          tableName = 'github_api_keys';
          break;
        case 'netlify':
          tableName = 'netlify_api_keys';
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error(`Error loading active ${provider} key:`, error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log(`No active key found for ${provider}`);
        return null;
      }

      const rawKey = data[0];
      
      // Validate that we have the required properties
      if (!rawKey || typeof rawKey !== 'object' || !rawKey.id || !rawKey.name) {
        console.error(`Invalid key data for ${provider}:`, rawKey);
        return null;
      }
      
      // Map the raw data to our ApiKeyWithUsage interface
      const result: ApiKeyWithUsage = {
        id: rawKey.id,
        name: rawKey.name,
        is_active: rawKey.is_active,
        created_at: rawKey.created_at,
        last_used_at: rawKey.last_used_at,
        ...(rawKey.api_key && { api_key: rawKey.api_key }),
        ...(rawKey.api_token && { api_token: rawKey.api_token }),
        ...(rawKey.quota_used !== undefined && { quota_used: rawKey.quota_used }),
        ...(rawKey.quota_limit !== undefined && { quota_limit: rawKey.quota_limit }),
        ...(rawKey.credits_used !== undefined && { credits_used: rawKey.credits_used }),
        ...(rawKey.credits_limit !== undefined && { credits_limit: rawKey.credits_limit }),
        ...(rawKey.rate_limit_used !== undefined && { rate_limit_used: rawKey.rate_limit_used }),
        ...(rawKey.rate_limit_limit !== undefined && { rate_limit_limit: rawKey.rate_limit_limit }),
        ...(rawKey.deployments_count !== undefined && { deployments_count: rawKey.deployments_count }),
        ...(rawKey.deployments_limit !== undefined && { deployments_limit: rawKey.deployments_limit }),
        ...(rawKey.requests_count !== undefined && { requests_count: rawKey.requests_count })
      };

      console.log(`Active key for ${provider}:`, result);
      return result;
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
      console.log(`Updating usage for ${provider} key ${keyId}:`, usageData);
      
      let tableName: string;
      let updateData: any = { last_used_at: new Date().toISOString() };

      switch (provider) {
        case 'youtube':
          tableName = 'youtube_api_keys';
          if (usageData.quota_used !== undefined) {
            updateData.quota_used = usageData.quota_used;
          }
          break;
        case 'openrouter':
          tableName = 'openrouter_api_keys';
          if (usageData.credits_used !== undefined) {
            updateData.credits_used = usageData.credits_used;
          }
          if (usageData.requests_count !== undefined) {
            updateData.requests_count = usageData.requests_count;
          }
          break;
        case 'github':
          tableName = 'github_api_keys';
          if (usageData.rate_limit_used !== undefined) {
            updateData.rate_limit_used = usageData.rate_limit_used;
          }
          break;
        case 'netlify':
          tableName = 'netlify_api_keys';
          if (usageData.deployments_count !== undefined) {
            updateData.deployments_count = usageData.deployments_count;
          }
          break;
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const { error } = await supabase
        .from(tableName as any)
        .update(updateData)
        .eq('id', keyId);

      if (error) {
        console.error(`Error updating ${provider} key usage:`, error);
        return false;
      }

      console.log(`Successfully updated usage for ${provider} key ${keyId}`);
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
      console.log(`Tracking usage for ${provider}:`, {
        keyId,
        userId,
        requestType,
        tokensUsed,
        costUsd,
        responseTimeMs,
        success,
        errorMessage
      });

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

      console.log(`Successfully tracked usage for ${provider}`);
      return true;
    } catch (error) {
      console.error(`Error tracking usage for ${provider}:`, error);
      return false;
    }
  }
};
