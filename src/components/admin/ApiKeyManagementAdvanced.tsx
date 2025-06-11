
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, Plus, Trash2, Eye, EyeOff, Wifi, Shield, BarChart3, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiKeyManager } from '@/utils/apiKeyManager';

interface ApiKeyData {
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

const ApiKeyManagementAdvanced = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyData[]>>({
    youtube: [],
    openrouter: [],
    github: [],
    netlify: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [activeTab, setActiveTab] = useState('youtube');
  const [newKey, setNewKey] = useState({
    name: '',
    key_value: '',
    quota_limit: 10000,
    credits_limit: 100,
    rate_limit_limit: 5000,
    deployments_limit: 300
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && profile?.role === 'admin') {
      loadAllApiKeys();
      setupRealTimeUpdates();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const setupRealTimeUpdates = () => {
    console.log('Setting up real-time updates for API key management');
    
    const providers = ['youtube_api_keys', 'openrouter_api_keys', 'github_api_keys', 'netlify_api_keys'];
    
    providers.forEach(table => {
      supabase
        .channel(`${table}-admin-updates`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          (payload) => {
            console.log(`Real-time ${table} update:`, payload);
            loadAllApiKeys();
            toast({
              title: "Real-time Update",
              description: `${table.replace('_api_keys', '')} API keys updated`
            });
            setIsConnected(true);
          }
        )
        .subscribe((status) => {
          console.log(`${table} real-time subscription status:`, status);
          setIsConnected(status === 'SUBSCRIBED');
        });
    });
  };

  const loadAllApiKeys = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const allKeys = await apiKeyManager.getAllKeys(user.id);
      console.log('Loaded all API keys:', allKeys);
      setApiKeys(allKeys);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (provider: string) => {
    if (!newKey.name || !newKey.key_value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);

    try {
      let tableName = '';
      let insertData: any = {
        user_id: user.id,
        name: newKey.name,
        is_active: true
      };

      switch (provider) {
        case 'youtube':
          tableName = 'youtube_api_keys';
          insertData.api_key = newKey.key_value;
          insertData.quota_limit = newKey.quota_limit;
          break;
        case 'openrouter':
          tableName = 'openrouter_api_keys';
          insertData.api_key = newKey.key_value;
          insertData.credits_limit = newKey.credits_limit;
          break;
        case 'github':
          tableName = 'github_api_keys';
          insertData.api_token = newKey.key_value;
          insertData.rate_limit_limit = newKey.rate_limit_limit;
          break;
        case 'netlify':
          tableName = 'netlify_api_keys';
          insertData.api_token = newKey.key_value;
          insertData.deployments_limit = newKey.deployments_limit;
          break;
        default:
          throw new Error('Unknown provider');
      }

      const { error } = await supabase
        .from(tableName)
        .insert(insertData);

      if (error) {
        console.error('Error saving API key:', error);
        toast({
          title: "Error",
          description: `Failed to save API key: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "API key saved successfully"
        });
        setNewKey({
          name: '',
          key_value: '',
          quota_limit: 10000,
          credits_limit: 100,
          rate_limit_limit: 5000,
          deployments_limit: 300
        });
        loadAllApiKeys();
      }
    } catch (err) {
      console.error('Exception saving API key:', err);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteApiKey = async (provider: string, keyId: string) => {
    try {
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
          throw new Error('Unknown provider');
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting API key:', error);
        toast({
          title: "Error",
          description: `Failed to delete API key: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "API key deleted successfully"
        });
        loadAllApiKeys();
      }
    } catch (err) {
      console.error('Exception deleting API key:', err);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const getUsagePercentage = (key: ApiKeyData, provider: string): number => {
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
  };

  const getUsageLabel = (key: ApiKeyData, provider: string): string => {
    switch (provider) {
      case 'youtube':
        return `${key.quota_used || 0} / ${key.quota_limit || 0} quota`;
      case 'openrouter':
        return `$${key.credits_used || 0} / $${key.credits_limit || 0} credits`;
      case 'github':
        return `${key.rate_limit_used || 0} / ${key.rate_limit_limit || 0} requests`;
      case 'netlify':
        return `${key.deployments_count || 0} / ${key.deployments_limit || 0} deployments`;
      default:
        return '';
    }
  };

  const renderProviderTab = (provider: string, keys: ApiKeyData[]) => {
    const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
    
    return (
      <TabsContent value={provider} className="space-y-4">
        {/* Add New Key Form */}
        <Card className="bg-gray-800/30 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Add New {providerName} API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  placeholder={`e.g., Primary ${providerName} Key`}
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key_value" className="text-white">API Key/Token</Label>
                <Input
                  id="key_value"
                  type="password"
                  placeholder="Enter your API key or token"
                  value={newKey.key_value}
                  onChange={(e) => setNewKey(prev => ({ ...prev, key_value: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              {provider === 'youtube' && (
                <div className="space-y-2">
                  <Label htmlFor="quota_limit" className="text-white">Quota Limit</Label>
                  <Input
                    id="quota_limit"
                    type="number"
                    value={newKey.quota_limit}
                    onChange={(e) => setNewKey(prev => ({ ...prev, quota_limit: parseInt(e.target.value) }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              )}

              {provider === 'openrouter' && (
                <div className="space-y-2">
                  <Label htmlFor="credits_limit" className="text-white">Credits Limit ($)</Label>
                  <Input
                    id="credits_limit"
                    type="number"
                    value={newKey.credits_limit}
                    onChange={(e) => setNewKey(prev => ({ ...prev, credits_limit: parseFloat(e.target.value) }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => saveApiKey(provider)}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : `Add ${providerName} Key`}
            </Button>
          </CardContent>
        </Card>

        {/* Keys List */}
        <div className="space-y-3">
          {keys.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No {providerName} keys found</p>
              <p className="text-sm mt-2">Add your first {providerName} key above</p>
            </div>
          ) : (
            keys.map((key) => {
              const usagePercentage = getUsagePercentage(key, provider);
              const usageLabel = getUsageLabel(key, provider);
              
              return (
                <Card key={key.id} className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{key.name}</h4>
                        <Badge 
                          variant={key.is_active ? "default" : "destructive"} 
                          className="text-xs"
                        >
                          {key.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {key.last_used_at && (
                          <Badge variant="outline" className="text-xs">
                            Last used: {new Date(key.last_used_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(key.id)}
                          className="border-gray-600"
                        >
                          {showKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          onClick={() => deleteApiKey(provider, key.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        type={showKeys[key.id] ? "text" : "password"}
                        value={key.api_key || key.api_token || ''}
                        readOnly
                        className="bg-gray-900 border-gray-600 text-white text-sm font-mono"
                      />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">{usageLabel}</span>
                        <span className="text-sm text-gray-400">{usagePercentage.toFixed(1)}%</span>
                      </div>
                      
                      <Progress 
                        value={usagePercentage} 
                        className="h-2"
                      />
                    </div>
                    
                    <p className="text-xs text-gray-400 mt-2">
                      Created: {new Date(key.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </TabsContent>
    );
  };

  // Only allow admin users to access this component
  if (profile?.role !== 'admin') {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6 text-center">
          <Shield className="mx-auto h-12 w-12 mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
          <p className="text-gray-400">This section is only accessible to administrators.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading API keys...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalKeys = Object.values(apiKeys).reduce((sum, keys) => sum + keys.length, 0);

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key size={20} />
            Advanced API Key Management
            <div className="ml-auto flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              <Badge variant="outline" className="text-xs">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {totalKeys} Total Keys
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Admin Only
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="youtube" className="data-[state=active]:bg-red-600">
                YouTube ({apiKeys.youtube?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="openrouter" className="data-[state=active]:bg-blue-600">
                OpenRouter ({apiKeys.openrouter?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="github" className="data-[state=active]:bg-gray-600">
                GitHub ({apiKeys.github?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="netlify" className="data-[state=active]:bg-green-600">
                Netlify ({apiKeys.netlify?.length || 0})
              </TabsTrigger>
            </TabsList>

            {renderProviderTab('youtube', apiKeys.youtube || [])}
            {renderProviderTab('openrouter', apiKeys.openrouter || [])}
            {renderProviderTab('github', apiKeys.github || [])}
            {renderProviderTab('netlify', apiKeys.netlify || [])}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagementAdvanced;
