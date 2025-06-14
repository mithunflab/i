
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Key, Save, AlertCircle, CheckCircle, Wifi } from 'lucide-react';
import { supabase, retrySupabaseRequest } from '@/integrations/supabase/client';
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
  const [existingKeys, setExistingKeys] = useState<any[]>([]);
  const { user, connectionStatus } = useAuth();
  const { toast } = useToast();
  
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const cleanupRealTimeUpdates = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up YouTube API real-time subscription');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error removing YouTube API channel:', error);
      }
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const loadApiKeys = async () => {
    if (!user?.id || !mountedRef.current) {
      setLoadingData(false);
      return;
    }
    
    try {
      console.log('Loading YouTube API keys for user:', user.id);
      
      const allKeys = await apiKeyManager.getAllProviderKeys();
      const youtubeKeys = allKeys.youtube || [];
      
      console.log('YouTube API keys loaded from manager:', youtubeKeys);
      
      if (mountedRef.current) {
        setExistingKeys(youtubeKeys);
        
        const activeKey = youtubeKeys.find(key => key.is_active);
        if (activeKey) {
          setApiKey(activeKey.api_key || '');
          setApiKeyName(activeKey.name || '');
        }
        
        setError('');
      }
    } catch (err) {
      console.error('Exception loading YouTube API keys:', err);
      if (mountedRef.current) {
        setError('Failed to load API keys');
        toast({
          title: "Error",
          description: "Failed to load API keys",
          variant: "destructive"
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoadingData(false);
      }
    }
  };

  const setupRealTimeUpdates = useCallback(() => {
    if (!user?.id || connectionStatus !== 'connected' || !mountedRef.current) {
      return;
    }

    cleanupRealTimeUpdates();
    
    console.log('Setting up real-time updates for YouTube API settings');
    
    const channelName = `youtube-api-settings-${user.id}-${Date.now()}`;
    
    try {
      channelRef.current = supabase
        .channel(channelName)
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
            if (mountedRef.current) {
              loadApiKeys();
              toast({
                title: "Real-time Update",
                description: "YouTube API keys updated in real-time"
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('YouTube API real-time subscription status:', status);
          if (status === 'CHANNEL_ERROR' && mountedRef.current) {
            // Retry connection after delay
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setupRealTimeUpdates();
              }
            }, 5000);
          }
        });
    } catch (error) {
      console.error('Error setting up YouTube API real-time updates:', error);
    }
  }, [user?.id, connectionStatus, toast, loadApiKeys, cleanupRealTimeUpdates]);

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
      
      const saveRequest = async () => {
        if (existingKeys.length > 0) {
          await supabase
            .from('youtube_api_keys')
            .update({ is_active: false })
            .eq('user_id', user.id);
        }
        
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

        if (error) throw error;
      };

      await retrySupabaseRequest(saveRequest);

      if (mountedRef.current) {
        setSaved(true);
        setApiKey('');
        setApiKeyName('');
        toast({
          title: "Success",
          description: "YouTube API key saved successfully"
        });
        setTimeout(() => {
          if (mountedRef.current) {
            setSaved(false);
          }
        }, 3000);
        console.log('YouTube API key saved successfully');
      }
    } catch (err: any) {
      console.error('Exception saving YouTube API key:', err);
      if (mountedRef.current) {
        setError(`Failed to save API key: ${err.message}`);
        toast({
          title: "Error",
          description: `Failed to save API key: ${err.message}`,
          variant: "destructive"
        });
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const deleteApiKey = async (keyId: string) => {
    try {
      const deleteRequest = async () => {
        const { error } = await supabase
          .from('youtube_api_keys')
          .delete()
          .eq('id', keyId);

        if (error) throw error;
      };

      await retrySupabaseRequest(deleteRequest);

      if (mountedRef.current) {
        toast({
          title: "Success",
          description: "YouTube API key deleted successfully"
        });
      }
    } catch (err: any) {
      console.error('Exception deleting YouTube API key:', err);
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: `Failed to delete API key: ${err.message}`,
          variant: "destructive"
        });
      }
    }
  };

  const toggleKeyStatus = async (keyId: string, currentStatus: boolean) => {
    try {
      const toggleRequest = async () => {
        const { error } = await supabase
          .from('youtube_api_keys')
          .update({ is_active: !currentStatus })
          .eq('id', keyId);

        if (error) throw error;
      };

      await retrySupabaseRequest(toggleRequest);

      if (mountedRef.current) {
        toast({
          title: "Success",
          description: `API key ${!currentStatus ? 'activated' : 'deactivated'} successfully`
        });
      }
    } catch (err: any) {
      console.error('Exception updating YouTube API key status:', err);
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: `Failed to update API key status: ${err.message}`,
          variant: "destructive"
        });
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (user?.id && connectionStatus === 'connected') {
      loadApiKeys();
      setupRealTimeUpdates();
    } else {
      setLoadingData(false);
    }
    
    return () => {
      mountedRef.current = false;
      cleanupRealTimeUpdates();
    };
  }, [user?.id, connectionStatus, setupRealTimeUpdates]);

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
              <Wifi className={`h-4 w-4 ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'reconnecting' ? 'text-yellow-400' : 'text-red-400'}`} />
              <span className="text-xs text-gray-400">
                {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Disconnected'}
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
            disabled={isLoading || connectionStatus !== 'connected'}
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
                    disabled={connectionStatus !== 'connected'}
                  >
                    {key.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteApiKey(key.id)}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    disabled={connectionStatus !== 'connected'}
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
