
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
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
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

  const togetherModels = [
    { 
      model: 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free', 
      name: 'DeepSeek R1 Distill Llama 70B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 
      name: 'Llama 3.1 70B Instruct Turbo', 
      plan: 'pro',
      icon: '⭐'
    },
    { 
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', 
      name: 'Mixtral 8x7B Instruct', 
      plan: 'pro',
      icon: '⭐'
    }
  ];

  const groqModels = [
    { 
      model: 'llama3-70b-8192', 
      name: 'Llama 3 70B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'mixtral-8x7b-32768', 
      name: 'Mixtral 8x7B', 
      plan: 'free',
      icon: '🆓'
    },
    { 
      model: 'deepseek-coder-33b', 
      name: 'DeepSeek Coder 33B', 
      plan: 'free',
      icon: '🆓'
    }
  ];

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
        toast({
          title: "Error",
          description: "Failed to load API keys",
          variant: "destructive"
        });
        setApiKeys([]);
      } else {
        setApiKeys(data || []);
      }
    } catch (error) {
      console.error('Error in fetchApiKeys:', error);
      toast({
        title: "Error", 
        description: "Failed to load API keys",
        variant: "destructive"
      });
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
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add to general api_keys table
      const { error: generalError } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newApiKey.name,
          key_value: newApiKey.key_value,
          provider: newApiKey.provider,
          model: newApiKey.model || null
        });

      if (generalError) {
        console.error('Error adding API key:', generalError);
        toast({
          title: "Error",
          description: "Failed to add API key",
          variant: "destructive"
        });
        return;
      }

      // Also add to provider-specific table
      const provider = newApiKey.provider.toLowerCase();
      if (provider === 'together') {
        await supabase
          .from('together_api_keys')
          .insert({
            user_id: user.id,
            name: newApiKey.name,
            api_key: newApiKey.key_value,
            is_active: true
          });
      } else if (provider === 'groq') {
        await supabase
          .from('groq_api_keys')
          .insert({
            user_id: user.id,
            name: newApiKey.name,
            api_key: newApiKey.key_value,
            is_active: true
          });
      } else if (provider === 'openrouter') {
        await supabase
          .from('openrouter_api_keys')
          .insert({
            user_id: user.id,
            name: newApiKey.name,
            api_key: newApiKey.key_value,
            is_active: true
          });
      }

      toast({
        title: "Success",
        description: "API key added successfully"
      });

      setNewApiKey({ name: '', key_value: '', provider: '', model: '', plan_tier: 'free' });
      fetchApiKeys();
    } catch (error) {
      console.error('Error in addApiKey:', error);
      toast({
        title: "Error",
        description: "Failed to add API key",
        variant: "destructive"
      });
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
          description: "Failed to delete API key",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "API key deleted successfully"
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error in deleteApiKey:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
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
        toast({
          title: "Error",
          description: "Failed to update API key",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `API key ${!currentStatus ? 'enabled' : 'disabled'} successfully`
      });

      fetchApiKeys();
    } catch (error) {
      console.error('Error in toggleApiKey:', error);
      toast({
        title: "Error",
        description: "Failed to update API key",
        variant: "destructive"
      });
    }
  };

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
              <TabsTrigger value="together-models" className="text-white">Together AI</TabsTrigger>
              <TabsTrigger value="groq-models" className="text-white">Groq Models</TabsTrigger>
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
                          {apiKey.provider === 'Together' && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                              Together AI
                            </Badge>
                          )}
                          {apiKey.provider === 'Groq' && (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                              Groq
                            </Badge>
                          )}
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
                    placeholder="e.g., Together AI Production Key"
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
                      <SelectItem value="Together">Together AI</SelectItem>
                      <SelectItem value="Groq">Groq</SelectItem>
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
                    placeholder="e.g., deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free"
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

            <TabsContent value="together-models" className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">🤝 Together AI Models</h3>
                <p className="text-sm text-gray-300 mb-4">
                  High-performance AI models optimized for real-time applications.
                </p>
                <div className="grid gap-3">
                  {togetherModels.map((model) => (
                    <div key={model.model} className="flex items-center justify-between p-3 bg-gray-800/30 rounded border border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{model.icon}</span>
                        <div>
                          <h4 className="font-medium text-white">{model.name}</h4>
                          <p className="text-xs text-gray-400">{model.model}</p>
                        </div>
                      </div>
                      <Badge variant={model.plan === 'free' ? 'secondary' : 'default'}>
                        {model.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="groq-models" className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                <h3 className="font-semibold text-green-400 mb-2">⚡ Groq Models</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Ultra-fast inference with GroqChip accelerators for lightning-speed responses.
                </p>
                <div className="grid gap-3">
                  {groqModels.map((model) => (
                    <div key={model.model} className="flex items-center justify-between p-3 bg-gray-800/30 rounded border border-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{model.icon}</span>
                        <div>
                          <h4 className="font-medium text-white">{model.name}</h4>
                          <p className="text-xs text-gray-400">{model.model}</p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {model.plan}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;
