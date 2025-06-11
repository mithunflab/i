
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Eye, Globe, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Project {
  id: string;
  title: string;
  url: string;
  description: string;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  preview_image?: string;
}

const ProjectApproval = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // Mock data for now - in real implementation, this would come from database
      const mockProjects: Project[] = [
        {
          id: '1',
          title: 'Tech Blog Website',
          url: 'https://tech-blog-demo.netlify.app',
          description: 'A modern tech blog with YouTube integration',
          user_name: 'John Doe',
          user_email: 'john@example.com',
          status: 'pending',
          created_at: '2024-01-15',
          preview_image: '/placeholder.svg'
        },
        {
          id: '2',
          title: 'Gaming Channel Site',
          url: 'https://gaming-channel.netlify.app',
          description: 'Gaming content showcase with video gallery',
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          status: 'approved',
          created_at: '2024-01-10',
          preview_image: '/placeholder.svg'
        },
        {
          id: '3',
          title: 'Cooking Tutorial Hub',
          url: 'https://cooking-hub.netlify.app',
          description: 'Recipe website with YouTube video integration',
          user_name: 'Mike Johnson',
          user_email: 'mike@example.com',
          status: 'pending',
          created_at: '2024-01-20',
          preview_image: '/placeholder.svg'
        }
      ];

      setProjects(mockProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (projectId: string, status: 'approved' | 'rejected') => {
    try {
      // Update project status in database
      setProjects(prev => 
        prev.map(project => 
          project.id === projectId 
            ? { ...project, status }
            : project
        )
      );

      // In real implementation, this would update the database
      console.log(`Project ${projectId} ${status}`);
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <div className="space-y-6">
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            Project Approval Management
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search projects, users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(status as any)}
                  className={filter === status ? 'bg-purple-600' : 'border-gray-600 text-white hover:bg-white/10'}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No projects found
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id} className="border border-gray-700 rounded-lg bg-gray-800/30 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                          {project.status === 'approved' && (
                            <Badge variant="default" className="bg-green-600 text-white">
                              <Check size={12} className="mr-1" />
                              Verified
                            </Badge>
                          )}
                          <Badge 
                            variant={
                              project.status === 'approved' ? 'default' : 
                              project.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-gray-300 mb-2">{project.description}</p>
                        <div className="text-sm text-gray-400">
                          <p>Created by: {project.user_name} ({project.user_email})</p>
                          <p>Created: {new Date(project.created_at).toLocaleDateString()}</p>
                          <p className="flex items-center gap-1 mt-1">
                            <Globe size={14} />
                            <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                              {project.url}
                            </a>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(project.url, '_blank')}
                          className="border-gray-600 text-white hover:bg-white/10"
                        >
                          <Eye size={14} className="mr-1" />
                          Preview
                        </Button>
                        {project.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(project.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(project.id, 'rejected')}
                            >
                              <X size={14} className="mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {project.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApproval(project.id, 'rejected')}
                            className="border-red-600 text-red-400 hover:bg-red-600/10"
                          >
                            <X size={14} className="mr-1" />
                            Revoke
                          </Button>
                        )}
                        {project.status === 'rejected' && (
                          <Button
                            size="sm"
                            onClick={() => handleApproval(project.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check size={14} className="mr-1" />
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-white">{projects.length}</div>
            <div className="text-sm text-gray-400">Total Projects</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{projects.filter(p => p.status === 'pending').length}</div>
            <div className="text-sm text-gray-400">Pending Approval</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{projects.filter(p => p.status === 'approved').length}</div>
            <div className="text-sm text-gray-400">Approved</div>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{projects.filter(p => p.status === 'rejected').length}</div>
            <div className="text-sm text-gray-400">Rejected</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectApproval;
