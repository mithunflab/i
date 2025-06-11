
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  Download,
  User,
  Settings,
  Database,
  Shield,
  AlertTriangle
} from 'lucide-react';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [logs] = useState([
    {
      id: 1,
      timestamp: '2024-01-15 14:30:25',
      user: 'admin@example.com',
      action: 'User Created',
      resource: 'User Management',
      details: 'Created new user: john@example.com',
      severity: 'info',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:10',
      user: 'admin@example.com',
      action: 'Database Backup',
      resource: 'System',
      details: 'Manual database backup initiated',
      severity: 'info',
      ip: '192.168.1.100'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:05',
      user: 'system',
      action: 'Security Alert',
      resource: 'Authentication',
      details: 'Multiple failed login attempts detected',
      severity: 'warning',
      ip: '203.0.113.45'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:30',
      user: 'admin@example.com',
      action: 'Settings Updated',
      resource: 'System Configuration',
      details: 'Email settings modified',
      severity: 'info',
      ip: '192.168.1.100'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:15',
      user: 'user@example.com',
      action: 'API Key Generated',
      resource: 'API Management',
      details: 'New API key generated for project XYZ',
      severity: 'info',
      ip: '192.168.1.150'
    }
  ]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Badge className="bg-red-500/20 text-red-300">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-300">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/20 text-blue-300">Info</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-300">Unknown</Badge>;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertTriangle size={16} className="text-red-400" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-400" />;
      default:
        return <FileText size={16} className="text-blue-400" />;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('User')) return <User size={16} className="text-purple-400" />;
    if (action.includes('Settings')) return <Settings size={16} className="text-purple-400" />;
    if (action.includes('Database')) return <Database size={16} className="text-purple-400" />;
    if (action.includes('Security')) return <Shield size={16} className="text-purple-400" />;
    return <FileText size={16} className="text-purple-400" />;
  };

  const filteredLogs = logs.filter(log => 
    (filterType === 'all' || log.severity === filterType) &&
    (searchTerm === '' || 
     log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
     log.details.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <FileText size={20} className="text-purple-400" />
          Audit Logs
        </CardTitle>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-gray-600 text-white"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-gray-600 rounded-md text-white text-sm"
            >
              <option value="all">All Logs</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
            
            <Button variant="outline" size="sm" className="border-gray-600 text-white hover:bg-white/10">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div 
              key={log.id}
              className="flex items-start gap-3 p-4 bg-white/5 border border-gray-700 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mt-1">
                {getSeverityIcon(log.severity)}
                {getActionIcon(log.action)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-white">{log.action}</h4>
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(log.severity)}
                    <span className="text-xs text-gray-400">{log.timestamp}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-2">{log.details}</p>
                
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>User: {log.user}</span>
                  <span>Resource: {log.resource}</span>
                  <span>IP: {log.ip}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>No logs found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditLogs;
