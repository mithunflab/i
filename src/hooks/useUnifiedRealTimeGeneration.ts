
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface GenerationOptions {
  autoSync?: boolean;
  preserveDesign?: boolean;
  createRepo?: boolean;
}

export const useUnifiedRealTimeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateAndSync = useCallback(async (
    userRequest: string,
    channelData: any,
    projectId: string,
    currentCode?: string,
    options: GenerationOptions = { autoSync: true, preserveDesign: true, createRepo: false }
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use AI generation",
        variant: "destructive"
      });
      return null;
    }

    setIsGenerating(true);
    console.log('🚀 Starting unified real-time generation and sync...');

    try {
      // Step 1: Generate code with AI
      console.log('🤖 Generating code with AI...');
      
      const { data: aiResult, error: aiError } = await supabase.functions.invoke('unified-ai-generation', {
        body: {
          userRequest,
          channelData,
          projectId,
          currentCode,
          preserveDesign: options.preserveDesign
        }
      });

      if (aiError) {
        throw new Error(`AI Generation failed: ${aiError.message}`);
      }

      if (!aiResult?.success || !aiResult?.generatedCode) {
        throw new Error('No code generated from AI');
      }

      const { generatedCode: newCode, reply, provider } = aiResult;
      setGeneratedCode(newCode);

      console.log(`✅ Code generated successfully with ${provider}`);

      toast({
        title: `🎯 Code Generated with ${provider}`,
        description: reply || 'Your website has been generated successfully!',
      });

      let syncResult = null;

      // Step 2: Auto-sync to GitHub if enabled
      if (options.autoSync) {
        setIsSyncing(true);
        console.log('🔄 Auto-syncing to GitHub...');

        try {
          const { data: githubResult, error: githubError } = await supabase.functions.invoke('unified-github-sync', {
            body: {
              projectId,
              files: {
                'index.html': newCode,
                'README.md': generateReadme(channelData, userRequest)
              },
              commitMessage: `AI Update: ${userRequest.substring(0, 50)}...`,
              createRepo: options.createRepo
            }
          });

          if (githubError) {
            console.error('GitHub sync failed:', githubError);
            toast({
              title: "Sync Warning",
              description: "Code generated but GitHub sync failed. Check your GitHub integration.",
              variant: "destructive"
            });
          } else if (githubResult?.success) {
            syncResult = githubResult;
            setLastSyncResult(syncResult);
            
            console.log('✅ GitHub sync completed successfully');
            
            toast({
              title: "🚀 Complete Success!",
              description: `Code generated and synced to GitHub. ${syncResult.syncedFiles} files updated.`,
            });
          }
        } catch (syncError) {
          console.error('GitHub sync error:', syncError);
          toast({
            title: "Sync Error",
            description: "Code generated but GitHub sync failed",
            variant: "destructive"
          });
        } finally {
          setIsSyncing(false);
        }
      }

      return {
        code: newCode,
        reply,
        provider,
        syncResult,
        success: true
      };

    } catch (error) {
      console.error('❌ Unified generation error:', error);
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    } finally {
      setIsGenerating(false);
      setIsSyncing(false);
    }
  }, [user, toast]);

  const syncToGitHub = useCallback(async (
    projectId: string,
    files: Record<string, string>,
    commitMessage?: string,
    createRepo?: boolean
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to sync to GitHub",
        variant: "destructive"
      });
      return null;
    }

    setIsSyncing(true);
    console.log('🔄 Manual GitHub sync started...');

    try {
      const { data: result, error } = await supabase.functions.invoke('unified-github-sync', {
        body: {
          projectId,
          files,
          commitMessage: commitMessage || 'Manual sync from Lovable',
          createRepo: createRepo || false
        }
      });

      if (error) {
        throw new Error(`GitHub sync failed: ${error.message}`);
      }

      if (!result?.success) {
        throw new Error('GitHub sync failed');
      }

      setLastSyncResult(result);
      
      toast({
        title: "🚀 GitHub Sync Complete",
        description: `${result.syncedFiles} files synced successfully`,
      });

      return result;

    } catch (error) {
      console.error('❌ GitHub sync error:', error);
      
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Unknown sync error",
        variant: "destructive"
      });

      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [user, toast]);

  return {
    isGenerating,
    isSyncing,
    generatedCode,
    lastSyncResult,
    generateAndSync,
    syncToGitHub
  };
};

function generateReadme(channelData: any, userRequest: string): string {
  const channelTitle = channelData?.title || 'AI Website';
  const description = channelData?.description || 'AI-generated website';
  
  return `# ${channelTitle}

${description}

## Latest Update
${userRequest}

## Features
- Responsive design
- Modern styling
- AI-generated content
- YouTube integration
- Real-time updates

## Generated with Lovable AI
This website was generated using advanced AI technology and automatically synced to GitHub.

Last updated: ${new Date().toISOString()}
`;
}
