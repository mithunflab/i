
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
  private cache: Map<string, ApiKey[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

  private isCacheValid(provider: string): boolean {
    const expiry = this.cacheExpiry.get(provider);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(provider: string): void {
    this.cacheExpiry.set(provider, Date.now() + this.CACHE_DURATION);
  }

  // Log API usage using existing api_usage_logs table
  private async logApiUsage(provider: string, endpoint: string, success: boolean, responseTime?: number, projectId?: string) {
    try {
      await supabase
        .from('api_usage_logs')
        .insert({
          provider,
          model: endpoint,
          status: success ? 'success' : 'error',
          response_time_ms: responseTime || 0,
          tokens_used: 1,
          cost_usd: 0.01,
          request_data: { project_id: projectId },
          response_data: { timestamp: new Date().toISOString() }
        });
    } catch (error) {
      console.error('Failed to log API usage:', error);
    }
  }

  // Get shared platform API keys (GLOBAL ACCESS FOR ALL AUTHENTICATED USERS)
  async getPlatformApiKeys(provider: string): Promise<ApiKey[]> {
    console.log(`Getting shared platform API keys for provider: ${provider}`);
    
    if (this.isCacheValid(provider)) {
      const cached = this.cache.get(provider);
      if (cached) {
        console.log(`Using cached keys for ${provider}:`, cached);
        return cached;
      }
    }

    try {
      // Get all active keys for this provider from shared pool (GLOBAL ACCESS)
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching shared ${provider} API keys:`, error);
        return [];
      }

      const keys = data || [];
      console.log(`Fetched ${keys.length} shared platform keys for ${provider}:`, keys);
      
      this.cache.set(provider, keys);
      this.setCacheExpiry(provider);
      
      return keys;
    } catch (error) {
      console.error(`Exception fetching shared ${provider} API keys:`, error);
      return [];
    }
  }

  async getActiveKey(provider: string, projectId?: string): Promise<string | null> {
    console.log(`Getting active shared key for provider: ${provider}`);
    const startTime = Date.now();
    
    try {
      const keys = await this.getPlatformApiKeys(provider);
      
      if (keys.length === 0) {
        console.log(`No shared keys found for provider: ${provider}`);
        await this.logApiUsage(provider, 'get_key', false, Date.now() - startTime, projectId);
        return null;
      }

      // Get the first active key from shared pool
      const activeKey = keys.find(key => key.is_active);
      if (!activeKey) {
        console.log(`No active shared keys found for provider: ${provider}`);
        await this.logApiUsage(provider, 'get_key', false, Date.now() - startTime, projectId);
        return null;
      }

      console.log(`Found active shared key for ${provider}:`, activeKey.name);
      await this.logApiUsage(provider, 'get_key', true, Date.now() - startTime, projectId);
      return activeKey.key_value;
    } catch (error) {
      await this.logApiUsage(provider, 'get_key', false, Date.now() - startTime, projectId);
      throw error;
    }
  }

  // Get provider-specific keys including deployment tokens (GLOBAL ACCESS)
  async getProviderSpecificKeys(provider: string): Promise<ProviderSpecificKey[]> {
    console.log(`Getting shared provider-specific keys for: ${provider}`);
    
    try {
      switch (provider.toLowerCase()) {
        case 'youtube': {
          const { data, error } = await supabase
            .from('youtube_api_keys')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching shared YouTube keys:`, error);
            return [];
          }

          return (data || []).map(key => ({
            ...key,
            api_key: key.api_key
          }));
        }
        
        case 'openrouter': {
          const { data, error } = await supabase
            .from('openrouter_api_keys')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching shared OpenRouter keys:`, error);
            return [];
          }

          return (data || []).map(key => ({
            ...key,
            api_key: key.api_key
          }));
        }
        
        case 'github': {
          // Get both provider-specific keys and deployment tokens
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

          const combinedData = [
            ...(providerResult.data || []).map(key => ({
              ...key,
              api_token: key.api_token
            })),
            ...(deploymentResult.data || []).map(key => ({
              id: key.id,
              name: key.token_name,
              api_token: key.token_value,
              is_active: key.is_active,
              created_at: key.created_at,
              updated_at: key.updated_at
            }))
          ];

          return combinedData;
        }
        
        case 'netlify': {
          // Get both provider-specific keys and deployment tokens
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

          const combinedData = [
            ...(providerResult.data || []).map(key => ({
              ...key,
              api_token: key.api_token
            })),
            ...(deploymentResult.data || []).map(key => ({
              id: key.id,
              name: key.token_name,
              api_token: key.token_value,
              is_active: key.is_active,
              created_at: key.created_at,
              updated_at: key.updated_at
            }))
          ];

          return combinedData;
        }
        
        default:
          console.log(`Unknown provider: ${provider}`);
          return [];
      }
    } catch (error) {
      console.error(`Exception fetching shared ${provider} provider-specific keys:`, error);
      return [];
    }
  }

  async getAllProviderKeys(): Promise<AllKeysResponse> {
    console.log('Getting all shared API keys for all providers');
    
    try {
      const [youtubeKeys, openrouterKeys, githubKeys, netlifyKeys] = await Promise.all([
        this.getProviderSpecificKeys('youtube'),
        this.getProviderSpecificKeys('openrouter'),
        this.getProviderSpecificKeys('github'),
        this.getProviderSpecificKeys('netlify')
      ]);

      return {
        youtube: youtubeKeys,
        openrouter: openrouterKeys,
        github: githubKeys,
        netlify: netlifyKeys
      };
    } catch (error) {
      console.error('Exception getting all shared keys:', error);
      return {
        youtube: [],
        openrouter: [],
        github: [],
        netlify: []
      };
    }
  }

  async getYouTubeKey(projectId?: string): Promise<string | null> {
    console.log('Getting shared YouTube API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('youtube');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('Found shared YouTube key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('YouTube', projectId);
    if (generalKey) {
      console.log('Found shared YouTube key in general api_keys table');
      return generalKey;
    }

    console.log('No shared YouTube API key found');
    return null;
  }

  async getOpenRouterKey(projectId?: string): Promise<string | null> {
    console.log('Getting shared OpenRouter API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('openrouter');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('Found shared OpenRouter key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('OpenRouter', projectId);
    if (generalKey) {
      console.log('Found shared OpenRouter key in general api_keys table');
      return generalKey;
    }

    console.log('No shared OpenRouter API key found');
    return null;
  }

  async getGitHubToken(projectId?: string): Promise<string | null> {
    console.log('Getting shared GitHub token...');
    
    // First try provider-specific table including deployment tokens
    const providerKeys = await this.getProviderSpecificKeys('github');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('Found shared GitHub token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('GitHub', projectId);
    if (generalKey) {
      console.log('Found shared GitHub token in general api_keys table');
      return generalKey;
    }

    console.log('No shared GitHub token found');
    return null;
  }

  async getNetlifyToken(projectId?: string): Promise<string | null> {
    console.log('Getting shared Netlify token...');
    
    // First try provider-specific table including deployment tokens
    const providerKeys = await this.getProviderSpecificKeys('netlify');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('Found shared Netlify token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('Netlify', projectId);
    if (generalKey) {
      console.log('Found shared Netlify token in general api_keys table');
      return generalKey;
    }

    console.log('No shared Netlify token found');
    return null;
  }

  // Method to check if shared keys are available (GLOBAL ACCESS FOR ALL USERS)
  async checkKeyAvailability(): Promise<{
    youtube: boolean;
    openrouter: boolean;
    github: boolean;
    netlify: boolean;
  }> {
    console.log('Checking shared API key availability for all users...');
    
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

    console.log('Shared API key availability:', availability);
    return availability;
  }

  // Clear cache for a specific provider
  clearCache(provider?: string): void {
    if (provider) {
      this.cache.delete(provider);
      this.cacheExpiry.delete(provider);
    } else {
      this.cache.clear();
      this.cacheExpiry.clear();
    }
    console.log(`Cache cleared for ${provider || 'all providers'}`);
  }

  // Get total key count across all providers
  async getTotalKeyCount(): Promise<number> {
    console.log('Getting total shared platform key count...');
    
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id')
        .eq('is_active', true);

      if (error) {
        console.error('Error getting total key count:', error);
        return 0;
      }

      const count = data?.length || 0;
      console.log(`Total shared platform keys: ${count}`);
      return count;
    } catch (error) {
      console.error('Exception getting total key count:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const apiKeyManager = new ApiKeyManager();
export default apiKeyManager;
