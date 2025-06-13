
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Save, Github, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useFileManager } from '@/hooks/useFileManager';
import { useRealTimeGitSync } from '@/hooks/useRealTimeGitSync';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFileManagerProps {
  projectData: any;
  onFileChange: (fileName: string, content: string) => void;
  onCodeUpdate: (code: string) => void;
}

const EnhancedFileManager: React.FC<EnhancedFileManagerProps> = ({
  projectData,
  onFileChange,
  onCodeUpdate
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [fileContent, setFileContent] = useState<string>('');
  const [newFileName, setNewFileName] = useState<string>('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  
  const { files, updateFile, createFile, deleteFile } = useFileManager();
  const { syncStatus, syncToGit } = useRealTimeGitSync(projectData?.id);
  const { toast } = useToast();

  // Load file content when selected file changes
  useEffect(() => {
    if (selectedFile && files[selectedFile]) {
      setFileContent(files[selectedFile]);
    }
  }, [selectedFile, files]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && selectedFile && fileContent !== files[selectedFile]) {
      const timeoutId = setTimeout(() => {
        handleSaveFile();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [fileContent, autoSave, selectedFile]);

  const handleSaveFile = async () => {
    if (!selectedFile || !fileContent) return;

    try {
      await updateFile(selectedFile, fileContent);
      onFileChange(selectedFile, fileContent);
      
      // Update main preview if it's the index.html
      if (selectedFile === 'index.html') {
        onCodeUpdate(fileContent);
      }

      // Auto-sync to GitHub if connected
      if (projectData?.github_url) {
        await syncToGit({ [selectedFile]: fileContent }, `Update ${selectedFile}`);
      }

      toast({
        title: "File Saved",
        description: `${selectedFile} has been saved successfully.`,
      });
    } catch (error) {
      console.error('Error saving file:', error);
      toast({
        title: "Save Error",
        description: "Failed to save file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    try {
      const fileName = newFileName.trim();
      await createFile(fileName, '');
      setSelectedFile(fileName);
      setFileContent('');
      setNewFileName('');
      setIsCreatingFile(false);
      
      toast({
        title: "File Created",
        description: `${fileName} has been created successfully.`,
      });
    } catch (error) {
      console.error('Error creating file:', error);
      toast({
        title: "Creation Error",
        description: "Failed to create file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSyncAllFiles = async () => {
    if (!projectData?.github_url) {
      toast({
        title: "No Git Repository",
        description: "This project is not connected to a GitHub repository.",
        variant: "destructive"
      });
      return;
    }

    try {
      await syncToGit(files, 'Sync all project files');
      toast({
        title: "Sync Complete",
        description: "All files have been synced to GitHub successfully.",
      });
    } catch (error) {
      console.error('Error syncing files:', error);
      toast({
        title: "Sync Error",
        description: "Failed to sync files to GitHub.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.html')) return '🌐';
    if (fileName.endsWith('.css')) return '🎨';
    if (fileName.endsWith('.js')) return '⚡';
    if (fileName.endsWith('.json')) return '📋';
    if (fileName.endsWith('.md')) return '📝';
    return '📄';
  };

  const getSyncStatusIcon = () => {
    switch (syncStatus.syncStatus) {
      case 'syncing':
        return <Loader2 size={12} className="animate-spin text-blue-400" />;
      case 'success':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={12} className="text-red-400" />;
      default:
        return <Github size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">File Manager</h3>
          <div className="flex items-center gap-2">
            {/* Auto-save toggle */}
            <Button
              variant={autoSave ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoSave(!autoSave)}
              className="text-xs h-7"
            >
              Auto-save {autoSave ? 'ON' : 'OFF'}
            </Button>
            
            {/* Git sync button */}
            {projectData?.github_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncAllFiles}
                disabled={syncStatus.syncStatus === 'syncing'}
                className="text-xs h-7 flex items-center gap-1"
              >
                {getSyncStatusIcon()}
                Sync Git
              </Button>
            )}
          </div>
        </div>

        {/* Sync Status */}
        {projectData?.github_url && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            {getSyncStatusIcon()}
            <span>
              {syncStatus.syncStatus === 'syncing' ? `Syncing ${syncStatus.filesSynced} files...` :
               syncStatus.syncStatus === 'success' ? `Last sync: ${syncStatus.lastSyncAt?.toLocaleTimeString() || 'Just now'}` :
               syncStatus.syncStatus === 'error' ? `Error: ${syncStatus.errorMessage}` :
               'Ready to sync'}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* File List */}
        <div className="w-1/3 border-r border-gray-700 bg-gray-800">
          <div className="p-3 border-b border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingFile(true)}
              className="w-full text-xs h-8 flex items-center gap-1"
            >
              <Plus size={12} />
              New File
            </Button>
          </div>

          {/* New file input */}
          {isCreatingFile && (
            <div className="p-3 border-b border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="filename.html"
                  className="flex-1 h-7 text-xs"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                />
                <Button size="sm" onClick={handleCreateFile} className="h-7 text-xs">
                  Create
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-2">
              {Object.keys(files).map((fileName) => (
                <div
                  key={fileName}
                  onClick={() => setSelectedFile(fileName)}
                  className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-700 transition-colors ${
                    selectedFile === fileName ? 'bg-gray-700 border border-gray-600' : ''
                  }`}
                >
                  <span className="text-sm">{getFileIcon(fileName)}</span>
                  <span className="text-white text-xs flex-1 truncate">{fileName}</span>
                  {fileContent !== files[fileName] && selectedFile === fileName && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Unsaved changes" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* Editor Header */}
              <div className="p-3 border-b border-gray-700 bg-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getFileIcon(selectedFile)}</span>
                  <span className="text-white text-sm">{selectedFile}</span>
                  {fileContent !== files[selectedFile] && (
                    <Badge variant="outline" className="text-xs">
                      Modified
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveFile}
                  disabled={fileContent === files[selectedFile]}
                  className="text-xs h-7 flex items-center gap-1"
                >
                  <Save size={12} />
                  Save
                </Button>
              </div>

              {/* Editor */}
              <div className="flex-1">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  className="w-full h-full bg-gray-900 text-white p-4 text-sm font-mono resize-none border-none outline-none"
                  placeholder="Start typing your code..."
                  spellCheck={false}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a file to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileManager;
