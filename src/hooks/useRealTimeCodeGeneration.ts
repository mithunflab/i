
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

      // Use the edge function instead of direct OpenRouter API call
      const response = await supabase.functions.invoke('generate-professional-website', {
        body: {
          userRequest,
          channelData,
          projectContext: {
            projectId,
            currentFiles: files
          },
          streamingEnabled: options.streaming,
          preserveDesign: options.preserveDesign,
          targetedChanges: options.targetedChanges,
          currentCode: files['index.html'] || ''
        },
        signal: abortControllerRef.current.signal
      });

      if (response.error) {
        throw new Error(response.error.message || 'Edge function error');
      }

      const { data } = response;
      
      if (!data || !data.generatedCode) {
        throw new Error('No code generated from AI');
      }

      console.log('✅ AI generation completed');

      const finalCode = data.generatedCode;

      // Update files with the new code
      await updateFile('index.html', finalCode);

      // Update component map with change tracking
      const updatedComponentMap = {
        components: extractComponents(finalCode),
        relationships: analyzeComponentRelationships(finalCode),
        lastUpdated: new Date().toISOString(),
        lastChange: {
          userRequest,
          intent: data.parsedIntent || null,
          timestamp: new Date().toISOString(),
          codeDescription: data.codeDescription || 'Code updated'
        }
      };
      
      await updateFile('componentMap.json', JSON.stringify(updatedComponentMap, null, 2));

      // Log success to chat history
      appendToChatHistory(data.reply || 'Changes applied successfully', 'assistant');

      setGeneratedCode(finalCode);
      
      toast({
        title: "🎯 AI Changes Applied",
        description: data.codeDescription || "Your modifications have been implemented successfully.",
      });

      return {
        code: finalCode,
        reply: data.reply || 'Changes applied successfully',
        changes: updatedComponentMap.lastChange,
        parsedIntent: data.parsedIntent,
        codeDescription: data.codeDescription
      };

    } catch (error) {
      console.error('❌ Real-time generation error:', error);
      
      // Handle specific error cases
      let errorMessage = 'Generation failed';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Generation was cancelled';
        } else if (error.message.includes('OpenRouter API key')) {
          errorMessage = 'AI service configuration error - please check API keys';
        } else if (error.message.includes('No code generated')) {
          errorMessage = 'AI could not generate valid code for this request';
        } else {
          errorMessage = error.message;
        }
      }
      
      appendToChatHistory(`Error: ${errorMessage}`, 'assistant');
      
      toast({
        title: "Generation Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw new Error(errorMessage);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [files, updateFile, appendToChatHistory, toast]);

  const streamCode = useCallback(async (prompt: string, onChunk: (chunk: string) => void) => {
    try {
      const response = await generateCodeWithAI(prompt, null, '', { 
        streaming: true, 
        preserveDesign: true, 
        targetedChanges: true 
      });
      
      if (response?.code) {
        // Simulate streaming by chunks for better UX
        const chunks = response.code.match(/.{1,50}/g) || [];
        
        for (const chunk of chunks) {
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      onChunk('Error occurred during streaming');
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

// Helper functions for component analysis
const extractComponents = (html: string): string[] => {
  const components = [];
  
  try {
    // Extract CSS classes
    const classMatches = html.match(/class="([^"]+)"/g) || [];
    classMatches.forEach(match => {
      const classes = match.match(/"([^"]+)"/)?.[1].split(' ') || [];
      components.push(...classes);
    });
    
    // Extract HTML elements
    const elementMatches = html.match(/<(\w+)[^>]*>/g) || [];
    elementMatches.forEach(match => {
      const element = match.match(/<(\w+)/)?.[1];
      if (element) components.push(element);
    });
  } catch (error) {
    console.warn('Error extracting components:', error);
  }
  
  return [...new Set(components)].filter(c => c && c.length > 0);
};

const analyzeComponentRelationships = (html: string): Record<string, string[]> => {
  const relationships: Record<string, string[]> = {};
  
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    doc.querySelectorAll('[class]').forEach(element => {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      const parent = element.parentElement;
      
      if (parent && parent.className) {
        const parentClasses = parent.className.split(' ').filter(c => c.length > 0);
        classes.forEach(cls => {
          if (!relationships[cls]) relationships[cls] = [];
          relationships[cls].push(...parentClasses);
        });
      }
    });
  } catch (error) {
    console.warn('Error analyzing relationships:', error);
  }
  
  return relationships;
};
