
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Settings, Shield, CheckCircle, Clock, ExternalLink, Award, Github } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
  verified?: boolean;
  github_url?: string;
  netlify_url?: string;
  youtube_url?: string;
  channel_data?: any;
}

const UserProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading projects for user:', user?.id);

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        toast({
          title: "Error Loading Projects",
          description: "Failed to load your projects. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Projects loaded:', projectsData?.length || 0);

      const { data: verificationsData, error: verificationsError } = await supabase
        .from('project_verification_requests')
        .select('project_id, status')
        .eq('user_id', user?.id);

      if (verificationsError) {
        console.error('Error loading verifications:', verificationsError);
      }

      const verificationsMap = new Map();
      verificationsData?.forEach(v => {
        verificationsMap.set(v.project_id, v.status);
      });

      const projectsWithVerification = (projectsData || []).map(project => ({
        ...project,
        verification_status: verificationsMap.get(project.id) || null
      }));

      setProjects(projectsWithVerification);
    } catch (error) {
      console.error('Error in loadProjects:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading projects.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGetVerified = async (project: Project) => {
    try {
      console.log('📋 Requesting verification for project:', project.id);

      const { error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: project.id,
          user_id: user?.id,
          project_name: project.name,
          project_url: project.netlify_url || project.github_url || '',
          contact_email: user?.email || '',
          website_description: project.description || '',
          project_data: project,
          status: 'pending',
          verification_type: 'youtube_website'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Requested",
            description: "You've already requested verification for this project.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "🎉 Verification Requested!",
        description: "Your project has been submitted for developer review.",
      });

      loadProjects();
    } catch (error) {
      console.error('Error requesting verification:', error);
      toast({
        title: "Request Failed",
        description: "Unable to submit verification request. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = (project: Project) => {
    if (project.youtube_url) {
      const params = new URLSearchParams({
        url: project.youtube_url,
        idea: project.description || '',
        projectId: project.id
      });
      
      if (project.channel_data) {
        params.append('channelData', encodeURIComponent(JSON.stringify(project.channel_data)));
      }
      
      navigate(`/workspace?${params.toString()}`);
    }
  };

  const getVerificationBadge = (status: string | null, verified?: boolean) => {
    if (verified && status === 'approved') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
          <CheckCircle size={10} className="mr-1" />
          Verified
        </Badge>
      );
    }
    
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
            <Clock size={10} className="mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const canRequestVerification = (status: string | null, verified?: boolean) => {
    return !verified && (status === null || status === 'rejected');
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white text-sm">Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white text-lg">My Projects</CardTitle>
          <Button 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm"
            onClick={() => navigate('/user-dashboard')}
          >
            <Plus size={14} className="mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-sm">Create your first AI-generated website to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      {project.channel_data?.thumbnail && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full overflow-hidden border-2 border-gray-800">
                          <img 
                            src={project.channel_data.thumbnail} 
                            alt={project.channel_data.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {(project.verified && project.verification_status === 'approved') && (
                        <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-400 bg-gray-800 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-white text-sm leading-tight truncate">
                        {project.name}
                      </CardTitle>
                      {getVerificationBadge(project.verification_status, project.verified)}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs line-clamp-2">{project.description}</p>
                  {project.channel_data && (
                    <p className="text-xs text-gray-500">
                      {parseInt(project.channel_data.subscriberCount || '0').toLocaleString()} subscribers
                    </p>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs h-8"
                      onClick={() => handleEditProject(project)}
                    >
                      <Settings size={12} className="mr-1" />
                      Edit
                    </Button>
                    
                    {project.netlify_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs h-8"
                        onClick={() => window.open(project.netlify_url, '_blank')}
                      >
                        <ExternalLink size={12} className="mr-1" />
                        View
                      </Button>
                    )}

                    {project.github_url && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="px-3 h-8"
                        onClick={() => window.open(project.github_url, '_blank')}
                        title="GitHub Repository"
                      >
                        <Github size={12} />
                      </Button>
                    )}

                    {canRequestVerification(project.verification_status, project.verified) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleGetVerified(project)}
                        className="px-3 h-8 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
                      >
                        <Shield size={12} />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserProjects;
