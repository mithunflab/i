
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Settings, Shield, CheckCircle, Clock, ExternalLink, Github, Eye, Trash2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectLimits } from '@/hooks/useProjectLimits';
import ProjectLimitBadge from '@/components/ui/ProjectLimitBadge';
import ProjectVerificationDialog from './ProjectVerificationDialog';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  source_code?: string;
  github_url?: string;
  netlify_url?: string;
  youtube_url?: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
}

const EnhancedUserProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { canCreateProject, projectCount, maxProjects } = useProjectLimits();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        return;
      }

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
    } finally {
      setLoading(false);
    }
  };

  const handleGetVerified = (project: Project) => {
    setSelectedProject(project);
    setVerificationDialogOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Your project has been successfully deleted.",
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadCode = (project: Project) => {
    if (!project.source_code) {
      toast({
        title: "No Source Code",
        description: "This project doesn't have source code available.",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([project.source_code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your project source code is being downloaded.",
    });
  };

  const onVerificationSubmitted = () => {
    setVerificationDialogOpen(false);
    setSelectedProject(null);
    loadProjects();
    toast({
      title: "Verification Requested",
      description: "Your project has been submitted for verification review.",
    });
  };

  const getVerificationBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle size={12} className="mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock size={12} className="mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30">
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <CardTitle className="text-white">My Projects</CardTitle>
              <ProjectLimitBadge />
            </div>
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white"
              disabled={!canCreateProject}
              onClick={() => {
                if (!canCreateProject) {
                  toast({
                    title: "Project Limit Reached",
                    description: `You've reached the limit of ${maxProjects} projects for free users. Upgrade to Pro for unlimited projects.`,
                    variant: "destructive"
                  });
                  return;
                }
                // Navigate to create project - this would be handled by parent component
                toast({
                  title: "Create Project",
                  description: "Navigate to YouTube Website Builder to create a new project.",
                });
              }}
            >
              <Plus size={16} className="mr-2" />
              New Project ({projectCount}/{maxProjects})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">Create your first futuristic website with Iris AI</p>
              <p className="text-sm text-purple-400 mb-4">Free users can create up to {maxProjects} projects</p>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={!canCreateProject}
              >
                <Plus size={16} className="mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600/20 to-cyan-600/20 flex items-center justify-center border border-purple-500/30">
                        <Globe className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {getVerificationBadge(project.verification_status)}
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2 truncate">{project.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description || 'AI Generated Futuristic Website'}
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Primary Actions */}
                      <div className="flex gap-2">
                        {project.netlify_url && (
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <a href={project.netlify_url} target="_blank" rel="noopener noreferrer">
                              <Eye size={14} className="mr-1" />
                              Live Site
                            </a>
                          </Button>
                        )}
                        {project.github_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                              <Github size={14} />
                            </a>
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Settings size={14} />
                        </Button>
                      </div>

                      {/* Secondary Actions */}
                      <div className="flex gap-2">
                        {project.source_code && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDownloadCode(project)}
                            className="flex-1"
                          >
                            <Download size={14} className="mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {!project.verification_status && (
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleGetVerified(project)}
                          >
                            <Shield size={14} className="mr-1" />
                            Verify
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      {/* URLs Display */}
                      {(project.github_url || project.netlify_url || project.youtube_url) && (
                        <div className="text-xs space-y-1 pt-2 border-t border-gray-700">
                          {project.netlify_url && (
                            <div className="flex items-center gap-1 text-blue-400">
                              <Globe size={10} />
                              <span className="truncate">Deployed to Netlify</span>
                            </div>
                          )}
                          {project.github_url && (
                            <div className="flex items-center gap-1 text-gray-400">
                              <Github size={10} />
                              <span className="truncate">Source on GitHub</span>
                            </div>
                          )}
                          {project.youtube_url && (
                            <div className="flex items-center gap-1 text-red-400">
                              <ExternalLink size={10} />
                              <span className="truncate">YouTube Connected</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ProjectVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        project={selectedProject}
        onSubmit={onVerificationSubmitted}
      />
    </>
  );
};

export default EnhancedUserProjects;
