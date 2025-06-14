
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, retrySupabaseRequest } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GitSyncStatus {
  id?: string;
  projectId: string;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncAt?: Date;
  errorMessage?: string;
  filesSynced: number;
  commitHash?: string;
}

interface GitSyncPayload {
  id: string;
  project_id: string;
  sync_status: string;
  last_sync_at?: string;
  error_message?: string;
  files_synced: number;
  commit_hash?: string;
}

export const useRealTimeGitSync = (projectId?: string) => {
  const [syncStatus, setSyncStatus] = useState<GitSyncStatus>({
    projectId: projectId || '',
    syncStatus: 'idle',
    filesSynced: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const { user, connectionStatus } = useAuth();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up git sync channel');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error removing channel:', error);
      }
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const updateSyncStatus = async (status: Partial<GitSyncStatus>) => {
    if (!user || !projectId || !mountedRef.current) return;

    try {
      const updateRequest = async () => {
        const updateData = {
          user_id: user.id,
          project_id: projectId,
          sync_status: status.syncStatus || 'idle',
          files_synced: status.filesSynced || 0,
          error_message: status.errorMessage,
          commit_hash: status.commitHash,
          last_sync_at: status.syncStatus === 'success' ? new Date().toISOString() : undefined
        };

        const { data, error } = await supabase
          .from('git_sync_status')
          .upsert(updateData, {
            onConflict: 'user_id,project_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      };

      const data = await retrySupabaseRequest(updateRequest);

      if (data && mountedRef.current) {
        setSyncStatus({
          id: data.id,
          projectId: data.project_id,
          syncStatus: data.sync_status as GitSyncStatus['syncStatus'],
          lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
          errorMessage: data.error_message,
          filesSynced: data.files_synced,
          commitHash: data.commit_hash
        });
      }
    } catch (error) {
      console.error('Error in updateSyncStatus:', error);
    }
  };

  const checkGitConnection = async () => {
    if (!projectId || !mountedRef.current) return;

    try {
      const connectionRequest = async () => {
        const { data: project, error } = await supabase
          .from('projects')
          .select('github_url')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        return project;
      };

      const project = await retrySupabaseRequest(connectionRequest);
      
      if (mountedRef.current) {
        setIsConnected(!!project?.github_url);
      }
    } catch (error) {
      console.error('Error checking git connection:', error);
      if (mountedRef.current) {
        setIsConnected(false);
      }
    }
  };

  const syncToGit = async (files: Record<string, string>, commitMessage?: string) => {
    if (!projectId || !user || !mountedRef.current) return;

    await updateSyncStatus({ syncStatus: 'syncing', filesSynced: 0 });

    try {
      const { data, error } = await supabase.functions.invoke('sync-to-github', {
        body: {
          projectId,
          files,
          commitMessage: commitMessage || `Auto-sync: ${Object.keys(files).length} files updated`
        }
      });

      if (error) throw error;

      if (mountedRef.current) {
        await updateSyncStatus({
          syncStatus: 'success',
          filesSynced: Object.keys(files).length,
          commitHash: data?.commitHash
        });
      }

      return data;
    } catch (error) {
      console.error('Error syncing to git:', error);
      if (mountedRef.current) {
        await updateSyncStatus({
          syncStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown sync error'
        });
      }
      throw error;
    }
  };

  const setupRealTimeUpdates = useCallback(() => {
    if (!projectId || !user || !mountedRef.current || connectionStatus === 'disconnected') {
      return;
    }

    cleanupChannel();
    
    const channelName = `git-sync-${projectId}-${user.id}-${Date.now()}`;
    console.log('Setting up git sync channel:', channelName);
    
    try {
      channelRef.current = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'git_sync_status',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Git sync status changed:', payload);
            if (payload.new && typeof payload.new === 'object' && mountedRef.current) {
              const newData = payload.new as GitSyncPayload;
              setSyncStatus({
                id: newData.id,
                projectId: newData.project_id,
                syncStatus: newData.sync_status as GitSyncStatus['syncStatus'],
                lastSyncAt: newData.last_sync_at ? new Date(newData.last_sync_at) : undefined,
                errorMessage: newData.error_message,
                filesSynced: newData.files_synced,
                commitHash: newData.commit_hash
              });
            }
          }
        )
        .subscribe((status) => {
          console.log('Git sync subscription status:', status);
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
      console.error('Error setting up real-time git sync:', error);
    }
  }, [projectId, user?.id, connectionStatus, cleanupChannel]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (projectId && user && connectionStatus === 'connected') {
      checkGitConnection();
      setupRealTimeUpdates();
    }

    return () => {
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [projectId, user?.id, connectionStatus, setupRealTimeUpdates]);

  return {
    syncStatus,
    isConnected,
    updateSyncStatus,
    syncToGit,
    checkGitConnection
  };
};
