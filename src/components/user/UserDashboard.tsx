
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Globe, 
  User, 
  Settings,
  Youtube,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  Code,
  Palette
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import UserProjects from './UserProjects';
import YouTubeWebsiteBuilder from './YouTubeWebsiteBuilder';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, logout } = useAuth();

  const stats = [
    { label: 'Active Projects', value: '3', icon: Globe, change: '+2 this month', color: 'text-blue-400' },
    { label: 'Total Views', value: '12.4K', icon: TrendingUp, change: '+18% this week', color: 'text-green-400' },
    { label: 'Build Time', value: '2.5hrs', icon: Clock, change: 'Avg per project', color: 'text-purple-400' },
    { label: 'Success Rate', value: '96%', icon: CheckCircle, change: 'Deployment success', color: 'text-emerald-400' }
  ];

  const quickActions = [
    { label: 'YouTube Website', icon: Youtube, color: 'bg-red-600', action: () => setActiveTab('youtube') },
    { label: 'New Project', icon: Plus, color: 'bg-blue-600', action: () => setActiveTab('projects') },
    { label: 'Design Tools', icon: Palette, color: 'bg-purple-600', action: () => {} },
    { label: 'Code Editor', icon: Code, color: 'bg-green-600', action: () => {} }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'projects':
        return <UserProjects />;
      case 'youtube':
        return <YouTubeWebsiteBuilder />;
      case 'analytics':
        return (
          <Card className="bg-white/5 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="mx-auto h-16 w-16 mb-4 opacity-50" />
                <p>Analytics dashboard coming soon!</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'settings':
        return (
          <Card className="bg-white/5 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Account Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-300">Full Name</label>
                  <p className="text-white">{profile?.full_name || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <p className="text-white">{profile?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">Role</label>
                  <Badge variant="secondary">{profile?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-white/5 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-xs text-green-400">{stat.change}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-white/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className={`h-20 flex-col gap-2 ${action.color} border-0 text-white hover:opacity-80`}
                      onClick={action.action}
                    >
                      <action.icon size={24} />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: 'Created YouTube website', time: '2 hours ago', status: 'success' },
                    { action: 'Deployed project to Netlify', time: '1 day ago', status: 'success' },
                    { action: 'Updated branding colors', time: '2 days ago', status: 'info' },
                    { action: 'Added video gallery', time: '3 days ago', status: 'success' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-green-400' : 
                          activity.status === 'info' ? 'bg-blue-400' : 'bg-gray-400'
                        }`}></div>
                        <span className="text-white">{activity.action}</span>
                      </div>
                      <span className="text-sm text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  const displayName = profile?.full_name || user?.email || 'User';

  return (
    <div className="min-h-screen bg-black relative">
      {/* YouTube-style red multicolor gradient background */}
      <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-red-600 to-pink-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-red-900 to-orange-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-orange-600 to-red-500"></div>
      </div>
      <div className="absolute inset-0 bg-noise opacity-30"></div>
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-black/70 border-r border-gray-800 z-50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{displayName}</h2>
              <p className="text-sm text-gray-400">Creator</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'projects', label: 'My Projects', icon: Globe },
              { id: 'youtube', label: 'YouTube Builder', icon: Youtube },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className={`w-full justify-start ${
                  activeTab === item.id 
                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <Button
            variant="outline"
            onClick={logout}
            className="w-full border-gray-600 text-gray-400 hover:text-white hover:bg-white/10"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50 backdrop-blur-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Creator Dashboard</h1>
              <p className="text-sm text-gray-400">Welcome back, {displayName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-gradient-to-r from-red-600/20 to-pink-600/20 text-red-300 border-red-500/30">
                <Zap size={14} className="mr-1" />
                Pro Creator
              </Badge>
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

export default UserDashboard;
