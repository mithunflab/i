
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Code, 
  Settings, 
  History, 
  GitBranch, 
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useFileManager } from '@/hooks/useFileManager';
import { useEnhancedGitHubSync } from '@/hooks/useEnhancedGitHubSync';

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
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [isVisible, setIsVisible] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  
  const { files, loading, updateFile, syncToGitHub } = useFileManager();
  const { syncStatus, syncProjectFiles, loadProjectFromGitHub } = useEnhancedGitHubSync();

  useEffect(() => {
    if (projectData?.github_url && Object.keys(files).length === 0) {
      // Load files from GitHub when project loads
      loadProjectFromGitHub(projectData.github_url);
    }
  }, [projectData?.github_url, files, loadProjectFromGitHub]);

  const fileStructure = [
    { 
      name: 'index.html', 
      icon: <Code size={14} />, 
      type: 'html',
      description: 'Main HTML structure'
    },
    { 
      name: 'styles.css', 
      icon: <FileText size={14} />, 
      type: 'css',
      description: 'Styling and design'
    },
    { 
      name: 'scripts.js', 
      icon: <Code size={14} />, 
      type: 'javascript',
      description: 'Interactive functionality'
    },
    { 
      name: 'intentParser.js', 
      icon: <Settings size={14} />, 
      type: 'javascript',
      description: 'AI intent parsing logic'
    },
    { 
      name: 'aiEditor.js', 
      icon: <Settings size={14} />, 
      type: 'javascript',
      description: 'AI editing engine'
    },
    { 
      name: 'componentMap.json', 
      icon: <FileText size={14} />, 
      type: 'json',
      description: 'Component relationships'
    },
    { 
      name: 'design.json', 
      icon: <FileText size={14} />, 
      type: 'json',
      description: 'Design system'
    },
    { 
      name: 'changelog.md', 
      icon: <History size={14} />, 
      type: 'markdown',
      description: 'Change history'
    },
    { 
      name: 'chatHistory.txt', 
      icon: <FileText size={14} />, 
      type: 'text',
      description: 'Chat conversations'
    },
    { 
      name: 'ytdata.json', 
      icon: <FileText size={14} />, 
      type: 'json',
      description: 'YouTube channel data'
    }
  ];

  const handleFileSelect = (fileName: string) => {
    setActiveFile(fileName);
  };

  const handleFileContentChange = async (content: string) => {
    if (autoSave) {
      await updateFile(activeFile as any, content);
      onFileChange(activeFile, content);
      
      if (activeFile === 'index.html') {
        onCodeUpdate(content);
      }
    }
  };

  const handleSyncToGitHub = async () => {
    if (projectData?.github_url) {
      await syncProjectFiles(projectData.github_url, files);
    }
  };

  const getFileLanguage = (fileName: string) => {
    const extension = fileName.split('.').pop();
    switch (extension) {
      case 'js': return 'javascript';
      case 'json': return 'json';
      case 'md': return 'markdown';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'txt': return 'text';
      default: return 'text';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700"
        >
          <Eye size={20} />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code size={16} className="text-purple-400" />
          <span className="font-medium text-sm">File Manager</span>
          <Badge variant="outline" className="text-xs">
            {Object.keys(files).length} files
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSyncToGitHub}
            disabled={syncStatus === 'syncing'}
            className="p-1 h-6 w-6"
          >
            <GitBranch size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="p-1 h-6 w-6"
          >
            <EyeOff size={12} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="files" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 m-2">
          <TabsTrigger value="files" className="text-xs">Files</TabsTrigger>
          <TabsTrigger value="editor" className="text-xs">Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 p-2 m-0">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {fileStructure.map((file) => (
                <div
                  key={file.name}
                  onClick={() => handleFileSelect(file.name)}
                  className={`p-2 rounded cursor-pointer transition-colors text-xs ${
                    activeFile === file.name
                      ? 'bg-purple-600 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {file.icon}
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs opacity-70">{file.description}</div>
                    </div>
                    {files[file.name as keyof typeof files] && (
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="editor" className="flex-1 p-2 m-0">
          {activeFile && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{activeFile}</span>
                  <Badge variant="secondary" className="text-xs">
                    {getFileLanguage(activeFile)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoSave(!autoSave)}
                    className="p-1 h-6 text-xs"
                  >
                    <Save size={10} />
                    {autoSave ? 'Auto' : 'Manual'}
                  </Button>
                </div>
              </div>
              
              <textarea
                value={files[activeFile as keyof typeof files] || ''}
                onChange={(e) => handleFileContentChange(e.target.value)}
                className="flex-1 bg-gray-800 text-white p-3 text-xs font-mono resize-none border border-gray-600 rounded"
                placeholder={`Enter ${activeFile} content...`}
                spellCheck={false}
              />
              
              <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                <span>
                  {files[activeFile as keyof typeof files]?.length || 0} characters
                </span>
                <div className="flex items-center gap-2">
                  {syncStatus === 'syncing' && (
                    <div className="flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Syncing...</span>
                    </div>
                  )}
                  {syncStatus === 'success' && (
                    <span className="text-green-400">✓ Synced</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedFileManager;
