
import { useState, useCallback, useEffect } from 'react';
import { useGitHubIntegration } from './useGitHubIntegration';
import { useToast } from '@/hooks/use-toast';

interface GitHubSyncOptions {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  batchChanges: boolean;
}

export const useEnhancedGitHubSync = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, any>>(new Map());
  const { updateGitHubRepo, createGitHubRepo } = useGitHubIntegration();
  const { toast } = useToast();

  const syncProjectFiles = useCallback(async (
    repoUrl: string,
    files: Record<string, string>,
    commitMessage?: string
  ) => {
    setSyncStatus('syncing');
    
    try {
      console.log('🔄 Syncing project files to GitHub...');
      
      const fileChanges = Object.entries(files).map(([path, content]) => ({
        path,
        content,
        action: 'update' as const
      }));

      await updateGitHubRepo(repoUrl, fileChanges);
      
      setSyncStatus('success');
      setLastSync(new Date());
      setPendingChanges(new Map());
      
      console.log('✅ GitHub sync completed');
      
      toast({
        title: "GitHub Sync Complete",
        description: `${fileChanges.length} files synced successfully`,
      });

    } catch (error) {
      console.error('❌ GitHub sync error:', error);
      setSyncStatus('error');
      
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Failed to sync to GitHub",
        variant: "destructive"
      });
    }
  }, [updateGitHubRepo, toast]);

  const loadProjectFromGitHub = useCallback(async (repoUrl: string) => {
    setSyncStatus('syncing');
    
    try {
      console.log('📥 Loading project from GitHub...');
      
      // Extract repo info from URL
      const urlParts = repoUrl.replace('https://github.com/', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];
      
      // Fetch files from GitHub API
      const files = await fetchRepositoryFiles(owner, repo);
      
      setSyncStatus('success');
      setLastSync(new Date());
      
      console.log('✅ Project loaded from GitHub');
      
      return files;
      
    } catch (error) {
      console.error('❌ Error loading from GitHub:', error);
      setSyncStatus('error');
      
      toast({
        title: "Load Error",
        description: "Failed to load project from GitHub",
        variant: "destructive"
      });
      
      return null;
    }
  }, [toast]);

  const queueChange = useCallback((filePath: string, content: string) => {
    setPendingChanges(prev => new Map(prev).set(filePath, content));
  }, []);

  const syncPendingChanges = useCallback(async (repoUrl: string) => {
    if (pendingChanges.size === 0) return;
    
    const files = Object.fromEntries(pendingChanges);
    await syncProjectFiles(repoUrl, files, `AI Updates: ${pendingChanges.size} files modified`);
  }, [pendingChanges, syncProjectFiles]);

  // Auto-sync functionality
  useEffect(() => {
    const autoSyncInterval = setInterval(() => {
      if (pendingChanges.size > 0) {
        console.log('🔄 Auto-sync triggered for pending changes');
        // Auto-sync would be triggered here if repoUrl is available
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(autoSyncInterval);
  }, [pendingChanges.size]);

  return {
    syncStatus,
    lastSync,
    pendingChanges: pendingChanges.size,
    syncProjectFiles,
    loadProjectFromGitHub,
    queueChange,
    syncPendingChanges
  };
};

// Helper function to fetch repository files
const fetchRepositoryFiles = async (owner: string, repo: string): Promise<Record<string, string> | null> => {
  try {
    // This would use GitHub API to fetch files
    // For now, return null to indicate no files loaded
    console.log(`📁 Fetching files from ${owner}/${repo}`);
    return null;
  } catch (error) {
    console.error('❌ Error fetching repository files:', error);
    return null;
  }
};
