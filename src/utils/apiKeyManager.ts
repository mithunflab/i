
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

class ApiKeyManager {
  private cache: Map<string, ApiKey[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private isCacheValid(provider: string): boolean {
    const expiry = this.cacheExpiry.get(provider);
    return expiry ? Date.now() < expiry : false;
  }

  private setCacheExpiry(provider: string): void {
    this.cacheExpiry.set(provider, Date.now() + this.CACHE_DURATION);
  }

  // Get shared platform API keys (not user-specific)
  async getPlatformApiKeys(provider: string): Promise<ApiKey[]> {
    console.log(`Getting platform API keys for provider: ${provider}`);
    
    if (this.isCacheValid(provider)) {
      const cached = this.cache.get(provider);
      if (cached) {
        console.log(`Using cached keys for ${provider}:`, cached);
        return cached;
      }
    }

    try {
      // Get all active keys for this provider (not filtered by user_id)
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('provider', provider)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching ${provider} API keys:`, error);
        return [];
      }

      const keys = data || [];
      console.log(`Fetched ${keys.length} platform keys for ${provider}:`, keys);
      
      this.cache.set(provider, keys);
      this.setCacheExpiry(provider);
      
      return keys;
    } catch (error) {
      console.error(`Exception fetching ${provider} API keys:`, error);
      return [];
    }
  }

  async getActiveKey(provider: string): Promise<string | null> {
    console.log(`Getting active key for provider: ${provider}`);
    
    const keys = await this.getPlatformApiKeys(provider);
    
    if (keys.length === 0) {
      console.log(`No keys found for provider: ${provider}`);
      return null;
    }

    // Get the first active key
    const activeKey = keys.find(key => key.is_active);
    if (!activeKey) {
      console.log(`No active keys found for provider: ${provider}`);
      return null;
    }

    console.log(`Found active key for ${provider}:`, activeKey.name);
    return activeKey.key_value;
  }

  async getProviderSpecificKeys(provider: string): Promise<ProviderSpecificKey[]> {
    console.log(`Getting provider-specific keys for: ${provider}`);
    
    try {
      let tableName: string;
      let keyField: string;

      switch (provider.toLowerCase()) {
        case 'youtube':
          tableName = 'youtube_api_keys';
          keyField = 'api_key';
          break;
        case 'openrouter':
          tableName = 'openrouter_api_keys';
          keyField = 'api_key';
          break;
        case 'github':
          tableName = 'github_api_keys';
          keyField = 'api_token';
          break;
        case 'netlify':
          tableName = 'netlify_api_keys';
          keyField = 'api_token';
          break;
        default:
          console.log(`Unknown provider: ${provider}`);
          return [];
      }

      // Get all keys for this provider (not filtered by user_id for shared access)
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error fetching ${provider} provider-specific keys:`, error);
        return [];
      }

      const keys = data || [];
      console.log(`Found ${keys.length} provider-specific keys for ${provider}`);
      
      return keys.map(key => ({
        ...key,
        [keyField === 'api_key' ? 'api_key' : 'api_token']: key[keyField]
      }));
    } catch (error) {
      console.error(`Exception fetching ${provider} provider-specific keys:`, error);
      return [];
    }
  }

  async getYouTubeKey(): Promise<string | null> {
    console.log('Getting YouTube API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('youtube');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('Found YouTube key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('YouTube');
    if (generalKey) {
      console.log('Found YouTube key in general api_keys table');
      return generalKey;
    }

    console.log('No YouTube API key found');
    return null;
  }

  async getOpenRouterKey(): Promise<string | null> {
    console.log('Getting OpenRouter API key...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('openrouter');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_key);
      if (activeKey?.api_key) {
        console.log('Found OpenRouter key in provider-specific table');
        return activeKey.api_key;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('OpenRouter');
    if (generalKey) {
      console.log('Found OpenRouter key in general api_keys table');
      return generalKey;
    }

    console.log('No OpenRouter API key found');
    return null;
  }

  async getGitHubToken(): Promise<string | null> {
    console.log('Getting GitHub token...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('github');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('Found GitHub token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('GitHub');
    if (generalKey) {
      console.log('Found GitHub token in general api_keys table');
      return generalKey;
    }

    console.log('No GitHub token found');
    return null;
  }

  async getNetlifyToken(): Promise<string | null> {
    console.log('Getting Netlify token...');
    
    // First try provider-specific table
    const providerKeys = await this.getProviderSpecificKeys('netlify');
    if (providerKeys.length > 0) {
      const activeKey = providerKeys.find(key => key.is_active && key.api_token);
      if (activeKey?.api_token) {
        console.log('Found Netlify token in provider-specific table');
        return activeKey.api_token;
      }
    }

    // Fallback to general api_keys table
    const generalKey = await this.getActiveKey('Netlify');
    if (generalKey) {
      console.log('Found Netlify token in general api_keys table');
      return generalKey;
    }

    console.log('No Netlify token found');
    return null;
  }

  // Method to check if keys are available
  async checkKeyAvailability(): Promise<{
    youtube: boolean;
    openrouter: boolean;
    github: boolean;
    netlify: boolean;
  }> {
    console.log('Checking API key availability...');
    
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

    console.log('API key availability:', availability);
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
    console.log('Getting total platform key count...');
    
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
      console.log(`Total platform keys: ${count}`);
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
