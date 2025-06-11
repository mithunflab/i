
import React from 'react';
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
  FileText,
  HardDrive,
  Terminal,
  Youtube,
  Activity,
  CheckCircle,
  Folder
} from 'lucide-react';

interface DeveloperSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DeveloperSidebar = ({ activeTab, setActiveTab }: DeveloperSidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'projects', label: 'Project Approval', icon: CheckCircle },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'query', label: 'Query Runner', icon: Terminal },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'config-analytics', label: 'Config Analytics', icon: Activity },
    { id: 'youtube', label: 'YouTube API', icon: Youtube },
    { id: 'deployments', label: 'Deployments', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System Settings', icon: Settings },
    { id: 'email', label: 'Email Config', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'monitoring', label: 'Monitoring', icon: Server },
    { id: 'backups', label: 'Backups', icon: HardDrive },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'files', label: 'File Manager', icon: Folder }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-black/90 border-r border-gray-800 overflow-y-auto z-40 lg:block hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6">Developer Portal</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start text-left ${
                activeTab === item.id 
                  ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' 
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon size={16} className="mr-3" />
              {item.label}
              {item.id === 'projects' && (
                <Badge variant="secondary" className="ml-auto bg-yellow-600/20 text-yellow-400">
                  New
                </Badge>
              )}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default DeveloperSidebar;
