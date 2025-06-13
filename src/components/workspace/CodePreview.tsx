
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Code, 
  Copy, 
  Download, 
  FileText,
  Folder,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

interface CodePreviewProps {
  generatedCode: string;
  projectFiles?: FileNode[];
  isLiveTyping?: boolean;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  generatedCode,
  projectFiles = [],
  isLiveTyping = false
}) => {
  const [selectedFile, setSelectedFile] = useState<string>('index.html');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleFolder = (folderName: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderName)) {
      newExpanded.delete(folderName);
    } else {
      newExpanded.add(folderName);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileTree = (files: FileNode[], level = 0) => {
    return files.map((file) => (
      <div key={file.name} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded ${
            selectedFile === file.name ? 'bg-blue-50 border-l-2 border-blue-500' : ''
          }`}
          onClick={() => {
            if (file.type === 'folder') {
              toggleFolder(file.name);
            } else {
              setSelectedFile(file.name);
            }
          }}
        >
          {file.type === 'folder' ? (
            <>
              {expandedFolders.has(file.name) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <Folder className="w-4 h-4 text-blue-600" />
            </>
          ) : (
            <>
              <div className="w-4" />
              <FileText className="w-4 h-4 text-gray-600" />
            </>
          )}
          <span className="text-sm">{file.name}</span>
          {file.extension && (
            <Badge variant="outline" className="text-xs">
              {file.extension}
            </Badge>
          )}
        </div>
        
        {file.type === 'folder' && expandedFolders.has(file.name) && file.children && (
          <div>
            {renderFileTree(file.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  const getCurrentFileContent = () => {
    if (selectedFile === 'index.html') {
      return generatedCode;
    }
    
    const findFile = (files: FileNode[]): string => {
      for (const file of files) {
        if (file.name === selectedFile && file.content) {
          return file.content;
        }
        if (file.children) {
          const found = findFile(file.children);
          if (found) return found;
        }
      }
      return '';
    };
    
    return findFile(projectFiles);
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* File Tree Sidebar */}
      {projectFiles.length > 0 && (
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-sm text-gray-800">Project Files</h3>
          </div>
          <ScrollArea className="h-[calc(100%-60px)]">
            <div className="p-2">
              {/* Always show index.html first */}
              <div
                className={`flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer rounded ${
                  selectedFile === 'index.html' ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
                onClick={() => setSelectedFile('index.html')}
              >
                <div className="w-4" />
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm">index.html</span>
                <Badge variant="outline" className="text-xs">html</Badge>
              </div>
              
              {/* Render other project files */}
              {renderFileTree(projectFiles)}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-sm text-gray-800">{selectedFile}</span>
            {isLiveTyping && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                Live
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="h-8"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCode}
              className="h-8"
            >
              <Download className="w-3 h-3 mr-1" />
              Download
            </Button>
          </div>
        </div>

        {/* Code Content */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <pre className="text-sm font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code>{getCurrentFileContent() || '// No content available'}</code>
            </pre>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodePreview;
