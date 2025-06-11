
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Network,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

const SystemMonitoring = () => {
  const [systemStats, setSystemStats] = useState({
    cpu: 45,
    memory: 67,
    disk: 32,
    network: 89,
    uptime: '15d 4h 23m',
    activeConnections: 234,
    responseTime: 123
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setSystemStats(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 100),
        memory: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100),
        network: Math.floor(Math.random() * 100),
        activeConnections: Math.floor(Math.random() * 500),
        responseTime: Math.floor(Math.random() * 300)
      }));
      setIsRefreshing(false);
    }, 1000);
  };

  const getStatusColor = (value: number) => {
    if (value < 50) return 'text-green-500';
    if (value < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (value: number) => {
    if (value < 50) return <Badge className="bg-green-500/20 text-green-300">Normal</Badge>;
    if (value < 80) return <Badge className="bg-yellow-500/20 text-yellow-300">Warning</Badge>;
    return <Badge className="bg-red-500/20 text-red-300">Critical</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity size={20} className="text-purple-400" />
              System Monitoring
            </CardTitle>
            <Button
              onClick={refreshStats}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="bg-white/5 border-gray-600 text-white hover:bg-white/10"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-purple-400" />
                  <span className="text-sm text-gray-300">CPU Usage</span>
                </div>
                {getStatusBadge(systemStats.cpu)}
              </div>
              <Progress value={systemStats.cpu} className="h-2" />
              <p className={`text-lg font-semibold ${getStatusColor(systemStats.cpu)}`}>
                {systemStats.cpu}%
              </p>
            </div>

            {/* Memory Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MemoryStick size={16} className="text-purple-400" />
                  <span className="text-sm text-gray-300">Memory</span>
                </div>
                {getStatusBadge(systemStats.memory)}
              </div>
              <Progress value={systemStats.memory} className="h-2" />
              <p className={`text-lg font-semibold ${getStatusColor(systemStats.memory)}`}>
                {systemStats.memory}%
              </p>
            </div>

            {/* Disk Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive size={16} className="text-purple-400" />
                  <span className="text-sm text-gray-300">Disk Space</span>
                </div>
                {getStatusBadge(systemStats.disk)}
              </div>
              <Progress value={systemStats.disk} className="h-2" />
              <p className={`text-lg font-semibold ${getStatusColor(systemStats.disk)}`}>
                {systemStats.disk}%
              </p>
            </div>

            {/* Network */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network size={16} className="text-purple-400" />
                  <span className="text-sm text-gray-300">Network</span>
                </div>
                {getStatusBadge(systemStats.network)}
              </div>
              <Progress value={systemStats.network} className="h-2" />
              <p className={`text-lg font-semibold ${getStatusColor(systemStats.network)}`}>
                {systemStats.network}%
              </p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400">System Uptime</p>
              <p className="text-xl font-bold text-white">{systemStats.uptime}</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400">Active Connections</p>
              <p className="text-xl font-bold text-white">{systemStats.activeConnections}</p>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400">Avg Response Time</p>
              <p className="text-xl font-bold text-white">{systemStats.responseTime}ms</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitoring;
