
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, 
  FileText, 
  Image, 
  Upload, 
  Download, 
  Trash2, 
  Search,
  Plus,
  MoreVertical,
  File
} from 'lucide-react';

const FileManager = () => {
  const [currentPath, setCurrentPath] = useState('/uploads');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [files] = useState([
    {
      id: 1,
      name: 'images',
      type: 'folder',
      size: null,
      modified: '2024-01-15',
      items: 24
    },
    {
      id: 2,
      name: 'documents',
      type: 'folder',
      size: null,
      modified: '2024-01-14',
      items: 12
    },
    {
      id: 3,
      name: 'logo.png',
      type: 'image',
      size: '245 KB',
      modified: '2024-01-15',
      items: null
    },
    {
      id: 4,
      name: 'user-manual.pdf',
      type: 'document',
      size: '2.1 MB',
      modified: '2024-01-14',
      items: null
    },
    {
      id: 5,
      name: 'config.json',
      type: 'file',
      size: '1.5 KB',
      modified: '2024-01-13',
      items: null
    },
    {
      id: 6,
      name: 'banner.jpg',
      type: 'image',
      size: '890 KB',
      modified: '2024-01-12',
      items: null
    }
  ]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder size={20} className="text-yellow-400" />;
      case 'image':
        return <Image size={20} className="text-green-400" />;
      case 'document':
        return <FileText size={20} className="text-blue-400" />;
      default:
        return <File size={20} className="text-gray-400" />;
    }
  };

  const getFileTypeBadge = (type: string) => {
    const colors = {
      folder: 'bg-yellow-500/20 text-yellow-300',
      image: 'bg-green-500/20 text-green-300',
      document: 'bg-blue-500/20 text-blue-300',
      file: 'bg-gray-500/20 text-gray-300'
    };
    
    return (
      <Badge className={colors[type as keyof typeof colors] || colors.file}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileAction = (action: string, fileId: number) => {
    alert(`${action} file ${fileId} (Demo)`);
  };

  return (
    <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Folder size={20} className="text-purple-400" />
          File Manager
        </CardTitle>
        
        {/* Path and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Path:</span>
            <span className="font-mono bg-white/5 px-2 py-1 rounded">{currentPath}</span>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus size={16} className="mr-2" />
              New Folder
            </Button>
            <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-white/10">
              <Upload size={16} className="mr-2" />
              Upload
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files and folders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white/5 border-gray-600 text-white"
          />
        </div>
      </CardHeader>
      
      <CardContent>
        {/* File List */}
        <div className="space-y-2">
          {filteredFiles.map((file) => (
            <div 
              key={file.id}
              className="flex items-center justify-between p-3 bg-white/5 border border-gray-700 rounded-lg hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{file.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>Modified: {file.modified}</span>
                    {file.size && <span>Size: {file.size}</span>}
                    {file.items && <span>{file.items} items</span>}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {getFileTypeBadge(file.type)}
                
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFileAction('Download', file.id)}
                    className="h-8 w-8 p-0 border-gray-600 hover:bg-white/10"
                  >
                    <Download size={14} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleFileAction('Delete', file.id)}
                    className="h-8 w-8 p-0 border-gray-600 hover:bg-white/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 w-8 p-0 border-gray-600 hover:bg-white/10"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredFiles.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Folder size={48} className="mx-auto mb-4 opacity-50" />
            <p>No files found</p>
          </div>
        )}
        
        {/* Storage Info */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-white">Storage Usage</h4>
            <span className="text-sm text-gray-400">4.2 GB / 50 GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '8.4%' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileManager;
