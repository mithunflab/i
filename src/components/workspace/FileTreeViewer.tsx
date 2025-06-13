
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  File, 
  Folder, 
  FolderOpen,
  Code,
  Image,
  FileText,
  Settings,
  Youtube
} from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  icon?: any;
  children?: FileNode[];
  extension?: string;
}

interface FileTreeViewerProps {
  onFileSelect: (file: FileNode) => void;
  selectedFile?: FileNode;
  projectFiles: FileNode[];
}

const FileTreeViewer: React.FC<FileTreeViewerProps> = ({
  onFileSelect,
  selectedFile,
  projectFiles
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.name) ? FolderOpen : Folder;
    }

    switch (file.extension) {
      case 'html': return Code;
      case 'css': return Code;
      case 'js': return Code;
      case 'json': return Settings;
      case 'md': return FileText;
      case 'jpg':
      case 'png':
      case 'gif': return Image;
      default: return File;
    }
  };

  const renderFileTree = (files: FileNode[], level = 0, parentPath = '') => {
    return files.map((file, index) => {
      const path = parentPath ? `${parentPath}/${file.name}` : file.name;
      const Icon = getFileIcon(file);
      const isExpanded = expandedFolders.has(path);
      const isSelected = selectedFile?.name === file.name;

      return (
        <div key={index} className="select-none">
          <div
            className={`flex items-center gap-2 p-2 hover:bg-gray-700/50 cursor-pointer rounded ${
              isSelected ? 'bg-blue-600/20 border-l-2 border-blue-400' : ''
            }`}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
            onClick={() => {
              if (file.type === 'folder') {
                toggleFolder(path);
              } else {
                onFileSelect(file);
              }
            }}
          >
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300">{file.name}</span>
            {file.name === 'yticon' && (
              <Youtube className="w-3 h-3 text-red-400 ml-auto" />
            )}
          </div>
          
          {file.type === 'folder' && file.children && isExpanded && (
            <div>
              {renderFileTree(file.children, level + 1, path)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <Card className="h-full bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Folder className="w-4 h-4" />
          Project Files
          <Badge variant="secondary" className="text-xs">
            {projectFiles.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {renderFileTree(projectFiles)}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileTreeViewer;
