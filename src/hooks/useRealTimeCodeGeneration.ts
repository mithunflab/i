import { useState, useCallback, useRef } from 'react';
import { useFileManager } from './useFileManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CodeGenerationOptions {
  streaming: boolean;
  preserveDesign: boolean;
  targetedChanges: boolean;
}

export const useRealTimeCodeGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const { files, updateFile, appendToChatHistory } = useFileManager();
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateCodeWithAI = useCallback(async (
    userRequest: string,
    channelData: any,
    projectId: string,
    options: CodeGenerationOptions = {
      streaming: true,
      preserveDesign: true,
      targetedChanges: true
    }
  ) => {
    setIsGenerating(true);
    setStreamingContent('');
    
    // Abort any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();

    try {
      console.log('🤖 Starting real-time AI code generation...');
      
      // Log chat history
      appendToChatHistory(userRequest, 'user');

      // Get OpenRouter API key from Supabase table
      const { data: openRouterKeys, error: keyError } = await supabase
        .from('openrouter_api_keys')
        .select('api_key')
        .eq('is_active', true)
        .limit(1);

      if (keyError || !openRouterKeys || openRouterKeys.length === 0) {
        throw new Error('OpenRouter API key not available');
      }

      const openRouterApiKey = openRouterKeys[0].api_key;

      // Parse intent using AI workflow - Fixed optional chaining issue
      const IntentParserClass = (window as any).IntentParser;
      let intentParser = null;
      let parsedIntent = null;
      
      if (IntentParserClass) {
        intentParser = new IntentParserClass();
        parsedIntent = intentParser.parseIntent(userRequest);
      }

      console.log('🎯 Parsed Intent:', parsedIntent);

      // Prepare AI context with current files
      const context = {
        currentHTML: files['index.html'] || '',
        currentCSS: files['styles.css'] || '',
        currentJS: files['scripts.js'] || '',
        componentMap: files['componentMap.json'] || '{}',
        designSystem: files['design.json'] || '{}',
        chatHistory: files['chatHistory.txt'] || '',
        channelData,
        parsedIntent,
        preserveDesign: options.preserveDesign,
        targetedChanges: options.targetedChanges
      };

      // Direct OpenRouter API call instead of edge function
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'YouTube Website Builder'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            {
              role: 'system',
              content: `You are a professional web developer creating YouTube channel websites. 
              
Channel Info: ${JSON.stringify(channelData)}
Current Code: ${context.currentHTML}
User Request: ${userRequest}

Generate professional HTML code that ${options.preserveDesign ? 'preserves the existing design and' : ''} implements the user's request. Include real YouTube videos and channel data.`
            },
            {
              role: 'user',
              content: userRequest
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedCode = data.choices?.[0]?.message?.content || '';

      console.log('✅ AI generation completed');

      // Apply changes using AI Editor - Fixed optional chaining issue
      let finalCode = generatedCode;
      
      const AIEditorClass = (window as any).AIEditor;
      if (parsedIntent && AIEditorClass) {
        const aiEditor = new AIEditorClass();
        finalCode = aiEditor.applyEdit(parsedIntent, finalCode);
        console.log('🎯 Targeted edit applied');
      }

      // Update files
      await updateFile('index.html', finalCode);

      // Update component map
      const updatedComponentMap = {
        components: extractComponents(finalCode),
        relationships: analyzeComponentRelationships(finalCode),
        lastUpdated: new Date().toISOString(),
        lastChange: {
          userRequest,
          intent: parsedIntent,
          timestamp: new Date().toISOString()
        }
      };
      
      await updateFile('componentMap.json', JSON.stringify(updatedComponentMap, null, 2));

      // Log to chat history
      appendToChatHistory('Changes applied successfully', 'assistant');

      setGeneratedCode(finalCode);
      
      toast({
        title: "🎯 AI Changes Applied",
        description: "Your targeted modifications have been implemented while preserving the existing design.",
      });

      return {
        code: finalCode,
        reply: 'Changes applied successfully',
        changes: updatedComponentMap.lastChange
      };

    } catch (error) {
      console.error('❌ Real-time generation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      appendToChatHistory(`Error: ${errorMessage}`, 'assistant');
      
      toast({
        title: "Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [files, updateFile, appendToChatHistory, toast]);

  const streamCode = useCallback(async (prompt: string, onChunk: (chunk: string) => void) => {
    // Simulate streaming for now - in real implementation this would connect to streaming endpoint
    const response = await generateCodeWithAI(prompt, null, '', { streaming: true, preserveDesign: true, targetedChanges: true });
    
    if (response?.code) {
      // Simulate streaming by chunks
      const chunks = response.code.match(/.{1,50}/g) || [];
      
      for (const chunk of chunks) {
        onChunk(chunk);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }, [generateCodeWithAI]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      console.log('🛑 Code generation stopped');
    }
  }, []);

  return {
    isGenerating,
    generatedCode,
    streamingContent,
    generateCodeWithAI,
    streamCode,
    stopGeneration
  };
};

// Helper functions
const extractComponents = (html: string): string[] => {
  const components = [];
  const classMatches = html.match(/class="([^"]+)"/g) || [];
  
  classMatches.forEach(match => {
    const classes = match.match(/"([^"]+)"/)?.[1].split(' ') || [];
    components.push(...classes);
  });
  
  return [...new Set(components)].filter(c => c.length > 0);
};

const analyzeComponentRelationships = (html: string): Record<string, string[]> => {
  const relationships: Record<string, string[]> = {};
  
  // Simple relationship analysis - in real implementation this would be more sophisticated
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  doc.querySelectorAll('[class]').forEach(element => {
    const classes = element.className.split(' ');
    const parent = element.parentElement;
    
    if (parent && parent.className) {
      const parentClasses = parent.className.split(' ');
      classes.forEach(cls => {
        if (!relationships[cls]) relationships[cls] = [];
        relationships[cls].push(...parentClasses);
      });
    }
  });
  
  return relationships;
};
