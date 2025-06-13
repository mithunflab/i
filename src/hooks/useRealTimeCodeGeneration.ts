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

      // Parse intent using AI workflow - Fixed optional chaining issue
      const IntentParserClass = (window as any).IntentParser;
      const intentParser = IntentParserClass ? new IntentParserClass() : null;
      const parsedIntent = intentParser ? intentParser.parseIntent(userRequest) : null;

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

      // Call enhanced AI generation function
      const { data: response, error } = await supabase.functions.invoke('generate-professional-website', {
        body: {
          userRequest,
          channelData,
          projectContext: context,
          streamingEnabled: options.streaming,
          preserveDesign: options.preserveDesign,
          targetedChanges: options.targetedChanges,
          currentCode: files['index.html'] || ''
        },
        signal: abortControllerRef.current.signal
      });

      if (error) throw error;

      console.log('✅ AI generation completed');

      // Apply changes using AI Editor - Fixed optional chaining issue
      let finalCode = response.generatedCode;
      
      const AIEditorClass = (window as any).AIEditor;
      if (parsedIntent && AIEditorClass) {
        const aiEditor = new AIEditorClass();
        finalCode = aiEditor.applyEdit(parsedIntent, finalCode);
        console.log('🎯 Targeted edit applied');
      }

      // Update files
      await updateFile('index.html', finalCode);
      
      if (response.css) {
        await updateFile('styles.css', response.css);
      }
      
      if (response.javascript) {
        await updateFile('scripts.js', response.javascript);
      }

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
      appendToChatHistory(response.reply || 'Changes applied successfully', 'assistant');

      setGeneratedCode(finalCode);
      
      toast({
        title: "🎯 AI Changes Applied",
        description: "Your targeted modifications have been implemented while preserving the existing design.",
      });

      return {
        code: finalCode,
        reply: response.reply,
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
