
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Globe, 
  Github, 
  Loader2, 
  Eye, 
  Users, 
  Calendar,
  ExternalLink,
  Code,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRealYouTubeData } from '@/hooks/useRealYouTubeData';

interface Project {
  id: string;
  name: string;
  description: string;
  youtube_url?: string;
  channel_data?: any;
  source_code?: string;
  github_url?: string;
  netlify_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    youtubeUrl: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { fetchRealChannelData, loading: youtubeLoading } = useRealYouTubeData();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('📂 Loading user projects...');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading projects:', error);
        throw error;
      }

      console.log('✅ Projects loaded:', data?.length || 0);
      setProjects(data || []);

    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      toast({
        title: "Error Loading Projects",
        description: "Failed to load your projects. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a project name.",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreating(true);
      console.log('🚀 Creating new project:', formData.name);

      // Fetch YouTube data if URL provided
      let channelData = null;
      if (formData.youtubeUrl.trim()) {
        console.log('🎥 Fetching YouTube channel data...');
        channelData = await fetchRealChannelData(formData.youtubeUrl.trim());
        
        if (!channelData) {
          throw new Error('Failed to fetch YouTube channel data. Please check the URL.');
        }
      }

      // Create project in database
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || 'New AI website project',
        youtube_url: formData.youtubeUrl.trim() || null,
        channel_data: channelData,
        user_id: user?.id,
        status: 'active'
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Project created successfully:', project.id);

      // Reset form and refresh projects
      setFormData({ name: '', description: '', youtubeUrl: '' });
      setShowCreateForm(false);
      await loadProjects();

      toast({
        title: "🎉 Project Created!",
        description: `${project.name} has been created successfully.`,
      });

    } catch (error) {
      console.error('❌ Error creating project:', error);
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const deployProject = async (project: Project) => {
    if (!project.source_code) {
      toast({
        title: "No Code to Deploy",
        description: "Generate website code first using the AI assistant.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🚀 Deploying project:', project.name);

      // Deploy to Netlify (mock for now - real implementation would use Netlify API)
      const deployUrl = `https://${project.name.toLowerCase().replace(/\s+/g, '-')}-${project.id.substring(0, 8)}.netlify.app`;
      
      // Update project with deployment URL
      const { error } = await supabase
        .from('projects')
        .update({ netlify_url: deployUrl })
        .eq('id', project.id);

      if (error) throw error;

      await loadProjects();

      toast({
        title: "🚀 Deployed Successfully!",
        description: `Your website is live at ${deployUrl}`,
      });

    } catch (error) {
      console.error('❌ Deployment failed:', error);
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy project. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Your Projects</h1>
          <p className="text-gray-400">Manage your AI-generated websites</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Create New Project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Project name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Textarea
              placeholder="Project description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Input
              placeholder="YouTube channel URL (optional)"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <div className="flex gap-2">
              <Button
                onClick={createProject}
                disabled={creating || youtubeLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {creating || youtubeLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {youtubeLoading ? 'Fetching YouTube Data...' : 'Create Project'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Projects Yet</h3>
            <p className="text-gray-400 mb-4">Create your first AI-generated website project</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="bg-gray-900 border-gray-700 hover:border-purple-500/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-lg">{project.name}</CardTitle>
                    <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Info */}
                {project.channel_data && (
                  <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
                    <img 
                      src={project.channel_data.thumbnail} 
                      alt={project.channel_data.title}
                      className="w-8 h-8 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {project.channel_data.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {parseInt(project.channel_data.subscriberCount || '0').toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Code className="w-3 h-3" />
                    {project.source_code ? 'Generated' : 'Pending'}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={() => window.open(`/workspace/${project.id}`, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  
                  {project.source_code && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                      onClick={() => deployProject(project)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Deploy
                    </Button>
                  )}
                </div>

                {/* Links */}
                {(project.github_url || project.netlify_url) && (
                  <div className="flex gap-2">
                    {project.github_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300"
                        onClick={() => window.open(project.github_url, '_blank')}
                      >
                        <Github className="w-4 h-4 mr-1" />
                        GitHub
                      </Button>
                    )}
                    {project.netlify_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-gray-600 text-gray-300"
                        onClick={() => window.open(project.netlify_url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Live Site
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
