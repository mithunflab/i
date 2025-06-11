
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Download, 
  Upload, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  Plus
} from 'lucide-react';

const BackupManagement = () => {
  const [autoBackup, setAutoBackup] = useState(true);
  const [backups] = useState([
    {
      id: 1,
      name: 'Full System Backup',
      date: '2024-01-15 14:30',
      size: '2.4 GB',
      status: 'completed',
      type: 'automatic'
    },
    {
      id: 2,
      name: 'Database Backup',
      date: '2024-01-15 12:00',
      size: '512 MB',
      status: 'completed',
      type: 'manual'
    },
    {
      id: 3,
      name: 'Config Backup',
      date: '2024-01-15 08:00',
      size: '15 MB',
      status: 'failed',
      type: 'automatic'
    }
  ]);

  const handleCreateBackup = () => {
    alert('Creating new backup... (Demo)');
  };

  const handleRestore = (backupId: number) => {
    alert(`Restoring backup ${backupId}... (Demo)`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <Clock size={16} className="text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-300">Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-300">Failed</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-300">In Progress</Badge>;
    }
  };

  return (
    <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Database size={20} className="text-purple-400" />
          Backup Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto Backup Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Backup Settings</h3>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div>
              <p className="font-medium text-white">Automatic Backups</p>
              <p className="text-sm text-gray-400">Daily automated system backups</p>
            </div>
            <Switch checked={autoBackup} onCheckedChange={setAutoBackup} />
          </div>
          
          <div className="flex gap-4">
            <Button 
              onClick={handleCreateBackup}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus size={16} className="mr-2" />
              Create Backup
            </Button>
            <Button variant="outline" className="border-gray-600 text-white hover:bg-white/10">
              <Upload size={16} className="mr-2" />
              Upload Backup
            </Button>
          </div>
        </div>

        {/* Backup List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Recent Backups</h3>
          <div className="space-y-3">
            {backups.map((backup) => (
              <div 
                key={backup.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(backup.status)}
                  <div>
                    <p className="font-medium text-white">{backup.name}</p>
                    <p className="text-sm text-gray-400">
                      {backup.date} • {backup.size} • {backup.type}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {getStatusBadge(backup.status)}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleRestore(backup.id)}
                      disabled={backup.status !== 'completed'}
                      className="border-gray-600 text-white hover:bg-white/10"
                    >
                      <Download size={14} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="border-gray-600 text-white hover:bg-white/10"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Usage */}
        <div className="p-4 bg-white/5 rounded-lg">
          <h4 className="font-medium text-white mb-2">Backup Storage Usage</h4>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Used: 2.9 GB</span>
            <span>Available: 17.1 GB</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupManagement;
