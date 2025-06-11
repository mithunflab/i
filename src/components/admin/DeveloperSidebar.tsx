
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Cloud,
  Activity,
  FileText,
  Folder,
  HardDrive,
  Terminal,
  Youtube,
  TrendingUp,
  PieChart
} from 'lucide-react';

interface DeveloperSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DeveloperSidebar = ({ activeTab, setActiveTab }: DeveloperSidebarProps) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, category: 'main' },
    { id: 'users', label: 'User Management', icon: Users, category: 'management' },
    { id: 'api', label: 'API Keys', icon: Key, category: 'management' },
    { id: 'database', label: 'Database', icon: Database, category: 'data' },
    { id: 'query', label: 'Query Runner', icon: Terminal, category: 'data' },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, category: 'analytics' },
    { id: 'config-analytics', label: 'Config Analytics', icon: PieChart, category: 'analytics' },
    { id: 'youtube', label: 'YouTube API', icon: Youtube, category: 'integrations' },
    { id: 'deployments', label: 'Deployments', icon: Globe, category: 'integrations' },
    { id: 'monitoring', label: 'Monitoring', icon: Activity, category: 'system' },
    { id: 'security', label: 'Security', icon: Shield, category: 'system' },
    { id: 'system', label: 'System Settings', icon: Settings, category: 'system' },
    { id: 'email', label: 'Email Config', icon: Mail, category: 'configuration' },
    { id: 'payments', label: 'Payments', icon: CreditCard, category: 'configuration' },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, category: 'configuration' },
    { id: 'domains', label: 'Domains', icon: Server, category: 'configuration' },
    { id: 'backups', label: 'Backups', icon: HardDrive, category: 'maintenance' },
    { id: 'audit', label: 'Audit Logs', icon: FileText, category: 'maintenance' },
    { id: 'files', label: 'File Manager', icon: Folder, category: 'maintenance' }
  ];

  const categories = {
    main: { label: 'Dashboard', items: menuItems.filter(item => item.category === 'main') },
    management: { label: 'Management', items: menuItems.filter(item => item.category === 'management') },
    data: { label: 'Data & Storage', items: menuItems.filter(item => item.category === 'data') },
    analytics: { label: 'Analytics', items: menuItems.filter(item => item.category === 'analytics') },
    integrations: { label: 'Integrations', items: menuItems.filter(item => item.category === 'integrations') },
    system: { label: 'System', items: menuItems.filter(item => item.category === 'system') },
    configuration: { label: 'Configuration', items: menuItems.filter(item => item.category === 'configuration') },
    maintenance: { label: 'Maintenance', items: menuItems.filter(item => item.category === 'maintenance') }
  };

  return (
    <div className="fixed left-0 top-0 z-40 h-screen w-64 bg-black/95 border-r border-gray-800 lg:block hidden">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Developer Portal</h2>
        <p className="text-sm text-gray-400">Configuration & Analytics</p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-100px)]">
        <div className="p-4 space-y-6">
          {Object.entries(categories).map(([key, category]) => (
            <div key={key}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {category.label}
              </h3>
              <div className="space-y-1">
                {category.items.map((item) => (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left ${
                      activeTab === item.id 
                        ? 'bg-purple-600/20 text-purple-300 border-purple-500/30' 
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <item.icon size={16} className="mr-3" />
                    {item.label}
                  </Button>
                ))}
              </div>
              {key !== 'maintenance' && <Separator className="mt-4 bg-gray-800" />}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DeveloperSidebar;
