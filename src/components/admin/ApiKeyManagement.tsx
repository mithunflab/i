
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Key, Eye, EyeOff, Plus, Trash2, Copy, Check, Zap, Crown, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ApiKey {
  id: string;
  name: string;
  key_value: string;
  provider: string;
  model: string | null;
  is_active: boolean;
  created_at: string;
  plan_tier?: string;
}

const ApiKeyManagement = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newApiKey, setNewApiKey] = useState({
    name: '',
    key_value: '',
    provider: '',
    model: '',
    plan_tier: 'free'
  });
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [testingModel, setTestingModel] = useState<string>('');

  // OpenRouter models with plan restrictions
  const openRouterModels = [
    { 
      model: 'nousresearch/deephermes-3-mistral-24b-preview:free', 
      name: 'DeepHermes 3 Mistral 24B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'deepseek/deepseek-r1-0528:free', 
      name: 'DeepSeek R1', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'deepseek/deepseek-r1-0528-qwen3-8b:free', 
      name: 'DeepSeek R1 Qwen3 8B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'qwen/qwen3-235b-a22b:free', 
      name: 'Qwen3 235B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'deepseek/deepseek-prover-v2:free', 
      name: 'DeepSeek Prover V2', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'qwen/qwen3-30b-a3b:free', 
      name: 'Qwen3 30B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'deepseek/deepseek-v3-base:free', 
      name: 'DeepSeek V3 Base', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'anthropic/claude-3-sonnet:beta', 
      name: 'Claude 3 Sonnet', 
      plan: 'pro',
      icon: '⭐'
    },
    { 
      model: 'openai/gpt-4o', 
      name: 'GPT-4o', 
      plan: 'pro',
      icon: '⭐'
    },
    { 
      model: 'anthropic/claude-3-opus:beta', 
      name: 'Claude 3 Opus', 
      plan: 'pro_plus',
      icon: '👑'
    },
    { 
      model: 'openai/o1-preview', 
      name: 'OpenAI o1 Preview', 
      plan: 'pro_plus',
      icon: '👑'
    }
  ];

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchApiKeys = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        setApiKeys([]);
      } else {
        setApiKeys(data || []);
      }
    } catch (error) {
      console.error('Error in fetchApiKeys:', error);
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const addApiKey = async () => {
    if (!user || !newApiKey.name || !newApiKey.key_value || !newApiKey.provider) {
      return;
    }

    try {
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newApiKey.name,
          key_value: newApiKey.key_value,
          provider: newApiKey.provider,
          model: newApiKey.model || null
        });

      if (error) {
        console.error('Error adding API key:', error);
        return;
      }

      setNewApiKey({ name: '', key_value: '', provider: '', model: '', plan_tier: 'free' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error in addApiKey:', error);
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
        return;
      }

      fetchApiKeys();
    } catch (error) {
      console.error('Error in deleteApiKey:', error);
    }
  };

  const toggleApiKey = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) {
        console.error('Error updating API key:', error);
        return;
      }

      fetchApiKeys();
    } catch (error) {
      console.error('Error in toggleApiKey:', error);
    }
  };

  const testOpenRouterModel = async (model: string) => {
    const openRouterKeys = apiKeys.filter(key => key.provider === 'OpenRouter' && key.is_active);
    
    if (openRouterKeys.length === 0) {
      alert('No active OpenRouter API keys found. Please add one first.');
      return;
    }

    setTestingModel(model);
    
    try {
      const randomKey = openRouterKeys[Math.floor(Math.random() * openRouterKeys.length)];
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${randomKey.key_value}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Website Builder",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": model,
          "messages": [
            {
              "role": "user",
              "content": "Say 'Hello! This is a test from your AI Website Builder.'"
            }
          ],
          "max_tokens": 50
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(`✅ Model test successful!\n\nResponse: ${data.choices[0].message.content}`);
      } else {
        alert(`❌ Model test failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert(`❌ Test failed: ${error.message}`);
    } finally {
      setTestingModel('');
    }
  };

  const getUserPlan = () => {
    return 'free';
  };

  const getAvailableModels = () => {
    const userPlan = getUserPlan();
    return openRouterModels.filter(model => {
      if (userPlan === 'free') return model.plan === 'free';
      if (userPlan === 'pro') return model.plan === 'free' || model.plan === 'pro';
      if (userPlan === 'pro_plus') return true;
      return false;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-white">Loading API keys...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key size={20} />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="manage" className="text-white">Manage Keys</TabsTrigger>
              <TabsTrigger value="add" className="text-white">Add New</TabsTrigger>
              <TabsTrigger value="openrouter" className="text-white">OpenRouter</TabsTrigger>
              <TabsTrigger value="models" className="text-white">Available Models</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="space-y-4">
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No API keys found. Add your first API key to get started.
                  </div>
                ) : (
                  apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{apiKey.name}</h3>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                          {apiKey.provider === 'OpenRouter' && (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30">
                              OpenRouter
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1">
                          Provider: {apiKey.provider} {apiKey.model && `| Model: ${apiKey.model}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                            {showKeys[apiKey.id] ? apiKey.key_value : '••••••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {showKeys[apiKey.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_value, apiKey.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {copiedKey === apiKey.id ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKey(apiKey.id, apiKey.is_active)}
                          className="border-gray-600 text-white hover:bg-white/10"
                        >
                          {apiKey.is_active ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="add" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-white">API Key Name</label>
                  <Input
                    placeholder="e.g., OpenRouter Production Key"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Provider</label>
                  <Select value={newApiKey.provider} onValueChange={(value) => setNewApiKey({ ...newApiKey, provider: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white mt-1">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OpenRouter">OpenRouter</SelectItem>
                      <SelectItem value="OpenAI">OpenAI</SelectItem>
                      <SelectItem value="Anthropic">Anthropic</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white">Model (Optional)</label>
                  <Input
                    placeholder="e.g., gpt-4, claude-3-opus"
                    value={newApiKey.model}
                    onChange={(e) => setNewApiKey({ ...newApiKey, model: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={newApiKey.key_value}
                    onChange={(e) => setNewApiKey({ ...newApiKey, key_value: e.target.value })}
                    className="bg-gray-800 border-gray-600 text-white mt-1"
                  />
                </div>
                <Button onClick={addApiKey} className="bg-purple-600 hover:bg-purple-700">
                  <Plus size={16} className="mr-2" />
                  Add API Key
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="openrouter" className="space-y-4">
              <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <h3 className="font-semibold text-orange-400 mb-2">🚀 OpenRouter Integration</h3>
                <p className="text-sm text-gray-300">
                  Add multiple OpenRouter API keys for load balancing and high availability. 
                  The system will automatically rotate between active keys.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">📊 Available Models</h3>
                <p className="text-sm text-gray-300">
                  Models available based on your API keys and subscription plans.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;
