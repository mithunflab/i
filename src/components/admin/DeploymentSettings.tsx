
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Github, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DeploymentSettings = () => {
  const [netlifyToken, setNetlifyToken] = useState('');
  const [githubClientId, setGithubClientId] = useState('');
  const [githubClientSecret, setGithubClientSecret] = useState('');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setLoadingData(false);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) {
      setLoadingData(false);
      return;
    }

    try {
      // Load all deployment-related tokens
      const { data: tokensData } = await supabase
        .from('api_keys')
        .select('key_value, name, provider')
        .eq('user_id', user.id)
        .in('provider', ['Netlify', 'GitHub']);

      if (tokensData && tokensData.length > 0) {
        tokensData.forEach(token => {
          if (token.provider === 'Netlify') {
            setNetlifyToken(token.key_value);
          } else if (token.provider === 'GitHub') {
            if (token.name?.includes('Client ID') || token.name?.includes('client_id')) {
              setGithubClientId(token.key_value);
            } else if (token.name?.includes('Client Secret') || token.name?.includes('client_secret')) {
              setGithubClientSecret(token.key_value);
            } else if (token.name?.includes('Access Token') || token.name?.includes('access_token')) {
              setGithubAccessToken(token.key_value);
            }
          }
        });
      }
    } catch (err) {
      console.log('No existing deployment settings found');
    } finally {
      setLoadingData(false);
    }
  };

  const saveSettings = async () => {
    if (!netlifyToken.trim() && !githubClientId.trim() && !githubClientSecret.trim() && !githubAccessToken.trim()) {
      setError('Please fill in at least one field');
      toast({
        title: "Error",
        description: "Please fill in at least one field",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      setError('User not authenticated');
      toast({
        title: "Error",
        description: "User not authenticated", 
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Save Netlify token if provided
      if (netlifyToken.trim()) {
        const { data: existingNetlify } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'Netlify')
          .single();

        if (existingNetlify) {
          await supabase
            .from('api_keys')
            .update({
              key_value: netlifyToken,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingNetlify.id);
        } else {
          await supabase
            .from('api_keys')
            .insert({
              user_id: user.id,
              name: 'Netlify Access Token',
              key_value: netlifyToken,
              provider: 'Netlify',
              is_active: true
            });
        }
      }

      // Save GitHub Client ID if provided
      if (githubClientId.trim()) {
        const { data: existingGithubId } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'GitHub')
          .like('name', '%Client ID%')
          .single();

        if (existingGithubId) {
          await supabase
            .from('api_keys')
            .update({
              key_value: githubClientId,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGithubId.id);
        } else {
          await supabase
            .from('api_keys')
            .insert({
              user_id: user.id,
              name: 'GitHub OAuth Client ID',
              key_value: githubClientId,
              provider: 'GitHub',
              is_active: true
            });
        }
      }

      // Save GitHub Client Secret if provided
      if (githubClientSecret.trim()) {
        const { data: existingGithubSecret } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'GitHub')
          .like('name', '%Client Secret%')
          .single();

        if (existingGithubSecret) {
          await supabase
            .from('api_keys')
            .update({
              key_value: githubClientSecret,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGithubSecret.id);
        } else {
          await supabase
            .from('api_keys')
            .insert({
              user_id: user.id,
              name: 'GitHub OAuth Client Secret',
              key_value: githubClientSecret,
              provider: 'GitHub',
              is_active: true
            });
        }
      }

      // Save GitHub Access Token if provided
      if (githubAccessToken.trim()) {
        const { data: existingGithubToken } = await supabase
          .from('api_keys')
          .select('id')
          .eq('user_id', user.id)
          .eq('provider', 'GitHub')
          .like('name', '%Access Token%')
          .single();

        if (existingGithubToken) {
          await supabase
            .from('api_keys')
            .update({
              key_value: githubAccessToken,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingGithubToken.id);
        } else {
          await supabase
            .from('api_keys')
            .insert({
              user_id: user.id,
              name: 'GitHub Access Token',
              key_value: githubAccessToken,
              provider: 'GitHub',
              is_active: true
            });
        }
      }

      setSaved(true);
      toast({
        title: "Success",
        description: "Deployment settings saved successfully"
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save deployment settings');
      toast({
        title: "Error",
        description: "Failed to save deployment settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
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
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Deployment Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="border-green-500 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Deployment settings saved successfully!</AlertDescription>
            </Alert>
          )}

          {/* Netlify Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Netlify Configuration
            </h3>
            <div className="space-y-2">
              <Label htmlFor="netlify-token" className="text-white">
                Netlify Access Token
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="netlify-token"
                  type="password"
                  placeholder="Enter your Netlify access token"
                  value={netlifyToken}
                  onChange={(e) => setNetlifyToken(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <p className="text-xs text-gray-400">
                Get your token from{' '}
                <a 
                  href="https://app.netlify.com/user/applications#personal-access-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Netlify User Settings
                </a>
              </p>
            </div>
          </div>

          {/* GitHub Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Github className="h-4 w-4" />
              GitHub Configuration
            </h3>
            
            {/* GitHub OAuth Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github-client-id" className="text-white">
                  GitHub Client ID (OAuth)
                </Label>
                <Input
                  id="github-client-id"
                  type="text"
                  placeholder="GitHub OAuth Client ID"
                  value={githubClientId}
                  onChange={(e) => setGithubClientId(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-client-secret" className="text-white">
                  GitHub Client Secret (OAuth)
                </Label>
                <Input
                  id="github-client-secret"
                  type="password"
                  placeholder="GitHub OAuth Client Secret"
                  value={githubClientSecret}
                  onChange={(e) => setGithubClientSecret(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* GitHub Access Token */}
            <div className="space-y-2">
              <Label htmlFor="github-access-token" className="text-white">
                GitHub Personal Access Token
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="github-access-token"
                  type="password"
                  placeholder="GitHub Personal Access Token"
                  value={githubAccessToken}
                  onChange={(e) => setGithubAccessToken(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <p className="text-xs text-gray-400">
                Create tokens at{' '}
                <a 
                  href="https://github.com/settings/tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  GitHub Personal Access Tokens
                </a>
                {' '}or OAuth apps at{' '}
                <a 
                  href="https://github.com/settings/applications/new" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  GitHub Developer Settings
                </a>
              </p>
            </div>
          </div>

          <Button 
            onClick={saveSettings} 
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Deployment Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentSettings;
