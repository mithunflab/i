
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Youtube, Globe, Wand2, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import YouTubeWebsiteBuilder from './YouTubeWebsiteBuilder';

const UserDashboard = () => {
  const { user, profile, logout } = useAuth();
  const displayName = profile?.full_name || user?.email || 'User';

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800 bg-black/50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">AI Website Builder</h1>
              <p className="text-sm text-gray-400">Welcome back, {displayName}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                <UserIcon size={14} className="mr-1" />
                User
              </Badge>
              <Button variant="outline" onClick={logout} className="border-gray-600 text-white hover:bg-white/10">
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Welcome Section */}
            <Card className="bg-white/5 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wand2 className="h-6 w-6 text-purple-500" />
                  Create Your Website
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 mb-4">
                  Transform your YouTube channel into a professional website with AI assistance. 
                  Simply provide your channel URL and our AI will create a beautiful, responsive website 
                  featuring your content, branding, and latest videos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Youtube className="h-8 w-8 text-red-500" />
                    <div>
                      <h3 className="text-white font-semibold">Fetch Channel Data</h3>
                      <p className="text-xs text-gray-400">Import your YouTube content</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Wand2 className="h-8 w-8 text-purple-500" />
                    <div>
                      <h3 className="text-white font-semibold">AI Generation</h3>
                      <p className="text-xs text-gray-400">Create beautiful websites</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Globe className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-white font-semibold">Deploy Live</h3>
                      <p className="text-xs text-gray-400">Publish to the web</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* YouTube Website Builder */}
            <YouTubeWebsiteBuilder />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
