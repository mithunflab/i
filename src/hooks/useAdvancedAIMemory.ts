
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectMemory {
  id: string;
  components: Record<string, ComponentInfo>;
  designTokens: DesignTokens;
  chatHistory: ChatEntry[];
  lastUpdated: Date;
}

interface ComponentInfo {
  id: string;
  type: string;
  file: string;
  className?: string;
  lastModified: Date;
  changeHistory: ChangeEntry[];
}

interface DesignTokens {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  spacing: string;
}

interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  componentTarget?: string;
}

interface ChangeEntry {
  timestamp: Date;
  action: string;
  details: string;
  userRequest: string;
}

export const useAdvancedAIMemory = (projectId: string) => {
  const [memory, setMemory] = useState<ProjectMemory | null>(null);
  const [loading, setLoading] = useState(false);

  const loadMemory = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Load from project_chat_history and projects tables instead of non-existent project_memory
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError && projectError.code !== 'PGRST116') {
        console.error('Error loading project:', projectError);
        return;
      }

      const { data: chatHistory, error: chatError } = await supabase
        .from('project_chat_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (chatError) {
        console.error('Error loading chat history:', chatError);
      }

      if (project) {
        setMemory({
          id: project.id,
          components: project.channel_data?.components || {},
          designTokens: project.channel_data?.design_tokens || {
            primaryColor: '#000000',
            secondaryColor: '#666666',
            fontFamily: 'Arial, sans-serif',
            spacing: '16px'
          },
          chatHistory: (chatHistory || []).map(chat => ({
            id: chat.id,
            role: chat.message_type as 'user' | 'assistant',
            content: chat.content,
            timestamp: new Date(chat.created_at),
            componentTarget: chat.metadata?.component
          })),
          lastUpdated: new Date(project.updated_at)
        });
      }
    } catch (error) {
      console.error('Memory load error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const updateMemory = useCallback(async (updates: Partial<ProjectMemory>) => {
    if (!projectId || !memory) return;

    const updatedMemory = { ...memory, ...updates, lastUpdated: new Date() };
    setMemory(updatedMemory);

    try {
      // Store in projects table channel_data field
      await supabase
        .from('projects')
        .update({
          channel_data: {
            components: updatedMemory.components,
            design_tokens: updatedMemory.designTokens
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);
    } catch (error) {
      console.error('Memory update error:', error);
    }
  }, [projectId, memory]);

  const generateTargetedPrompt = useCallback((
    userRequest: string,
    channelData: any,
    currentCode: string
  ): string => {
    if (!memory) return userRequest;

    const relevantComponents = Object.values(memory.components).filter(comp =>
      userRequest.toLowerCase().includes(comp.type.toLowerCase()) ||
      userRequest.toLowerCase().includes(comp.id.toLowerCase())
    );

    return `
# Targeted Component Edit Request

## User Request
${userRequest}

## Relevant Components
${relevantComponents.map(comp => `- ${comp.type}: #${comp.id} (${comp.file})`).join('\n')}

## Design Context
- Primary Color: ${memory.designTokens.primaryColor}
- Font Family: ${memory.designTokens.fontFamily}
- Spacing: ${memory.designTokens.spacing}

## Channel Data
${channelData ? `Channel: ${channelData.title}, Subscribers: ${channelData.subscriberCount}` : 'No channel data'}

Please make targeted changes to the specified component while preserving the existing design system.
`;
  }, [memory]);

  const generateContextualPrompt = useCallback((
    userRequest: string,
    channelData: any,
    currentCode: string
  ): string => {
    return generateTargetedPrompt(userRequest, channelData, currentCode);
  }, [generateTargetedPrompt]);

  const saveChange = useCallback(async (
    componentId: string,
    userRequest: string,
    originalCode: string,
    modifiedCode: string
  ) => {
    if (!memory) return;

    const component = memory.components[componentId];
    if (!component) return;

    const changeEntry: ChangeEntry = {
      timestamp: new Date(),
      action: 'AI Edit',
      details: `Modified based on: ${userRequest}`,
      userRequest
    };

    const updatedComponent = {
      ...component,
      lastModified: new Date(),
      changeHistory: [...component.changeHistory, changeEntry]
    };

    await updateMemory({
      components: {
        ...memory.components,
        [componentId]: updatedComponent
      }
    });

    // Also save to chat history
    try {
      await supabase
        .from('project_chat_history')
        .insert({
          project_id: projectId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          message_type: 'assistant',
          content: `Applied changes to ${componentId}`,
          metadata: {
            component: componentId,
            action: 'AI Edit',
            userRequest
          }
        });
    } catch (error) {
      console.error('Error saving change to chat history:', error);
    }
  }, [memory, updateMemory, projectId]);

  const refreshMemory = useCallback(async () => {
    await loadMemory();
  }, [loadMemory]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  return {
    memory,
    loading,
    updateMemory,
    generateTargetedPrompt,
    generateContextualPrompt,
    saveChange,
    refreshMemory
  };
};
