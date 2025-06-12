
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Code, 
  ExternalLink, 
  Github, 
  Globe, 
  Calendar,
  Search,
  Filter,
  Trash2,
  Edit3,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  youtube_url: string;
  github_url?: string;
  netlify_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
  channel_data?: {
    title: string;
    thumbnail: string;
    subscriberCount: string;
    videoCount: string;
  };
}

const EnhancedUserProjects: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'updated_at'>('updated_at');

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('📂 Fetching user projects...');
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order(sortBy, { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        throw error;
      }

      console.log('✅ Projects fetched:', data?.length || 0);
      setProjects(data || []);
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, sortBy]);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Project Deleted",
        description: "Project has been successfully deleted.",
      });
      
      fetchProjects();
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Project ${newStatus === 'active' ? 'activated' : 'paused'} successfully.`,
      });
      
      fetchProjects();
    } catch (error) {
      console.error('❌ Error updating project status:', error);
      toast({
        title: "Error",
        description: "Failed to update project status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = (project: Project) => {
    navigate('/workspace', {
      state: {
        youtubeUrl: project.youtube_url,
        projectIdea: project.description,
        channelData: project.channel_data,
        existingProject: project
      }
    });
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getChannelThumbnail = (project: Project) => {
    // Fix thumbnail URL if it exists in channel_data
    if (project.channel_data?.thumbnail) {
      // Ensure high quality thumbnail
      return project.channel_data.thumbnail.replace(/s\d+/, 's240');
    }
    
    // Fallback to a default thumbnail
    return 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=240&h=180&fit=crop';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="updated_at">Last Updated</option>
              <option value="created_at">Date Created</option>
              <option value="name">Name</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="h-10 w-10 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Code className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No projects found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Start building your first AI-generated website!'
                }
              </p>
            </div>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => navigate('/user-dashboard')} className="mt-4">
                Create Your First Project
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Project Thumbnail */}
              <div className="relative h-48 bg-gray-100">
                <img
                  src={getChannelThumbnail(project)}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=240&h=180&fit=crop';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
                {project.channel_data && (
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {parseInt(project.channel_data.subscriberCount).toLocaleString()} subscribers
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-1 text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || 'No description available'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Project Info */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(project.updated_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Action Buttons - Fixed consistent sizing */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditProject(project)}
                    className="flex items-center gap-1 h-9"
                  >
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(project.id, project.status)}
                    className="flex items-center gap-1 h-9"
                  >
                    {project.status === 'active' ? (
                      <><Pause className="w-3 h-3" />Pause</>
                    ) : (
                      <><Play className="w-3 h-3" />Resume</>
                    )}
                  </Button>
                </div>

                {/* External Links */}
                <div className="flex gap-2">
                  {project.netlify_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 h-9"
                    >
                      <a href={project.netlify_url} target="_blank" rel="noopener noreferrer">
                        <Globe className="w-3 h-3 mr-1" />
                        Live Site
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex-1 h-9"
                    >
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="w-3 h-3 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>

                {/* Delete Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteProject(project.id)}
                  className="w-full h-9"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete Project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EnhancedUserProjects;
