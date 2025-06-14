
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NewProjectDialogProps {
  onProjectCreated: (project: any) => void;
  channelData?: any;
  youtubeUrl?: string;
  projectIdea?: string;
}

const NewProjectDialog: React.FC<NewProjectDialogProps> = ({
  onProjectCreated,
  channelData,
  youtubeUrl,
  projectIdea
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: channelData?.title ? `${channelData.title}-website` : '',
    description: projectIdea || `Website for ${channelData?.title || 'content creator'}`,
    youtubeUrl: youtubeUrl || ''
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const handleCreateProject = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a project",
        variant: "destructive"
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Project Name Required",
        description: "Please enter a project name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🆕 Creating new project...');

      const projectName = `${formData.name}-${Date.now()}`;

      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName,
          description: formData.description,
          youtube_url: formData.youtubeUrl,
          channel_data: channelData,
          status: 'active',
          verified: false
        })
        .select()
        .single();

      if (projectError) {
        throw new Error(`Failed to create project: ${projectError.message}`);
      }

      console.log('✅ New project created:', newProject.name);
      
      toast({
        title: "Project Created",
        description: `Project "${newProject.name}" has been created successfully`,
      });

      onProjectCreated(newProject);
      setOpen(false);

      // Reset form
      setFormData({
        name: '',
        description: '',
        youtubeUrl: ''
      });

    } catch (error) {
      console.error('❌ Error creating project:', error);
      toast({
        title: "Project Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus size={16} className="mr-2" />
          Create New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              disabled={loading}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your project"
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="youtubeUrl">YouTube URL (Optional)</Label>
            <Input
              id="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://youtube.com/@channel"
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProject}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;
