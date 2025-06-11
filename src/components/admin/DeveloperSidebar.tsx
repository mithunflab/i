
import React, { useState } from 'react';
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
  Home,
  Menu,
  X,
  ChevronRight,
  Folder,
  HardDrive,
  Code,
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeveloperSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DeveloperSidebar = ({ activeTab, setActiveTab }: DeveloperSidebarProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'api', label: 'API Management', icon: Key },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'query', label: 'Query Runner', icon: Terminal },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'monitoring', label: 'System Monitor', icon: Activity },
    { id: 'backups', label: 'Backup Manager', icon: HardDrive },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'files', label: 'File Manager', icon: Folder },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System Settings', icon: Settings },
    { id: 'email', label: 'Email Config', icon: Mail },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'deploy', label: 'Deployment', icon: GitBranch },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-black/95 backdrop-blur-sm border-r border-gray-800 z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isOpen ? 'w-64' : 'w-16'} lg:translate-x-0`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className={`flex items-center ${!isOpen && 'justify-center'}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
              <Code className="text-white h-4 w-4" />
            </div>
            {isOpen && <span className="ml-2 text-xl font-bold text-white">DevPortal</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:bg-white/10"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-1 overflow-y-auto h-[calc(100vh-80px)]">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} className={`${!isOpen && 'mx-auto'}`} />
              {isOpen && (
                <>
                  <span className="ml-3 flex-1">{item.label}</span>
                  <ChevronRight size={16} className={`transition-transform ${
                    activeTab === item.id ? 'rotate-90' : ''
                  }`} />
                </>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden text-white bg-black/50 backdrop-blur-sm hover:bg-white/10"
      >
        <Menu size={20} />
      </Button>
    </>
  );
};

export default DeveloperSidebar;
