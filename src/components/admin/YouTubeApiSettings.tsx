
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Key, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const YouTubeApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadApiKey();
  }, []);

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('event_data')
        .eq('event_type', 'youtube_api_key')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && data.event_data) {
        setApiKey((data.event_data as any).api_key || '');
      }
    } catch (err) {
      console.log('No existing API key found');
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter a valid YouTube API key');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase
        .from('analytics')
        .insert({
          user_id: user?.id,
          event_type: 'youtube_api_key',
          event_data: {
            api_key: apiKey,
            updated_at: new Date().toISOString()
          }
        });

      if (error) {
        setError('Failed to save API key');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

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
