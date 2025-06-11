
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CheckCircle, XCircle, Eye, Globe, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  is_verified?: boolean;
}

const ProjectApproval = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('projects_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadProjects();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
        return;
      }

      const formattedProjects: Project[] = (data || []).map(project => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.status as 'active' | 'pending' | 'approved' | 'rejected',
        created_at: project.created_at,
        user_id: project.user_id,
        user_name: project.profiles?.full_name || 'Unknown User',
        user_email: project.profiles?.email || 'No email',
        is_verified: project.status === 'approved'
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error in loadProjects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProjectStatus = async (projectId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) {
        console.error('Error updating project status:', error);
        toast({
          title: "Error",
          description: "Failed to update project status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Project ${newStatus} successfully`,
      });

      // Update local state
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, status: newStatus, is_verified: newStatus === 'approved' }
          : project
      ));
    } catch (error) {
      console.error('Error in updateProjectStatus:', error);
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || project.status === filter;
    
    return matchesSearch && matchesFilter;
  });

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
        <CardTitle className="text-white">Project Approval Management</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search projects, users, or emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className={filter === filterOption ? "bg-purple-600" : "border-gray-600 text-white hover:bg-white/10"}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No projects found
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center relative">
                    <Globe className="h-5 w-5 text-purple-400" />
                    {project.is_verified && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{project.name}</h3>
                      {project.is_verified && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{project.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>By: {project.user_name} ({project.user_email})</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={
                      project.status === 'approved' ? 'default' : 
                      project.status === 'pending' ? 'secondary' : 
                      'destructive'
                    }
                    className={
                      project.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {project.status}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-gray-600 text-white hover:bg-white/10"
                    >
                      <Eye size={14} />
                    </Button>
                    
                    {project.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateProjectStatus(project.id, 'approved')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateProjectStatus(project.id, 'rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle size={14} />
                        </Button>
                      </>
                    )}
                    
                    {project.status === 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'rejected')}
                        variant="destructive"
                      >
                        <XCircle size={14} />
                      </Button>
                    )}
                    
                    {project.status === 'rejected' && (
                      <Button
                        size="sm"
                        onClick={() => updateProjectStatus(project.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle size={14} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectApproval;
