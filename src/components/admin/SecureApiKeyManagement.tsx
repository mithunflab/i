import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Plus, Trash2, Eye, EyeOff, Wifi, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  key_value: string;
  model?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const SecureApiKeyManagement = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [newKey, setNewKey] = useState({
    name: '',
    provider: '',
    key_value: '',
    model: ''
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id && profile?.role === 'admin') {
      loadApiKeys();
      setupRealTimeUpdates();
    } else {
      setLoading(false);
    }
  }, [user, profile]);

  const setupRealTimeUpdates = () => {
    console.log('Setting up real-time updates for API keys');
    
    const channel = supabase
      .channel('api-keys-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys'
        },
        (payload) => {
          console.log('Real-time API key update:', payload);
          loadApiKeys();
          toast({
            title: "Real-time Update",
            description: "API keys updated in real-time"
          });
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('API keys real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('Cleaning up API keys real-time subscription');
      supabase.removeChannel(channel);
    };
  };

  const loadApiKeys = async () => {
    if (!user?.id) return;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('Invalid user ID format:', user.id);
      toast({
        title: "Authentication Error",
        description: "Invalid user session. Please sign out and sign in again.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Loading API keys for user:', user.id);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading API keys:', error);
        toast({
          title: "Error",
          description: `Failed to load API keys: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('API keys loaded:', data);
        setApiKeys(data || []);
      }
    } catch (err) {
      console.error('Exception loading API keys:', err);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const syncToProviderTables = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setSyncing(true);

    try {
      console.log('Syncing API keys to provider-specific tables...');
      
      // Get all general API keys for this user
      const { data: generalKeys, error: generalError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id);

      if (generalError) {
        console.error('Error loading general API keys:', generalError);
        toast({
          title: "Error",
          description: `Failed to load API keys: ${generalError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!generalKeys || generalKeys.length === 0) {
        toast({
          title: "Info",
          description: "No API keys found to sync",
        });
        return;
      }

      let syncCount = 0;

      for (const key of generalKeys) {
        const provider = key.provider?.toLowerCase();
        
        if (provider === 'youtube') {
          // Check if key already exists in YouTube table
          const { data: existingYoutube } = await supabase
            .from('youtube_api_keys')
            .select('id')
            .eq('user_id', user.id)
            .eq('api_key', key.key_value)
            .single();

          if (!existingYoutube) {
            const { error: youtubeError } = await supabase
              .from('youtube_api_keys')
              .insert({
                user_id: user.id,
                name: key.name,
                api_key: key.key_value,
                quota_used: 0,
                quota_limit: 10000,
                is_active: key.is_active
              });

            if (!youtubeError) {
              syncCount++;
              console.log('Synced YouTube key:', key.name);
            } else {
              console.error('Error syncing YouTube key:', youtubeError);
            }
          }
        } else if (provider === 'openrouter') {
          // Check if key already exists in OpenRouter table
          const { data: existingOpenRouter } = await supabase
            .from('openrouter_api_keys')
            .select('id')
            .eq('user_id', user.id)
            .eq('api_key', key.key_value)
            .single();

          if (!existingOpenRouter) {
            const { error: openrouterError } = await supabase
              .from('openrouter_api_keys')
              .insert({
                user_id: user.id,
                name: key.name,
                api_key: key.key_value,
                credits_used: 0,
                credits_limit: 100,
                requests_count: 0,
                is_active: key.is_active
              });

            if (!openrouterError) {
              syncCount++;
              console.log('Synced OpenRouter key:', key.name);
            } else {
              console.error('Error syncing OpenRouter key:', openrouterError);
            }
          }
        } else if (provider === 'github') {
          // Check if key already exists in GitHub table
          const { data: existingGithub } = await supabase
            .from('github_api_keys')
            .select('id')
            .eq('user_id', user.id)
            .eq('api_token', key.key_value)
            .single();

          if (!existingGithub) {
            const { error: githubError } = await supabase
              .from('github_api_keys')
              .insert({
                user_id: user.id,
                name: key.name,
                api_token: key.key_value,
                rate_limit_used: 0,
                rate_limit_limit: 5000,
                is_active: key.is_active
              });

            if (!githubError) {
              syncCount++;
              console.log('Synced GitHub key:', key.name);
            } else {
              console.error('Error syncing GitHub key:', githubError);
            }
          }
        } else if (provider === 'netlify') {
          // Check if key already exists in Netlify table
          const { data: existingNetlify } = await supabase
            .from('netlify_api_keys')
            .select('id')
            .eq('user_id', user.id)
            .eq('api_token', key.key_value)
            .single();

          if (!existingNetlify) {
            const { error: netlifyError } = await supabase
              .from('netlify_api_keys')
              .insert({
                user_id: user.id,
                name: key.name,
                api_token: key.key_value,
                deployments_count: 0,
                deployments_limit: 300,
                is_active: key.is_active
              });

            if (!netlifyError) {
              syncCount++;
              console.log('Synced Netlify key:', key.name);
            } else {
              console.error('Error syncing Netlify key:', netlifyError);
            }
          }
        }
      }

      toast({
        title: "Success",
        description: `Synced ${syncCount} API keys to provider-specific tables`
      });

    } catch (error) {
      console.error('Error syncing to provider tables:', error);
      toast({
        title: "Error",
        description: "Failed to sync API keys",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const saveApiKey = async () => {
    if (!newKey.name || !newKey.provider || !newKey.key_value) {
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
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKey.name,
          provider: newKey.provider,
          key_value: newKey.key_value,
          model: newKey.model || null,
          is_active: true
        });

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
        setNewKey({ name: '', provider: '', key_value: '', model: '' });
        loadApiKeys();
        
        // Auto-sync to provider tables
        setTimeout(() => {
          syncToProviderTables();
        }, 1000);
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

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
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
        loadApiKeys();
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

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Key size={20} />
            Secure API Key Management
            <div className="ml-auto flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              <Badge variant="outline" className="text-xs">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Admin Only
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sync Button */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-2">🔄 Sync API Keys</h3>
                <p className="text-sm text-gray-300">
                  Sync your API keys from the general table to provider-specific tables for better integration.
                </p>
              </div>
              <Button 
                onClick={syncToProviderTables}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
            </div>
          </div>

          {/* Add New API Key */}
          <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-white">Add New API Key</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., OpenAI GPT-4"
                  value={newKey.name}
                  onChange={(e) => setNewKey(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="provider" className="text-white">Provider</Label>
                <Input
                  id="provider"
                  placeholder="e.g., OpenAI, YouTube, Stripe"
                  value={newKey.provider}
                  onChange={(e) => setNewKey(prev => ({ ...prev, provider: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key_value" className="text-white">API Key</Label>
                <Input
                  id="key_value"
                  type="password"
                  placeholder="Enter your API key"
                  value={newKey.key_value}
                  onChange={(e) => setNewKey(prev => ({ ...prev, key_value: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model" className="text-white">Model (Optional)</Label>
                <Input
                  id="model"
                  placeholder="e.g., gpt-4, claude-3"
                  value={newKey.model}
                  onChange={(e) => setNewKey(prev => ({ ...prev, model: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <Button 
              onClick={saveApiKey}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Add API Key'}
            </Button>
          </div>

          {/* API Keys List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Your API Keys ({apiKeys.length})</h3>
            
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No API keys found</p>
                <p className="text-sm mt-2">Add your first API key above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <Card key={key.id} className="bg-gray-800/50 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{key.name}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {key.provider}
                            </Badge>
                            {key.model && (
                              <Badge variant="outline" className="text-xs">
                                {key.model}
                              </Badge>
                            )}
                            <Badge 
                              variant={key.is_active ? "default" : "destructive"} 
                              className="text-xs"
                            >
                              {key.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Input
                              type={showKeys[key.id] ? "text" : "password"}
                              value={key.key_value}
                              readOnly
                              className="bg-gray-900 border-gray-600 text-white text-sm font-mono"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="border-gray-600"
                            >
                              {showKeys[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          
                          <p className="text-xs text-gray-400 mt-2">
                            Created: {new Date(key.created_at).toLocaleString()}
                          </p>
                        </div>
                        
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => deleteApiKey(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureApiKeyManagement;
