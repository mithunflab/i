
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Github, Globe, Plus, Trash2, Key, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface DeploymentToken {
  id: string;
  provider: 'github' | 'netlify';
  token_name: string;
  token_value: string;
  is_active: boolean;
  created_at: string;
}

const DeploymentSettings = () => {
  const [githubTokens, setGithubTokens] = useState<DeploymentToken[]>([]);
  const [netlifyTokens, setNetlifyTokens] = useState<DeploymentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [newToken, setNewToken] = useState({ name: '', value: '', provider: 'github' as 'github' | 'netlify' });
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('deployment_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tokens:', error);
        toast({
          title: "Error",
          description: "Failed to load deployment tokens",
          variant: "destructive"
        });
        return;
      }

      const tokens = data || [];
      setGithubTokens(tokens.filter(token => token.provider === 'github'));
      setNetlifyTokens(tokens.filter(token => token.provider === 'netlify'));
    } catch (error) {
      console.error('Error in loadTokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async () => {
    if (!newToken.name.trim() || !newToken.value.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('deployment_tokens')
        .insert({
          provider: newToken.provider,
          token_name: newToken.name,
          token_value: newToken.value,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('Error saving token:', error);
        toast({
          title: "Error",
          description: "Failed to save token",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${newToken.provider} token saved successfully`,
      });

      setNewToken({ name: '', value: '', provider: 'github' });
      loadTokens();
    } catch (error) {
      console.error('Error in saveToken:', error);
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from('deployment_tokens')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting token:', error);
        toast({
          title: "Error",
          description: "Failed to delete token",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Token deleted successfully",
      });

      loadTokens();
    } catch (error) {
      console.error('Error in deleteToken:', error);
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }));
  };

  const maskToken = (token: string) => {
    return token.slice(0, 8) + '*'.repeat(Math.max(0, token.length - 8));
  };

  const renderTokenList = (tokens: DeploymentToken[], provider: 'github' | 'netlify') => {
    const icon = provider === 'github' ? Github : Globe;
    const IconComponent = icon;

    return (
      <div className="space-y-4">
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <IconComponent className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No {provider} tokens configured</p>
          </div>
        ) : (
          tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/30">
              <div className="flex items-center gap-4">
                <IconComponent className="h-5 w-5 text-gray-400" />
                <div>
                  <h3 className="font-semibold text-white">{token.token_name}</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-gray-400 font-mono">
                      {showTokens[token.id] ? token.token_value : maskToken(token.token_value)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTokenVisibility(token.id)}
                      className="h-6 w-6 p-0"
                    >
                      {showTokens[token.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(token.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={token.is_active ? "default" : "secondary"}
                  className={token.is_active ? "bg-green-500/20 text-green-400" : ""}
                >
                  {token.is_active ? "Active" : "Inactive"}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteToken(token.id)}
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading deployment settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Deployment Settings</CardTitle>
        <p className="text-gray-400">Manage your GitHub and Netlify deployment tokens</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="github" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="github" className="flex items-center gap-2">
              <Github size={16} />
              GitHub Tokens
            </TabsTrigger>
            <TabsTrigger value="netlify" className="flex items-center gap-2">
              <Globe size={16} />
              Netlify Tokens
            </TabsTrigger>
          </TabsList>

          <TabsContent value="github" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Github size={20} />
                GitHub Access Tokens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="github-name" className="text-gray-300">Token Name</Label>
                  <Input
                    id="github-name"
                    placeholder="e.g., Personal Access Token"
                    value={newToken.provider === 'github' ? newToken.name : ''}
                    onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value, provider: 'github' }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="github-token" className="text-gray-300">Access Token</Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={newToken.provider === 'github' ? newToken.value : ''}
                    onChange={(e) => setNewToken(prev => ({ ...prev, value: e.target.value, provider: 'github' }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={saveToken}
                    disabled={newToken.provider !== 'github'}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Token
                  </Button>
                </div>
              </div>
            </div>
            {renderTokenList(githubTokens, 'github')}
          </TabsContent>

          <TabsContent value="netlify" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe size={20} />
                Netlify Access Tokens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="netlify-name" className="text-gray-300">Token Name</Label>
                  <Input
                    id="netlify-name"
                    placeholder="e.g., Deployment Token"
                    value={newToken.provider === 'netlify' ? newToken.name : ''}
                    onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value, provider: 'netlify' }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="netlify-token" className="text-gray-300">Access Token</Label>
                  <Input
                    id="netlify-token"
                    type="password"
                    placeholder="nfp_xxxxxxxxxxxx"
                    value={newToken.provider === 'netlify' ? newToken.value : ''}
                    onChange={(e) => setNewToken(prev => ({ ...prev, value: e.target.value, provider: 'netlify' }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={saveToken}
                    disabled={newToken.provider !== 'netlify'}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Token
                  </Button>
                </div>
              </div>
            </div>
            {renderTokenList(netlifyTokens, 'netlify')}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="font-medium text-blue-400 mb-2">💡 Token Setup Instructions</h4>
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>GitHub:</strong> Create a Personal Access Token with repo and workflow permissions</p>
            <p><strong>Netlify:</strong> Generate a Personal Access Token from your Netlify account settings</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeploymentSettings;
