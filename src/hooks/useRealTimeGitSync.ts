
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const channelRef = useRef<any>(null);

  const updateSyncStatus = async (status: Partial<GitSyncStatus>) => {
    if (!user || !projectId) return;

    try {
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

      if (error) {
        console.error('Error updating sync status:', error);
        return;
      }

      setSyncStatus({
        id: data.id,
        projectId: data.project_id,
        syncStatus: data.sync_status as GitSyncStatus['syncStatus'],
        lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
        errorMessage: data.error_message,
        filesSynced: data.files_synced,
        commitHash: data.commit_hash
      });
    } catch (error) {
      console.error('Error in updateSyncStatus:', error);
    }
  };

  const checkGitConnection = async () => {
    if (!projectId) return;

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('github_url')
        .eq('id', projectId)
        .single();

      setIsConnected(!!project?.github_url);
    } catch (error) {
      console.error('Error checking git connection:', error);
      setIsConnected(false);
    }
  };

  const syncToGit = async (files: Record<string, string>, commitMessage?: string) => {
    if (!projectId || !user) return;

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

      await updateSyncStatus({
        syncStatus: 'success',
        filesSynced: Object.keys(files).length,
        commitHash: data?.commitHash
      });

      return data;
    } catch (error) {
      console.error('Error syncing to git:', error);
      await updateSyncStatus({
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown sync error'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (projectId && user) {
      checkGitConnection();
      
      // Clean up any existing channel first
      if (channelRef.current) {
        console.log('Cleaning up existing git sync channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Create new unique channel
      const channelName = `git-sync-changes-${projectId}-${Date.now()}`;
      console.log('Setting up git sync channel:', channelName);
      
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
            if (payload.new && typeof payload.new === 'object') {
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
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up git sync channel on unmount');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [projectId, user?.id]);

  return {
    syncStatus,
    isConnected,
    updateSyncStatus,
    syncToGit,
    checkGitConnection
  };
};
