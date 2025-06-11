
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
}

export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private cache: Map<string, ApiKeyWithUsage[]> = new Map();
  private lastCacheUpdate: Map<string, number> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  private async loadKeys(provider: string, userId: string): Promise<ApiKeyWithUsage[]> {
    const cacheKey = `${provider}-${userId}`;
    const lastUpdate = this.lastCacheUpdate.get(cacheKey) || 0;
    const now = Date.now();

    // Return cached data if it's still fresh
    if (now - lastUpdate < this.CACHE_TTL && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || [];
    }

    let tableName = '';
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

    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: true, nullsFirst: true });

      if (error) {
        console.error(`Error loading ${provider} keys:`, error);
        return [];
      }

      const keys = data || [];
      this.cache.set(cacheKey, keys);
      this.lastCacheUpdate.set(cacheKey, now);
      
      console.log(`Loaded ${keys.length} ${provider} keys for user ${userId}`);
      return keys;
    } catch (error) {
      console.error(`Exception loading ${provider} keys:`, error);
      return [];
    }
  }

  async getNextAvailableKey(provider: string, userId: string): Promise<ApiKeyWithUsage | null> {
    const keys = await this.loadKeys(provider, userId);
    
    if (keys.length === 0) {
      console.log(`No ${provider} keys available for user ${userId}`);
      return null;
    }

    // Find key with lowest usage or least recently used
    let bestKey = keys[0];
    for (const key of keys) {
      const currentUsage = this.getUsagePercentage(key, provider);
      const bestUsage = this.getUsagePercentage(bestKey, provider);
      
      if (currentUsage < bestUsage) {
        bestKey = key;
      } else if (currentUsage === bestUsage) {
        // If usage is equal, prefer the one used least recently
        const currentLastUsed = key.last_used_at ? new Date(key.last_used_at).getTime() : 0;
        const bestLastUsed = bestKey.last_used_at ? new Date(bestKey.last_used_at).getTime() : 0;
        
        if (currentLastUsed < bestLastUsed) {
          bestKey = key;
        }
      }
    }

    console.log(`Selected ${provider} key: ${bestKey.name} (${this.getUsagePercentage(bestKey, provider)}% used)`);
    return bestKey;
  }

  private getUsagePercentage(key: ApiKeyWithUsage, provider: string): number {
    switch (provider) {
      case 'youtube':
        return key.quota_limit ? (key.quota_used || 0) / key.quota_limit * 100 : 0;
      case 'openrouter':
        return key.credits_limit ? (key.credits_used || 0) / key.credits_limit * 100 : 0;
      case 'github':
        return key.rate_limit_limit ? (key.rate_limit_used || 0) / key.rate_limit_limit * 100 : 0;
      case 'netlify':
        return key.deployments_limit ? (key.deployments_count || 0) / key.deployments_limit * 100 : 0;
      default:
        return 0;
    }
  }

  async updateKeyUsage(provider: string, keyId: string, usage: Partial<ApiKeyWithUsage>): Promise<void> {
    let tableName = '';
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
        return;
    }

    try {
      const updateData = {
        ...usage,
        last_used_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', keyId);

      if (error) {
        console.error(`Error updating ${provider} key usage:`, error);
      } else {
        console.log(`Updated ${provider} key usage:`, updateData);
        // Invalidate cache
        this.invalidateCache(provider);
      }
    } catch (error) {
      console.error(`Exception updating ${provider} key usage:`, error);
    }
  }

  async trackUsage(provider: string, keyId: string, userId: string, requestType: string, tokens: number = 0, cost: number = 0, responseTime: number = 0, success: boolean = true, errorMessage?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_usage_tracking')
        .insert({
          provider,
          api_key_id: keyId,
          user_id: userId,
          request_type: requestType,
          tokens_used: tokens,
          cost_usd: cost,
          response_time_ms: responseTime,
          success,
          error_message: errorMessage
        });

      if (error) {
        console.error('Error tracking API usage:', error);
      }
    } catch (error) {
      console.error('Exception tracking API usage:', error);
    }
  }

  invalidateCache(provider?: string): void {
    if (provider) {
      // Invalidate specific provider cache
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(`${provider}-`));
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.lastCacheUpdate.delete(key);
      });
    } else {
      // Invalidate all cache
      this.cache.clear();
      this.lastCacheUpdate.clear();
    }
  }

  async getAllKeys(userId: string): Promise<Record<string, ApiKeyWithUsage[]>> {
    const providers = ['youtube', 'openrouter', 'github', 'netlify'];
    const result: Record<string, ApiKeyWithUsage[]> = {};

    for (const provider of providers) {
      result[provider] = await this.loadKeys(provider, userId);
    }

    return result;
  }
}

export const apiKeyManager = ApiKeyManager.getInstance();
