
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
      
      // Validate that we have valid data - check for null/undefined first
      if (!rawKey || typeof rawKey !== 'object') {
        console.error(`Invalid key data for ${provider}:`, rawKey);
        return null;
      }

      // Now we know rawKey is not null, so we can safely check its properties
      const keyData = rawKey as Record<string, any>;
      
      // Check required properties exist
      if (!('id' in keyData) || !('name' in keyData) || !('is_active' in keyData) || !('created_at' in keyData)) {
        console.error(`Missing required properties for ${provider} key:`, keyData);
        return null;
      }
      
      // Validate required string properties are not empty
      if (!keyData.id || !keyData.name) {
        console.error(`Empty required properties for ${provider} key:`, keyData);
        return null;
      }
      
      // Map the raw data to our ApiKeyWithUsage interface
      const result: ApiKeyWithUsage = {
        id: keyData.id,
        name: keyData.name,
        is_active: keyData.is_active,
        created_at: keyData.created_at,
        last_used_at: keyData.last_used_at,
        ...(keyData.api_key && { api_key: keyData.api_key }),
        ...(keyData.api_token && { api_token: keyData.api_token }),
        ...(keyData.quota_used !== undefined && { quota_used: keyData.quota_used }),
        ...(keyData.quota_limit !== undefined && { quota_limit: keyData.quota_limit }),
        ...(keyData.credits_used !== undefined && { credits_used: keyData.credits_used }),
        ...(keyData.credits_limit !== undefined && { credits_limit: keyData.credits_limit }),
        ...(keyData.rate_limit_used !== undefined && { rate_limit_used: keyData.rate_limit_used }),
        ...(keyData.rate_limit_limit !== undefined && { rate_limit_limit: keyData.rate_limit_limit }),
        ...(keyData.deployments_count !== undefined && { deployments_count: keyData.deployments_count }),
        ...(keyData.deployments_limit !== undefined && { deployments_limit: keyData.deployments_limit }),
        ...(keyData.requests_count !== undefined && { requests_count: keyData.requests_count })
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
