
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FileData {
  [fileName: string]: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useFileManager = () => {
  const [files, setFiles] = useState<FileData>({ 'index.html': '' });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateFile = useCallback(async (fileName: string, content: string) => {
    setFiles(prev => ({
      ...prev,
      [fileName]: content
    }));

    // Save to database or storage
    try {
      const { error } = await supabase
        .from('file_storage')
        .upsert({
          file_name: fileName,
          file_type: fileName.split('.').pop() || 'txt',
          storage_path: `projects/${fileName}`,
          file_size: content.length,
          metadata: { lastModified: new Date().toISOString() }
        });

      if (error) {
        console.error('Error saving file:', error);
      }
    } catch (error) {
      console.error('File save error:', error);
    }
  }, []);

  const appendToChatHistory = useCallback(async (content: string, role: 'user' | 'assistant') => {
    const newMessage: ChatMessage = {
      role,
      content,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, newMessage]);

    // Save chat to database
    try {
      const user = await supabase.auth.getUser();
      if (user.data.user) {
        const { error } = await supabase
          .from('project_chat_history')
          .insert({
            user_id: user.data.user.id,
            project_id: 'current-project',
            message_type: role,
            content
          });

        if (error) {
          console.error('Error saving chat:', error);
        }
      }
    } catch (error) {
      console.error('Chat save error:', error);
    }
  }, []);

  const loadFiles = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('file_storage')
        .select('*')
        .eq('metadata->projectId', projectId);

      if (error) throw error;

      const loadedFiles: FileData = {};
      data?.forEach(file => {
        loadedFiles[file.file_name] = file.storage_path || '';
      });

      setFiles(loadedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    files,
    chatHistory,
    isLoading,
    updateFile,
    appendToChatHistory,
    loadFiles
  };
};
