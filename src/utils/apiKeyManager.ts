
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
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minute cache

  private isCacheValid(provider: string): boolean {
    const expiry = this.cacheExpiry.get(provider);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(provider: string): void {
    this.cacheExpiry.set(provider, Date.now() + this.CACHE_DURATION);
  }

  // Get all provider keys
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

  // Get provider-specific keys from Supabase tables
  async getProviderSpecificKeys(provider: string): Promise<ProviderSpecificKey[]> {
    console.log(`🔍 Getting provider-specific keys for: ${provider}`);
    
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
        console.error(`❌ Error fetching ${provider} provider-specific keys:`, error);
        return [];
      }

      console.log(`✅ Fetched ${data.length} provider-specific keys for ${provider}`);
      this.cache.set(cacheKey, data);
      this.setCacheExpiry(cacheKey);
      
      return data;
    } catch (error) {
      console.error(`❌ Exception fetching ${provider} provider-specific keys:`, error);
      return [];
    }
  }

  async getYouTubeKey(): Promise<string | null> {
    console.log('🎥 Getting YouTube API key...');
    
    const providerKeys = await this.getProviderSpecificKeys('youtube');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('✅ Found YouTube key in provider-specific table');
        return activeKey.api_key;
      }
    }

    console.log('❌ No YouTube API key found');
    return null;
  }

  async getOpenRouterKey(): Promise<string | null> {
    console.log('🤖 Getting OpenRouter API key...');
    
    const providerKeys = await this.getProviderSpecificKeys('openrouter');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('✅ Found OpenRouter key in provider-specific table');
        return activeKey.api_key;
      }
    }

    console.log('❌ No OpenRouter API key found');
    return null;
  }

  async getGitHubToken(): Promise<string | null> {
    console.log('🐙 Getting GitHub token...');
    
    const providerKeys = await this.getProviderSpecificKeys('github');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('✅ Found GitHub token in provider-specific table');
        return activeKey.api_token;
      }
    }

    console.log('❌ No GitHub token found');
    return null;
  }

  async getNetlifyToken(): Promise<string | null> {
    console.log('🌐 Getting Netlify token...');
    
    const providerKeys = await this.getProviderSpecificKeys('netlify');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('✅ Found Netlify token in provider-specific table');
        return activeKey.api_token;
      }
    }

    console.log('❌ No Netlify token found');
    return null;
  }

  // Check if keys are available
  async checkKeyAvailability(): Promise<{
    youtube: boolean;
    openrouter: boolean;
    github: boolean;
    netlify: boolean;
  }> {
    console.log('🔍 Checking API key availability...');
    
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

    console.log('📊 API key availability:', availability);
    return availability;
  }

  // Clear cache for a specific provider or all
  clearCache(provider?: string): void {
    if (provider) {
      this.cache.delete(`specific_${provider}`);
      this.cacheExpiry.delete(`specific_${provider}`);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
    console.log(`🧹 Cache cleared for ${provider || 'all providers'}`);
  }

  // Get total key count across all providers
  async getTotalKeyCount(): Promise<number> {
    console.log('🔢 Getting total platform key count...');
    
    try {
      const [
        youtubeKeysResult,
        openrouterKeysResult,
        githubKeysResult,
        netlifyKeysResult,
        deploymentTokensResult
      ] = await Promise.all([
        supabase
          .from('youtube_api_keys')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        supabase
          .from('openrouter_api_keys')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        supabase
          .from('github_api_keys')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        supabase
          .from('netlify_api_keys')
          .select('id', { count: 'exact' })
          .eq('is_active', true),
        supabase
          .from('deployment_tokens')
          .select('id', { count: 'exact' })
          .eq('is_active', true)
      ]);

      const totalCount = 
        (youtubeKeysResult.count || 0) +
        (openrouterKeysResult.count || 0) +
        (githubKeysResult.count || 0) +
        (netlifyKeysResult.count || 0) +
        (deploymentTokensResult.count || 0);

      console.log(`📊 Total platform keys: ${totalCount}`);
      return totalCount;
    } catch (error) {
      console.error('❌ Exception getting total key count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
export default apiKeyManager;
