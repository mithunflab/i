
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Settings, Shield, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

  const onVerificationSubmitted = () => {
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

  const canRequestVerification = (status: string | null) => {
    return status === null || status === 'rejected';
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
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white">My Projects</CardTitle>
          <Button className="cyber-button">
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Globe className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p>Create your first AI-generated website to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg flex items-center gap-2">
                        {project.name}
                        {getVerificationBadge(project.verification_status)}
                      </CardTitle>
                      <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings size={14} className="mr-1" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink size={14} className="mr-1" />
                      View
                    </Button>
                    
                    {canRequestVerification(project.verification_status) && (
                      <ProjectVerificationDialog 
                        project={project} 
                        onVerificationSubmitted={onVerificationSubmitted}
                      />
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
