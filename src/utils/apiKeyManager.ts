
import { supabase } from '@/integrations/supabase/client';

interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  provider: string;
  model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProviderSpecificKey {
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

interface AllKeysResponse {
  youtube: ProviderSpecificKey[];
  openrouter: ProviderSpecificKey[];
  github: ProviderSpecificKey[];
  netlify: ProviderSpecificKey[];
}

class ApiKeyManager {
  private cache: Map<string, any[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 1 * 60 * 1000; // 1 minute cache

  private isCacheValid(provider: string): boolean {
    const expiry = this.cacheExpiry.get(provider);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(provider: string): void {
    this.cacheExpiry.set(provider, Date.now() + this.CACHE_DURATION);
  }

  // Get all provider keys (method that was missing)
  async getAllProviderKeys(): Promise<AllKeysResponse> {
    console.log('🔍 Getting all provider keys...');
    
    const [youtube, openrouter, github, netlify] = await Promise.all([
      this.getProviderSpecificKeys('youtube'),
      this.getProviderSpecificKeys('openrouter'),
      this.getProviderSpecificKeys('github'),
      this.getProviderSpecificKeys('netlify')
    ]);

    return {
      youtube,
      openrouter,
      github,
      netlify
    };
  }

  // Get all active API keys from shared pool (accessible to all authenticated users)
  async getPlatformApiKeys(provider: string): Promise<ApiKey[]> {
    console.log(`🔍 Getting shared platform API keys for provider: ${provider}`);
    
    const cacheKey = `platform_${provider}`;
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached keys for ${provider}:`, cached.length);
        return cached;
      }
    }

    try {
      // Get all active keys for this provider from shared pool
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`❌ Error fetching shared ${provider} API keys:`, error);
        return [];
      }

      const keys = data || [];
      console.log(`✅ Fetched ${keys.length} shared platform keys for ${provider}`);
      
      this.cache.set(cacheKey, keys);
      this.setCacheExpiry(cacheKey);
      
      return keys;
    } catch (error) {
      console.error(`❌ Exception fetching shared ${provider} API keys:`, error);
      return [];
    }
  }

  // Get provider-specific keys (YouTube, OpenRouter, GitHub, Netlify)
  async getProviderSpecificKeys(provider: string): Promise<ProviderSpecificKey[]> {
    console.log(`🔍 Getting shared provider-specific keys for: ${provider}`);
    
    const cacheKey = `specific_${provider}`;
    if (this.isCacheValid(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log(`📦 Using cached specific keys for ${provider}:`, cached.length);
        return cached;
      }
    }

    try {
      let data: any[] = [];
      let error: any = null;

      switch (provider.toLowerCase()) {
        case 'youtube': {
          const result = await supabase
            .from('youtube_api_keys')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          data = result.data || [];
          error = result.error;
          break;
        }
        
        case 'openrouter': {
          const result = await supabase
            .from('openrouter_api_keys')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
          data = result.data || [];
          error = result.error;
          break;
        }
        
        case 'github': {
          const [providerResult, deploymentResult] = await Promise.all([
            supabase
              .from('github_api_keys')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false }),
            supabase
              .from('deployment_tokens')
              .select('*')
              .eq('provider', 'github')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
          ]);

          data = [
            ...(providerResult.data || []).map(key => ({
              ...key,
              api_token: key.api_token
            })),
            ...(deploymentResult.data || []).map(key => ({
              id: key.id,
              name: key.token_name,
              api_token: key.token_value,
              is_active: key.is_active,
              created_at: key.created_at
            }))
          ];
          error = providerResult.error || deploymentResult.error;
          break;
        }
        
        case 'netlify': {
          const [providerResult, deploymentResult] = await Promise.all([
            supabase
              .from('netlify_api_keys')
              .select('*')
              .eq('is_active', true)
              .order('created_at', { ascending: false }),
            supabase
              .from('deployment_tokens')
              .select('*')
              .eq('provider', 'netlify')
              .eq('is_active', true)
              .order('created_at', { ascending: false })
          ]);

          data = [
            ...(providerResult.data || []).map(key => ({
              ...key,
              api_token: key.api_token
            })),
            ...(deploymentResult.data || []).map(key => ({
              id: key.id,
              name: key.token_name,
              api_token: key.token_value,
              is_active: key.is_active,
              created_at: key.created_at
            }))
          ];
          error = providerResult.error || deploymentResult.error;
          break;
        }
        
        default:
          console.log(`❓ Unknown provider: ${provider}`);
          return [];
      }

      if (error) {
        console.error(`❌ Error fetching shared ${provider} provider-specific keys:`, error);
        return [];
      }

      console.log(`✅ Fetched ${data.length} shared provider-specific keys for ${provider}`);
      this.cache.set(cacheKey, data);
      this.setCacheExpiry(cacheKey);
      
      return data;
    } catch (error) {
      console.error(`❌ Exception fetching shared ${provider} provider-specific keys:`, error);
      return [];
    }
  }

  async getYouTubeKey(): Promise<string | null> {
    console.log('🎥 Getting shared YouTube API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('youtube');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('✅ Found shared YouTube key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKeys = await this.getPlatformApiKeys('YouTube');
    if (generalKeys.length > 0) {
      const activeKey = generalKeys.find(key => key.is_active);
      if (activeKey?.key_value) {
        console.log('✅ Found shared YouTube key in general api_keys table');
        return activeKey.key_value;
      }
    }

    console.log('❌ No shared YouTube API key found');
    return null;
  }

  async getOpenRouterKey(): Promise<string | null> {
    console.log('🤖 Getting shared OpenRouter API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('openrouter');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('✅ Found shared OpenRouter key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKeys = await this.getPlatformApiKeys('OpenRouter');
    if (generalKeys.length > 0) {
      const activeKey = generalKeys.find(key => key.is_active);
      if (activeKey?.key_value) {
        console.log('✅ Found shared OpenRouter key in general api_keys table');
        return activeKey.key_value;
      }
    }

    console.log('❌ No shared OpenRouter API key found');
    return null;
  }

  async getGitHubToken(): Promise<string | null> {
    console.log('🐙 Getting shared GitHub token...');
    
    // First try provider-specific table including deployment tokens
    const providerKeys = await this.getProviderSpecificKeys('github');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('✅ Found shared GitHub token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKeys = await this.getPlatformApiKeys('GitHub');
    if (generalKeys.length > 0) {
      const activeKey = generalKeys.find(key => key.is_active);
      if (activeKey?.key_value) {
        console.log('✅ Found shared GitHub token in general api_keys table');
        return activeKey.key_value;
      }
    }

    console.log('❌ No shared GitHub token found');
    return null;
  }

  async getNetlifyToken(): Promise<string | null> {
    console.log('🌐 Getting shared Netlify token...');
    
    // First try provider-specific table including deployment tokens
    const providerKeys = await this.getProviderSpecificKeys('netlify');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('✅ Found shared Netlify token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKeys = await this.getPlatformApiKeys('Netlify');
    if (generalKeys.length > 0) {
      const activeKey = generalKeys.find(key => key.is_active);
      if (activeKey?.key_value) {
        console.log('✅ Found shared Netlify token in general api_keys table');
        return activeKey.key_value;
      }
    }

    console.log('❌ No shared Netlify token found');
    return null;
  }

  // Check if shared keys are available (accessible to all authenticated users)
  async checkKeyAvailability(): Promise<{
    youtube: boolean;
    openrouter: boolean;
    github: boolean;
    netlify: boolean;
  }> {
    console.log('🔍 Checking shared API key availability for all authenticated users...');
    
    const [youtubeKey, openrouterKey, githubKey, netlifyKey] = await Promise.all([
      this.getYouTubeKey(),
      this.getOpenRouterKey(),
      this.getGitHubToken(),
      this.getNetlifyToken()
    ]);

    const availability = {
      youtube: !!youtubeKey,
      openrouter: !!openrouterKey,
      github: !!githubKey,
      netlify: !!netlifyKey
    };

    console.log('📊 Shared API key availability:', availability);
    return availability;
  }

  // Clear cache for a specific provider or all
  clearCache(provider?: string): void {
    if (provider) {
      this.cache.delete(`platform_${provider}`);
      this.cache.delete(`specific_${provider}`);
      this.cacheExpiry.delete(`platform_${provider}`);
      this.cacheExpiry.delete(`specific_${provider}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
    console.log(`🧹 Cache cleared for ${provider || 'all providers'}`);
  }

  // Get total key count across all providers
  async getTotalKeyCount(): Promise<number> {
    console.log('🔢 Getting total shared platform key count...');
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id', { count: 'exact' })
        .eq('is_active', true);

      if (error) {
        console.error('❌ Error getting total key count:', error);
        return 0;
      }

      const count = data?.length || 0;
      console.log(`📊 Total shared platform keys: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Exception getting total key count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
export default apiKeyManager;
