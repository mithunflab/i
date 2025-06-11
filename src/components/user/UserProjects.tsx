
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Settings, Shield, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import ProjectVerificationDialog from './ProjectVerificationDialog';

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  verification_status?: 'pending' | 'approved' | 'rejected' | null;
}

const UserProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    try {
      // Load projects with verification status
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        return;
      }

      // Load verification requests
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('project_verification_requests')
        .select('project_id, status')
        .eq('user_id', user?.id);

      if (verificationsError) {
        console.error('Error loading verifications:', verificationsError);
      }

      // Merge the data
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

  const onVerificationSubmitted = () => {
    setVerificationDialogOpen(false);
    setSelectedProject(null);
    loadProjects(); // Reload to show updated verification status
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
            <CardTitle className="text-white">My Projects</CardTitle>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="mx-auto h-16 w-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-gray-400 mb-6">Create your first project to get started</p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
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
                      <div className="w-12 h-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <Globe className="h-6 w-6 text-purple-400" />
                      </div>
                      <div className="flex gap-2">
                        {getVerificationBadge(project.verification_status)}
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {project.description || 'No description available'}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Created: {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <ExternalLink size={14} className="mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings size={14} />
                      </Button>
                      
                      {!project.verification_status && (
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleGetVerified(project)}
                        >
                          <Shield size={14} className="mr-1" />
                          Get Verified
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

      <ProjectVerificationDialog
        open={verificationDialogOpen}
        onOpenChange={setVerificationDialogOpen}
        project={selectedProject}
        onSubmit={onVerificationSubmitted}
      />
    </>
  );
};

export default UserProjects;
