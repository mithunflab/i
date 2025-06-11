import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Key, 
  Database, 
  BarChart3, 
  Shield, 
  Settings,
  Server,
  Mail,
  CreditCard,
  Webhook,
  Globe,
  GitBranch,
  Cloud,
  Zap,
  Activity,
  FileText,
  Bell,
  Download,
  Upload,
  Folder,
  HardDrive,
  TrendingUp,
  PieChart,
  LineChart,
  DollarSign,
  Clock,
  AlertCircle,
  Terminal,
  Youtube,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DeveloperSidebar from './DeveloperSidebar';
import UserManagement from './UserManagement';
import ProjectApproval from './ProjectApproval';
import ApiKeyManagement from './ApiKeyManagement';
import DatabaseManagement from './DatabaseManagement';
import DeveloperAnalytics from './DeveloperAnalytics';
import SecuritySettings from './SecuritySettings';
import SystemSettings from './SystemSettings';
import EmailConfiguration from './EmailConfiguration';
import PaymentSettings from './PaymentSettings';
import WebhookManagement from './WebhookManagement';
import DomainManagement from './DomainManagement';
import SystemMonitoring from './SystemMonitoring';
import BackupManagement from './BackupManagement';
import AuditLogs from './AuditLogs';
import FileManager from './FileManager';
import ApiUsageAnalytics from './ApiUsageAnalytics';
import DatabaseQueryRunner from './DatabaseQueryRunner';
import RealTimeApiUsage from './RealTimeApiUsage';
import YouTubeApiSettings from './YouTubeApiSettings';
import DeploymentSettings from './DeploymentSettings';
import ConfigurationAnalytics from './ConfigurationAnalytics';

const DeveloperDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, logout } = useAuth();
  const [realTimeStats, setRealTimeStats] = useState({
    totalRequests: 0,
    activeUsers: 0,
    revenue: 0,
    responseTime: 0,
    successRate: 0,
    errorRate: 0
  });

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeStats(prev => ({
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        activeUsers: Math.floor(Math.random() * 100) + 50,
        revenue: prev.revenue + Math.floor(Math.random() * 100),
        responseTime: Math.floor(Math.random() * 50) + 200,
        successRate: 99.2 + Math.random() * 0.8,
        errorRate: 0.2 + Math.random() * 0.6
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const stats = [
    { label: 'Total API Requests', value: realTimeStats.totalRequests.toLocaleString(), icon: Zap, change: '+18%', color: 'text-purple-400' },
    { label: 'Active Users', value: realTimeStats.activeUsers.toString(), icon: Users, change: '+12%', color: 'text-blue-400' },
    { label: 'Revenue Today', value: `$${realTimeStats.revenue}`, icon: DollarSign, change: '+28%', color: 'text-green-400' },
    { label: 'Avg Response Time', value: `${realTimeStats.responseTime}ms`, icon: Clock, change: '-8%', color: 'text-cyan-400' },
    { label: 'Success Rate', value: `${realTimeStats.successRate.toFixed(1)}%`, icon: Activity, change: '+0.2%', color: 'text-emerald-400' },
    { label: 'Error Rate', value: `${realTimeStats.errorRate.toFixed(1)}%`, icon: AlertCircle, change: '-0.4%', color: 'text-red-400' }
  ];

  const displayName = profile?.full_name || user?.email || 'Developer';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-white/5 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : stat.change.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                        {stat.change}
                      </span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Real-time API Usage Analytics */}
            <RealTimeApiUsage />

            {/* Quick Actions */}
            <Card className="bg-white/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('projects')}
                  >
                    <CheckCircle size={20} />
                    <span className="text-xs">Project Approval</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('api')}
                  >
                    <Key size={20} />
                    <span className="text-xs">API Keys</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('database')}
                  >
                    <Database size={20} />
                    <span className="text-xs">Database</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('youtube')}
                  >
                    <Youtube size={20} className="text-red-500" />
                    <span className="text-xs">YouTube API</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('deployments')}
                  >
                    <Globe size={20} />
                    <span className="text-xs">Deployments</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col gap-2 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                    onClick={() => setActiveTab('config-analytics')}
                  >
                    <BarChart3 size={20} />
                    <span className="text-xs">Config Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      case 'users':
        return <UserManagement />;
      case 'projects':
        return <ProjectApproval />;
      case 'api':
        return <ApiKeyManagement />;
      case 'database':
        return <DatabaseManagement />;
      case 'query':
        return <DatabaseQueryRunner />;
      case 'analytics':
        return <DeveloperAnalytics />;
      case 'config-analytics':
        return <ConfigurationAnalytics />;
      case 'security':
        return <SecuritySettings />;
      case 'system':
        return <SystemSettings />;
      case 'email':
        return <EmailConfiguration />;
      case 'payments':
        return <PaymentSettings />;
      case 'webhooks':
        return <WebhookManagement />;
      case 'domains':
        return <DomainManagement />;
      case 'monitoring':
        return <SystemMonitoring />;
      case 'backups':
        return <BackupManagement />;
      case 'audit':
        return <AuditLogs />;
      case 'files':
        return <FileManager />;
      case 'youtube':
        return <YouTubeApiSettings />;
      case 'deployments':
        return <DeploymentSettings />;
      default:
        return <div className="text-white">Feature under development...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      {/* Sidebar */}
      <DeveloperSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">AI Developer Portal</h1>
              <p className="text-sm text-gray-400">Welcome back, {displayName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                <Shield size={14} className="mr-1" />
                Developer
              </Badge>
              <Button variant="outline" onClick={logout} className="border-gray-600 text-white hover:bg-white/10">
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DeveloperDashboard;
