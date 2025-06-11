
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Download, Upload, Trash2, RefreshCw } from 'lucide-react';

const DatabaseManagement = () => {
  const [tables] = useState([
    { name: 'users', records: 1247, size: '2.3 MB', lastUpdated: '2024-06-09' },
    { name: 'projects', records: 892, size: '15.7 MB', lastUpdated: '2024-06-09' },
    { name: 'api_keys', records: 156, size: '0.5 MB', lastUpdated: '2024-06-08' },
    { name: 'deployments', records: 456, size: '1.2 MB', lastUpdated: '2024-06-08' },
    { name: 'analytics', records: 12450, size: '45.8 MB', lastUpdated: '2024-06-09' }
  ]);

  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Database size={20} />
          Database Management
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="bolt-button flex items-center gap-2">
            <Plus size={16} />
            Create Table
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export DB
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload size={16} />
            Import Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tables.map((table) => (
            <div key={table.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 gap-4">
              <div className="flex items-center gap-4">
                <Database size={20} className="text-primary" />
                <div>
                  <h3 className="font-semibold mobile-text">{table.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {table.records.toLocaleString()} records • {table.size}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  Updated: {table.lastUpdated}
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <RefreshCw size={12} />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download size={12} />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseManagement;
