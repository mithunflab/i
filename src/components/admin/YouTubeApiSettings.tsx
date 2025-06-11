
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const YouTubeApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadApiKey();
    } else {
      setLoadingData(false);
    }
  }, [user]);

  const loadApiKey = async () => {
    if (!user) {
      setLoadingData(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'YouTube')
        .eq('token_type', 'api')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setApiKey(data.token_value || '');
      }
    } catch (err) {
      console.log('No existing YouTube API key found');
    } finally {
      setLoadingData(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid YouTube API key');
      toast({
        title: "Error",
        description: "Please enter a valid YouTube API key",
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
      // First, check if a YouTube API key already exists
      const { data: existingKey } = await supabase
        .from('api_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'YouTube')
        .eq('token_type', 'api')
        .single();

      if (existingKey) {
        // Update existing key
        const { error } = await supabase
          .from('api_tokens')
          .update({
            token_value: apiKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKey.id);

        if (error) {
          console.error('Supabase error:', error);
          setError(`Failed to update API key: ${error.message}`);
          toast({
            title: "Error",
            description: `Failed to update API key: ${error.message}`,
            variant: "destructive"
          });
        } else {
          setSaved(true);
          toast({
            title: "Success",
            description: "YouTube API key updated successfully"
          });
          setTimeout(() => setSaved(false), 3000);
        }
      } else {
        // Insert new key
        const { error } = await supabase
          .from('api_tokens')
          .insert({
            user_id: user.id,
            name: 'YouTube Data API v3',
            token_value: apiKey,
            provider: 'YouTube',
            token_type: 'api',
            description: 'YouTube Data API v3 key for video processing',
            is_active: true
          });

        if (error) {
          console.error('Supabase error:', error);
          setError(`Failed to save API key: ${error.message}`);
          toast({
            title: "Error",
            description: `Failed to save API key: ${error.message}`,
            variant: "destructive"
          });
        } else {
          setSaved(true);
          toast({
            title: "Success",
            description: "YouTube API key saved successfully"
          });
          setTimeout(() => setSaved(false), 3000);
        }
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save API key');
      toast({
        title: "Error",
        description: "Failed to save API key",
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
            <span className="ml-2 text-white">Loading YouTube API settings...</span>
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
            <Youtube className="h-5 w-5 text-red-500" />
            YouTube API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="border-green-500 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>YouTube API key saved successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="youtube-api-key" className="text-white">
              YouTube Data API v3 Key
            </Label>
            <div className="relative">
              <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="youtube-api-key"
                type="password"
                placeholder="Enter your YouTube API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <p className="text-xs text-gray-400">
              Get your API key from the{' '}
              <a 
                href="https://console.developers.google.com/apis/credentials" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <Button 
            onClick={saveApiKey} 
            disabled={isLoading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save API Key'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">API Usage Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-2">
          <p>1. Go to Google Cloud Console</p>
          <p>2. Create a new project or select existing one</p>
          <p>3. Enable YouTube Data API v3</p>
          <p>4. Create credentials (API Key)</p>
          <p>5. Copy and paste the API key above</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default YouTubeApiSettings;
