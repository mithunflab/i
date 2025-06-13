
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  path: string;
}

interface CompactFileStructureProps {
  files: FileNode[];
  onFileSelect?: (path: string) => void;
  selectedFile?: string;
}

const CompactFileStructure: React.FC<CompactFileStructureProps> = ({
  files,
  onFileSelect,
  selectedFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/', '/src']));

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'html':
      case 'htm':
        return <Code className="w-3 h-3 text-orange-500" />;
      case 'css':
        return <Code className="w-3 h-3 text-blue-500" />;
      case 'js':
      case 'jsx':
        return <Code className="w-3 h-3 text-yellow-500" />;
      case 'ts':
      case 'tsx':
        return <Code className="w-3 h-3 text-blue-600" />;
      case 'json':
        return <Code className="w-3 h-3 text-green-500" />;
      case 'md':
        return <Code className="w-3 h-3 text-gray-500" />;
      default:
        return <File className="w-3 h-3 text-gray-400" />;
    }
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-1 py-0.5 px-1 hover:bg-gray-100 cursor-pointer text-xs ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else {
              onFileSelect?.(node.path);
            }
          }}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
              <Folder className="w-3 h-3 text-blue-500" />
            </>
          ) : (
            <>
              <div className="w-3" /> {/* Spacer for alignment */}
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate font-mono" title={node.name}>{node.name}</span>
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-48 border-r border-gray-200 bg-gray-50/50">
      <div className="p-2 border-b border-gray-200 bg-gray-100">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Project Files</h3>
      </div>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="p-1">
          {files.map(file => renderNode(file))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Default file structure for AI projects
export const defaultProjectFiles: FileNode[] = [
  {
    name: 'index.html',
    type: 'file',
    path: '/index.html'
  },
  {
    name: 'style.css',
    type: 'file',
    path: '/style.css'
  },
  {
    name: 'script.js',
    type: 'file',
    path: '/script.js'
  },
  {
    name: 'README.md',
    type: 'file',
    path: '/README.md'
  },
  {
    name: 'package.json',
    type: 'file',
    path: '/package.json'
  },
  {
    name: 'assets',
    type: 'folder',
    path: '/assets',
    children: [
      {
        name: 'images',
        type: 'folder',
        path: '/assets/images',
        children: []
      },
      {
        name: 'icons',
        type: 'folder',
        path: '/assets/icons',
        children: []
      }
    ]
  }
];

export default CompactFileStructure;
