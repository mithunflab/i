
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Folder, File, Upload, Download, Trash2, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import StorageUsageWidget from './StorageUsageWidget';

const FileManager = () => {
  const [files] = useState([
    { id: '1', name: 'user-avatars', type: 'folder', size: '2.3 MB', modified: '2024-06-09', files: 45 },
    { id: '2', name: 'project-assets', type: 'folder', size: '15.7 MB', modified: '2024-06-09', files: 128 },
    { id: '3', name: 'system-backups', type: 'folder', size: '45.2 MB', modified: '2024-06-08', files: 12 },
    { id: '4', name: 'uploaded-docs', type: 'folder', size: '8.1 MB', modified: '2024-06-07', files: 67 }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Storage Usage Widget */}
      <StorageUsageWidget />

      {/* File Management */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Folder size={20} />
            File Management
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files and folders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10">
                <Filter size={16} className="mr-2" />
                Filter
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Upload size={16} className="mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Folder className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No files found</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {file.type === 'folder' ? (
                      <Folder className="h-8 w-8 text-blue-400" />
                    ) : (
                      <File className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{file.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{file.size}</span>
                        <span>Modified: {file.modified}</span>
                        {file.type === 'folder' && (
                          <Badge variant="secondary" className="text-xs">
                            {file.files} files
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-white/10">
                      <Download size={14} />
                    </Button>
                    <Button variant="outline" size="sm" className="border-red-600 text-red-400 hover:bg-red-600/20">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;
