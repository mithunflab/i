
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, CheckCircle, XCircle, Eye, Globe, Clock, Shield, MessageSquare } from 'lucide-react';
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

interface VerificationRequest {
  id: string;
  project_id: string;
  project_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  request_message: string;
  requested_at: string;
  admin_notes?: string;
}

const ProjectApproval = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
        loadData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_verification_requests' }, () => {
        loadData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      // Load projects with user info
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) {
        console.error('Error loading projects:', projectsError);
        toast({
          title: "Error",
          description: "Failed to load projects",
          variant: "destructive"
        });
        return;
      }

      // Load verification requests with project and user info
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('project_verification_requests')
        .select(`
          *,
          projects!inner(name),
          profiles!inner(full_name, email)
        `)
        .order('requested_at', { ascending: false });

      if (verificationsError) {
        console.error('Error loading verification requests:', verificationsError);
      }

      // Get user profiles for projects
      const userIds = projectsData?.map(project => project.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
      }

      // Create profiles map
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Format projects data
      const formattedProjects: Project[] = (projectsData || []).map(project => {
        const profile = profilesMap.get(project.user_id);
        return {
          id: project.id,
          name: project.name,
          description: project.description || '',
          status: project.status as 'active' | 'pending' | 'approved' | 'rejected',
          created_at: project.created_at,
          user_id: project.user_id,
          user_name: profile?.full_name || 'Unknown User',
          user_email: profile?.email || 'No email',
          is_verified: project.status === 'approved'
        };
      });

      // Format verification requests
      const formattedVerifications: VerificationRequest[] = (verificationsData || []).map(req => ({
        id: req.id,
        project_id: req.project_id,
        project_name: req.projects?.name || 'Unknown Project',
        user_id: req.user_id,
        user_name: req.profiles?.full_name || 'Unknown User',
        user_email: req.profiles?.email || 'No email',
        status: req.status,
        request_message: req.request_message || 'No message provided',
        requested_at: req.requested_at,
        admin_notes: req.admin_notes
      }));

      setProjects(formattedProjects);
      setVerificationRequests(formattedVerifications);
    } catch (error) {
      console.error('Error in loadData:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
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

      loadData();
    } catch (error) {
      console.error('Error in updateProjectStatus:', error);
    }
  };

  const updateVerificationStatus = async (requestId: string, newStatus: 'approved' | 'rejected', adminNotes?: string) => {
    try {
      const { error } = await supabase
        .from('project_verification_requests')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error updating verification status:', error);
        toast({
          title: "Error",
          description: "Failed to update verification status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `Verification request ${newStatus} successfully`,
      });

      loadData();
    } catch (error) {
      console.error('Error in updateVerificationStatus:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || project.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  const filteredVerifications = verificationRequests.filter(req => {
    const matchesSearch = req.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || req.status === filter;
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Project Management</CardTitle>
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
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Globe size={16} />
              Projects ({projects.length})
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex items-center gap-2">
              <Shield size={16} />
              Verification Requests ({verificationRequests.filter(r => r.status === 'pending').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
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
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No verification requests found
              </div>
            ) : (
              filteredVerifications.map((request) => (
                <div key={request.id} className="p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{request.project_name}</h3>
                          <Badge 
                            variant={
                              request.status === 'approved' ? 'default' : 
                              request.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                            className={
                              request.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                              request.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border-red-500/30'
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">By: {request.user_name} ({request.user_email})</p>
                        
                        {request.request_message && (
                          <div className="flex items-start gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-300 italic">"{request.request_message}"</p>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Requested: {new Date(request.requested_at).toLocaleDateString()}
                        </div>
                        
                        {request.admin_notes && (
                          <div className="mt-2 p-2 bg-gray-700/50 rounded text-sm text-gray-300">
                            <strong>Admin Notes:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateVerificationStatus(request.id, 'approved', 'Project approved for verification')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateVerificationStatus(request.id, 'rejected', 'Verification request rejected')}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle size={14} />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectApproval;
