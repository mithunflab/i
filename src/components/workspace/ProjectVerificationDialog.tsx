
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldCheck, Send, Loader2 } from 'lucide-react';

interface ProjectVerificationDialogProps {
  projectId: string;
  projectName: string;
  projectData: any;
  isVerified: boolean;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({
  projectId,
  projectName,
  projectData,
  isVerified
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_name: projectName,
    project_url: projectData?.netlify_url || projectData?.github_url || '',
    contact_email: '',
    website_description: projectData?.description || '',
    channel_verification: projectData?.youtube_url || '',
    additional_info: '',
    verification_type: 'youtube_website'
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      console.log('📝 Submitting verification request...', formData);

      const { data, error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: projectId,
          user_id: user.id,
          project_name: formData.project_name,
          project_url: formData.project_url,
          contact_email: formData.contact_email,
          website_description: formData.website_description,
          channel_verification: formData.channel_verification,
          additional_info: formData.additional_info,
          verification_type: formData.verification_type,
          project_data: projectData,
          status: 'pending',
          request_message: `Verification request for ${formData.project_name}`
        });

      if (error) {
        console.error('❌ Verification request error:', error);
        throw error;
      }

      console.log('✅ Verification request submitted:', data);
      
      toast({
        title: "Verification Request Submitted",
        description: "Your project has been submitted for verification. We'll review it shortly.",
      });

      setIsOpen(false);
      
    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit verification request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isVerified) {
    return (
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
        <ShieldCheck size={12} className="mr-1" />
        Verified
      </Badge>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <ShieldCheck size={12} className="mr-1" />
          Request Verification
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-400" />
            Project Verification
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name" className="text-sm">Project Name</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => handleInputChange('project_name', e.target.value)}
              className="bg-gray-800 border-gray-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_url" className="text-sm">Project URL</Label>
            <Input
              id="project_url"
              type="url"
              value={formData.project_url}
              onChange={(e) => handleInputChange('project_url', e.target.value)}
              placeholder="https://your-project-url.com"
              className="bg-gray-800 border-gray-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email" className="text-sm">Contact Email</Label>
            <Input
              id="contact_email"
              type="email"
              value={formData.contact_email}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              placeholder="your-email@example.com"
              className="bg-gray-800 border-gray-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website_description" className="text-sm">Website Description</Label>
            <Textarea
              id="website_description"
              value={formData.website_description}
              onChange={(e) => handleInputChange('website_description', e.target.value)}
              placeholder="Describe your website and its purpose..."
              className="bg-gray-800 border-gray-600 min-h-[80px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel_verification" className="text-sm">YouTube Channel URL</Label>
            <Input
              id="channel_verification"
              value={formData.channel_verification}
              onChange={(e) => handleInputChange('channel_verification', e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="bg-gray-800 border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_info" className="text-sm">Additional Information</Label>
            <Textarea
              id="additional_info"
              value={formData.additional_info}
              onChange={(e) => handleInputChange('additional_info', e.target.value)}
              placeholder="Any additional information about your project..."
              className="bg-gray-800 border-gray-600 min-h-[60px]"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={14} className="mr-2" />
                Submit for Verification
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVerificationDialog;
