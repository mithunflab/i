
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Youtube, 
  Globe, 
  Users, 
  CheckCircle,
  Shield,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import EnhancedProjectCard from './EnhancedProjectCard';

const UserDashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalProjects: 0,
    verifiedProjects: 0,
    totalSubscribers: 0,
    totalViews: 0
  });

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProjects();
      loadStats();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
        return;
      }

      setProjects(data || []);
    } catch (error) {
      console.error('Error in loadProjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('verified, channel_data')
        .eq('user_id', user?.id);

      if (projectData) {
        const totalProjects = projectData.length;
        const verifiedProjects = projectData.filter(p => p.verified).length;
        
        let totalSubscribers = 0;
        let totalViews = 0;

        projectData.forEach(project => {
          if (project.channel_data && typeof project.channel_data === 'object') {
            const channelData = project.channel_data as any;
            totalSubscribers += parseInt(channelData.subscriberCount || '0');
            totalViews += parseInt(channelData.viewCount || '0');
          }
        });

        setStats({
          totalProjects,
          verifiedProjects,
          totalSubscribers,
          totalViews
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.channel_data?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerificationSubmitted = () => {
    loadProjects();
    loadStats();
    toast({
      title: "Verification Requested",
      description: "Your project has been submitted for verification review.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, {profile?.full_name || 'User'}! 👋
              </h1>
              <p className="text-gray-400">
                Build amazing websites for your YouTube channels with AI assistance
              </p>
            </div>
            <Button 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={() => window.open('/', '_blank')}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white/5 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-600/20 rounded-full flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
                    <p className="text-sm text-gray-400">Total Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600/20 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.verifiedProjects}</p>
                    <p className="text-sm text-gray-400">Verified Projects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalSubscribers.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Subscribers</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-gray-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-600/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalViews.toLocaleString()}</p>
                    <p className="text-sm text-gray-400">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="bg-white/5 border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Your Projects
              <Badge variant="outline" className="ml-auto">
                {filteredProjects.length} projects
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search projects, channels, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <EnhancedProjectCard
                    key={project.id}
                    project={project}
                    onVerificationSubmitted={handleVerificationSubmitted}
                  />
                ))}
              </div>
            ) : searchTerm ? (
              <div className="text-center py-8 text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p>Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Youtube className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="mb-4">Create your first AI-generated website for a YouTube channel</p>
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={() => window.open('/', '_blank')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border-purple-500/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Get Your Projects Verified
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
              <div>
                <h4 className="font-medium text-white mb-1">📋 Quality Standards</h4>
                <p>Ensure your website meets our quality guidelines for design and functionality</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">🎯 Channel Integration</h4>
                <p>Properly integrate your YouTube channel data and branding elements</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">✅ Verification Benefits</h4>
                <p>Verified projects get priority support and enhanced features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;
