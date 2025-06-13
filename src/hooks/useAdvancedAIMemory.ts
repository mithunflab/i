
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AIMemoryEntry {
  id: string;
  projectId: string;
  component: string;
  userRequest: string;
  beforeCode: string;
  afterCode: string;
  timestamp: Date;
  success: boolean;
}

interface ProjectContext {
  designPrinciples: string[];
  currentStructure: {
    components: any[];
    styling: { colors: any[] };
    layout: string;
  };
  recentChanges: AIMemoryEntry[];
}

export const useAdvancedAIMemory = (projectId: string) => {
  const [memory, setMemory] = useState<AIMemoryEntry[]>([]);
  const [context, setContext] = useState<ProjectContext>({
    designPrinciples: [],
    currentStructure: { components: [], styling: { colors: [] }, layout: 'default' },
    recentChanges: []
  });
  const { user } = useAuth();

  const loadProjectMemory = useCallback(async () => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('ai_edit_history')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading AI memory:', error);
        return;
      }

      const memoryEntries: AIMemoryEntry[] = data?.map(entry => ({
        id: entry.id,
        projectId: entry.project_id,
        component: entry.component,
        userRequest: entry.user_request,
        beforeCode: entry.before_code || '',
        afterCode: entry.after_code || '',
        timestamp: new Date(entry.created_at),
        success: entry.success || false
      })) || [];

      setMemory(memoryEntries);
      setContext(prev => ({
        ...prev,
        recentChanges: memoryEntries.slice(0, 10)
      }));

    } catch (error) {
      console.error('Failed to load project memory:', error);
    }
  }, [user, projectId]);

  const saveChange = useCallback(async (
    component: string,
    userRequest: string,
    beforeCode: string,
    afterCode: string,
    success: boolean = true
  ) => {
    if (!user || !projectId) return;

    try {
      const { data, error } = await supabase
        .from('ai_edit_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          component,
          user_request: userRequest,
          before_code: beforeCode,
          after_code: afterCode,
          success,
          metadata: {
            timestamp: new Date().toISOString(),
            component_type: component.includes('button') ? 'button' : 'content'
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving change to memory:', error);
        return;
      }

      // Update local memory
      const newEntry: AIMemoryEntry = {
        id: data.id,
        projectId,
        component,
        userRequest,
        beforeCode,
        afterCode,
        timestamp: new Date(),
        success
      };

      setMemory(prev => [newEntry, ...prev]);
      setContext(prev => ({
        ...prev,
        recentChanges: [newEntry, ...prev.recentChanges].slice(0, 10)
      }));

    } catch (error) {
      console.error('Failed to save change to memory:', error);
    }
  }, [user, projectId]);

  const generateContextualPrompt = useCallback((
    userRequest: string,
    channelData: any,
    currentCode: string
  ) => {
    const recentChanges = context.recentChanges.slice(0, 5);
    const designPrinciples = context.designPrinciples;

    return `
# 🧠 AI MEMORY-ENHANCED COMPONENT EDITING

## CONTEXT FROM PROJECT MEMORY
${recentChanges.length > 0 ? `
**Recent Changes Made:**
${recentChanges.map(change => 
  `• ${change.component}: "${change.userRequest}" (${change.success ? '✅' : '❌'})`
).join('\n')}
` : ''}

## CURRENT REQUEST
**User Request**: "${userRequest}"

## PROJECT CONTEXT
**Channel**: ${channelData?.title || 'YouTube Channel'}
**Design Principles**: ${designPrinciples.join(', ') || 'YouTube branding, responsive design'}

## COMPONENT STRUCTURE
${context.currentStructure.components.length > 0 ? 
  `**Available Components**: ${context.currentStructure.components.map(c => c.id || c.type).join(', ')}` : 
  '**Components**: Auto-detected from HTML structure'
}

## MEMORY-GUIDED INSTRUCTIONS
1. **Learn from recent changes** - Build upon successful patterns
2. **Avoid repeating failed approaches** - Check memory for what didn't work
3. **Maintain design consistency** - Follow established principles
4. **Target specific components** - Use component-level precision
5. **Preserve working elements** - Don't break successful previous edits

## CURRENT CODE TO MODIFY
\`\`\`html
${currentCode.substring(0, 1000)}...
\`\`\`

**Generate targeted component-level changes that build upon project memory and maintain consistency.**
`;
  }, [context]);

  useEffect(() => {
    loadProjectMemory();
  }, [loadProjectMemory]);

  return {
    memory,
    context,
    saveChange,
    generateContextualPrompt,
    loadProjectMemory
  };
};
