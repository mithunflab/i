import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Key, Save, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const YouTubeApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use ref to track channel subscription
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadApiKey();
      setupRealTimeUpdates();
    } else {
      setLoadingData(false);
    }
    
    // Cleanup function
    return () => {
      cleanupRealTimeUpdates();
    };
  }, [user?.id]);

  const cleanupRealTimeUpdates = () => {
    if (channelRef.current) {
      console.log('Cleaning up YouTube API real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupRealTimeUpdates = () => {
    // Clean up any existing subscription first
    cleanupRealTimeUpdates();
    
    if (!user?.id) return;
    
    console.log('Setting up real-time updates for YouTube API settings');
    
    channelRef.current = supabase
      .channel(`youtube-api-settings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `provider=eq.YouTube AND user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update for YouTube API key:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            if (payload.new && payload.new.user_id === user?.id) {
              setApiKey(payload.new.key_value || '');
              toast({
                title: "Real-time Update",
                description: "YouTube API key updated in real-time"
              });
            }
          }
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
  };

  const loadApiKey = async () => {
    if (!user?.id) {
      setLoadingData(false);
      return;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      console.error('Invalid user ID format:', user.id);
      setError('Invalid user session. Please sign out and sign in again.');
      setLoadingData(false);
      return;
    }
    
    try {
      console.log('Loading YouTube API key for user:', user.id);
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'YouTube')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading YouTube API key:', error);
        setError(`Failed to load API key: ${error.message}`);
      } else if (data && data.length > 0) {
        setApiKey(data[0].key_value || '');
        console.log('YouTube API key loaded successfully');
      } else {
        console.log('No existing YouTube API key found');
      }
    } catch (err) {
      console.error('Exception loading YouTube API key:', err);
      setError('Failed to load API key');
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

    if (!user?.id) {
      setError('User not authenticated');
      toast({
        title: "Error", 
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.id)) {
      setError('Invalid user session. Please sign out and sign in again.');
      toast({
        title: "Error",
        description: "Invalid user session. Please sign out and sign in again.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Saving YouTube API key for user:', user.id);
      
      // Check if a YouTube API key already exists
      const { data: existingKey, error: selectError } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'YouTube')
        .limit(1);

      if (selectError) {
        console.error('Error checking existing key:', selectError);
        setError(`Failed to check existing key: ${selectError.message}`);
        toast({
          title: "Error",
          description: `Failed to check existing key: ${selectError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (existingKey && existingKey.length > 0) {
        // Update existing key
        const { error } = await supabase
          .from('api_keys')
          .update({
            key_value: apiKey,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingKey[0].id);

        if (error) {
          console.error('Error updating YouTube API key:', error);
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
          console.log('YouTube API key updated successfully');
        }
      } else {
        // Insert new key
        const { error } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            name: 'YouTube Data API v3',
            key_value: apiKey,
            provider: 'YouTube',
            is_active: true
          });

        if (error) {
          console.error('Error inserting YouTube API key:', error);
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
          console.log('YouTube API key saved successfully');
        }
      }
    } catch (err) {
      console.error('Exception saving YouTube API key:', err);
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
            <div className="ml-auto flex items-center gap-2">
              <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
              <span className="text-xs text-gray-400">
                {isConnected ? 'Real-time Connected' : 'Disconnected'}
              </span>
            </div>
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
