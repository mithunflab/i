
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
      const { data, error } = await supabase
        .from('project_memory')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading memory:', error);
        return;
      }

      if (data) {
        setMemory({
          id: data.id,
          components: data.components || {},
          designTokens: data.design_tokens || {
            primaryColor: '#000000',
            secondaryColor: '#666666',
            fontFamily: 'Arial, sans-serif',
            spacing: '16px'
          },
          chatHistory: data.chat_history || [],
          lastUpdated: new Date(data.updated_at)
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
      await supabase
        .from('project_memory')
        .upsert({
          project_id: projectId,
          components: updatedMemory.components,
          design_tokens: updatedMemory.designTokens,
          chat_history: updatedMemory.chatHistory,
          updated_at: new Date().toISOString()
        });
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
  }, [memory, updateMemory]);

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
