
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, Plus, Trash2, Copy, Check } from 'lucide-react';
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
    model: ''
  });
  const [copiedKey, setCopiedKey] = useState<string>('');

  // OpenRouter free models
  const freeModels = [
    { provider: 'OpenAI', model: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { provider: 'Anthropic', model: 'claude-3-haiku', name: 'Claude 3 Haiku' },
    { provider: 'Google', model: 'gemini-pro', name: 'Gemini Pro' },
    { provider: 'Meta', model: 'llama-2-70b', name: 'Llama 2 70B' },
    { provider: 'Mistral', model: 'mistral-7b', name: 'Mistral 7B' },
    { provider: 'DeepSeek', model: 'deepseek-coder', name: 'DeepSeek Coder' },
    { provider: 'Nous Research', model: 'nous-hermes-2', name: 'Nous Hermes 2' },
    { provider: 'WizardLM', model: 'wizardlm-70b', name: 'WizardLM 70B' },
    { provider: 'CodeLlama', model: 'codellama-34b', name: 'Code Llama 34B' },
    { provider: 'Phind', model: 'phind-codellama-34b', name: 'Phind CodeLlama' }
  ];

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        return;
      }

      setApiKeys(data || []);
    } catch (error) {
      console.error('Error in fetchApiKeys:', error);
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

      setNewApiKey({ name: '', key_value: '', provider: '', model: '' });
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bolt-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2">Loading API keys...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bolt-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 bolt-text-gradient">
            <Key size={20} />
            API Key Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manage" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manage">Manage Keys</TabsTrigger>
              <TabsTrigger value="add">Add New</TabsTrigger>
              <TabsTrigger value="models">Free Models</TabsTrigger>
            </TabsList>

            <TabsContent value="manage" className="space-y-4">
              <div className="space-y-4">
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No API keys found. Add your first API key to get started.
                  </div>
                ) : (
                  apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-card/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold mobile-text">{apiKey.name}</h3>
                          <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                            {apiKey.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          Provider: {apiKey.provider} {apiKey.model && `| Model: ${apiKey.model}`}
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {showKeys[apiKey.id] ? apiKey.key_value : '••••••••••••••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {showKeys[apiKey.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key_value, apiKey.id)}
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
                  <label className="text-sm font-medium">API Key Name</label>
                  <Input
                    placeholder="e.g., OpenAI GPT-4 Production"
                    value={newApiKey.name}
                    onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                    className="bolt-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Provider</label>
                  <Input
                    placeholder="e.g., OpenAI, Anthropic, Google"
                    value={newApiKey.provider}
                    onChange={(e) => setNewApiKey({ ...newApiKey, provider: e.target.value })}
                    className="bolt-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Model (Optional)</label>
                  <Input
                    placeholder="e.g., gpt-4, claude-3-opus"
                    value={newApiKey.model}
                    onChange={(e) => setNewApiKey({ ...newApiKey, model: e.target.value })}
                    className="bolt-input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    type="password"
                    placeholder="Enter your API key"
                    value={newApiKey.key_value}
                    onChange={(e) => setNewApiKey({ ...newApiKey, key_value: e.target.value })}
                    className="bolt-input mt-1"
                  />
                </div>
                <Button onClick={addApiKey} className="bolt-button">
                  <Plus size={16} />
                  Add API Key
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {freeModels.map((model) => (
                  <div key={`${model.provider}-${model.model}`} className="p-4 border border-border/50 rounded-lg bg-card/30">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold mobile-text">{model.name}</h3>
                      <Badge variant="secondary">Free</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Provider: {model.provider}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Model: {model.model}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewApiKey({
                        ...newApiKey,
                        provider: model.provider,
                        model: model.model,
                        name: model.name
                      })}
                    >
                      Use This Model
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiKeyManagement;
