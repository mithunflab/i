
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Github, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const DeploymentSettings = () => {
  const [netlifyToken, setNetlifyToken] = useState('');
  const [githubClientId, setGithubClientId] = useState('');
  const [githubClientSecret, setGithubClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_data')
        .eq('event_type', 'deployment_settings')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.event_data) {
        const settings = data.event_data as any;
        setNetlifyToken(settings.netlify_token || '');
        setGithubClientId(settings.github_client_id || '');
        setGithubClientSecret(settings.github_client_secret || '');
      }
    } catch (err) {
      console.log('No existing deployment settings found');
    }
  };

  const saveSettings = async () => {
    if (!netlifyToken.trim() || !githubClientId.trim() || !githubClientSecret.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: user?.id,
          event_type: 'deployment_settings',
          event_data: {
            netlify_token: netlifyToken,
            github_client_id: githubClientId,
            github_client_secret: githubClientSecret,
            updated_at: new Date().toISOString()
          }
        });

      if (error) {
        setError('Failed to save deployment settings');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Failed to save deployment settings');
    } finally {
      setIsLoading(false);
    }
  };

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
              GitHub OAuth Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github-client-id" className="text-white">
                  GitHub Client ID
                </Label>
                <Input
                  id="github-client-id"
                  type="text"
                  placeholder="GitHub Client ID"
                  value={githubClientId}
                  onChange={(e) => setGithubClientId(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github-client-secret" className="text-white">
                  GitHub Client Secret
                </Label>
                <Input
                  id="github-client-secret"
                  type="password"
                  placeholder="GitHub Client Secret"
                  value={githubClientSecret}
                  onChange={(e) => setGithubClientSecret(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Create a GitHub OAuth App at{' '}
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
