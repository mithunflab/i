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
import { apiKeyManager } from '@/utils/apiKeyManager';

const YouTubeApiSettings = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyName, setApiKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(true);
  const [existingKeys, setExistingKeys] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use ref to track channel subscription
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user?.id) {
      loadApiKeys();
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
          table: 'youtube_api_keys',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time update for YouTube API key:', payload);
          loadApiKeys();
          toast({
            title: "Real-time Update",
            description: "YouTube API keys updated in real-time"
          });
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
  };

  const loadApiKeys = async () => {
    if (!user?.id) {
      setLoadingData(false);
      return;
    }
    
    try {
      console.log('Loading YouTube API keys for user:', user.id);
      
      // Use the apiKeyManager to get YouTube keys
      const allKeys = await apiKeyManager.getAllKeys(user.id);
      const youtubeKeys = allKeys.youtube || [];
      
      console.log('YouTube API keys loaded from manager:', youtubeKeys);
      setExistingKeys(youtubeKeys);
      
      // Set the first active key as default
      const activeKey = youtubeKeys.find(key => key.is_active);
      if (activeKey) {
        setApiKey(activeKey.api_key || '');
        setApiKeyName(activeKey.name || '');
      }
      
      setError('');
    } catch (err) {
      console.error('Exception loading YouTube API keys:', err);
      setError('Failed to load API keys');
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive"
      });
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

    if (!apiKeyName.trim()) {
      setError('Please enter a name for this API key');
      toast({
        title: "Error",
        description: "Please enter a name for this API key",
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

    setIsLoading(true);
    setError('');

    try {
      console.log('Saving YouTube API key for user:', user.id);
      
      // Deactivate all existing keys first
      if (existingKeys.length > 0) {
        await supabase
          .from('youtube_api_keys')
          .update({ is_active: false })
          .eq('user_id', user.id);
      }
      
      // Insert new key into youtube_api_keys table
      const { error } = await supabase
        .from('youtube_api_keys')
        .insert({
          user_id: user.id,
          name: apiKeyName.trim(),
          api_key: apiKey.trim(),
          quota_used: 0,
          quota_limit: 10000,
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
        setApiKey('');
        setApiKeyName('');
        toast({
          title: "Success",
          description: "YouTube API key saved successfully"
        });
        setTimeout(() => setSaved(false), 3000);
        console.log('YouTube API key saved successfully');
        // The real-time subscription will trigger loadApiKeys automatically
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

  const deleteApiKey = async (keyId: string) => {
    try {
      const { error } = await supabase
        .from('youtube_api_keys')
        .delete()
        .eq('id', keyId);

      if (error) {
        console.error('Error deleting YouTube API key:', error);
        toast({
          title: "Error",
          description: `Failed to delete API key: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "YouTube API key deleted successfully"
        });
        // Real-time subscription will trigger loadApiKeys automatically
      }
    } catch (err) {
      console.error('Exception deleting YouTube API key:', err);
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive"
      });
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('youtube_api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', keyId);

      if (error) {
        console.error('Error updating YouTube API key status:', error);
        toast({
          title: "Error",
          description: `Failed to update API key status: ${error.message}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: `API key ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        });
        // Real-time subscription will trigger loadApiKeys automatically
      }
    } catch (err) {
      console.error('Exception updating YouTube API key status:', err);
      toast({
        title: "Error",
        description: "Failed to update API key status",
        variant: "destructive"
      });
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
      {/* Add New API Key */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            Add YouTube API Key
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
            <Label htmlFor="api-key-name" className="text-white">
              API Key Name
            </Label>
            <Input
              id="api-key-name"
              type="text"
              placeholder="e.g., Primary YouTube API Key"
              value={apiKeyName}
              onChange={(e) => setApiKeyName(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

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
            {isLoading ? 'Saving...' : 'Add API Key'}
          </Button>
        </CardContent>
      </Card>

      {/* Existing API Keys */}
      {existingKeys.length > 0 && (
        <Card className="bg-white/5 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              Your YouTube API Keys ({existingKeys.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{key.name}</h4>
                  <p className="text-xs text-gray-400">
                    Usage: {key.quota_used || 0} / {key.quota_limit || 10000} requests
                  </p>
                  <p className="text-xs text-gray-400">
                    Created: {new Date(key.created_at).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Status: {key.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleKeyStatus(key.id, key.is_active)}
                    className={key.is_active ? 'border-yellow-600 text-yellow-400' : 'border-green-600 text-green-400'}
                  >
                    {key.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteApiKey(key.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
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
