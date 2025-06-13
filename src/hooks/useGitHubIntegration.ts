
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GitHubStatus {
  connected: boolean;
  repoUrl: string | null;
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'error' | 'success';
}

export const useGitHubIntegration = () => {
  const [gitStatus, setGitStatus] = useState<GitHubStatus>({
    connected: false,
    repoUrl: null,
    lastSync: null,
    syncStatus: 'idle'
  });
  const { toast } = useToast();

  const checkGitHubConnection = useCallback(async () => {
    try {
      const { data: gitKeys } = await supabase
        .from('github_api_keys')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (gitKeys) {
        setGitStatus(prev => ({
          ...prev,
          connected: true,
          repoUrl: gitKeys.api_token ? 'connected' : null
        }));
      }
    } catch (error) {
      console.error('Error checking GitHub connection:', error);
      setGitStatus(prev => ({
        ...prev,
        connected: false
      }));
    }
  }, []);

  const syncToGitHub = useCallback(async (files: Record<string, string>) => {
    setGitStatus(prev => ({ ...prev, syncStatus: 'syncing' }));
    
    try {
      const { data, error } = await supabase.functions.invoke('sync-github', {
        body: { files }
      });

      if (error) throw error;

      setGitStatus(prev => ({
        ...prev,
        syncStatus: 'success',
        lastSync: new Date(),
        repoUrl: data?.repoUrl || prev.repoUrl
      }));

      toast({
        title: "GitHub Sync Success",
        description: "Files synced to GitHub repository",
      });

    } catch (error) {
      console.error('GitHub sync error:', error);
      setGitStatus(prev => ({ ...prev, syncStatus: 'error' }));
      
      toast({
        title: "GitHub Sync Failed",
        description: "Failed to sync files to GitHub",
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    checkGitHubConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkGitHubConnection, 30000);
    return () => clearInterval(interval);
  }, [checkGitHubConnection]);

  return {
    gitStatus,
    syncToGitHub,
    checkGitHubConnection
  };
};
