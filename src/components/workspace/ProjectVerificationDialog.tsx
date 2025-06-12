
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectVerificationDialogProps {
  projectId: string;
  projectName: string;
  projectData: any;
  isVerified?: boolean;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({
  projectId,
  projectName,
  projectData,
  isVerified
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contact_email: '',
    website_description: '',
    channel_verification: '',
    additional_info: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      console.log('📋 Submitting verification request...');

      const verificationData = {
        project_id: projectId,
        user_id: user.id,
        project_name: projectName,
        project_url: projectData?.netlify_url || projectData?.github_url || '',
        contact_email: formData.contact_email || user.email || '',
        website_description: formData.website_description || projectData?.description || '',
        channel_verification: formData.channel_verification,
        additional_info: formData.additional_info,
        project_data: projectData,
        status: 'pending',
        verification_type: 'youtube_website'
      };

      const { error } = await supabase
        .from('project_verification_requests')
        .insert(verificationData);

      if (error) {
        console.error('❌ Verification request error:', error);
        if (error.code === '23505') {
          toast({
            title: "Already Requested",
            description: "You've already submitted a verification request for this project.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      console.log('✅ Verification request submitted successfully');
      
      toast({
        title: "🎉 Verification Requested!",
        description: "Your project has been submitted for developer review.",
      });

      setOpen(false);
      setFormData({
        contact_email: '',
        website_description: '',
        channel_verification: '',
        additional_info: ''
      });

    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit verification request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Button variant="outline" size="sm" className="bg-green-500/20 text-green-400 border-green-500/30" disabled>
        <Shield size={14} className="mr-1" />
        Verified
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30"
        >
          <Shield size={14} className="mr-1" />
          Get Verified
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5 text-blue-400" />
            Request Project Verification
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-300">Project: {projectName}</Label>
            <p className="text-sm text-gray-500 mt-1">{projectData?.description}</p>
          </div>
          
          <div>
            <Label htmlFor="contact_email" className="text-sm font-medium text-gray-300">
              Contact Email
            </Label>
            <Input
              id="contact_email"
              type="email"
              placeholder={user?.email || "your@email.com"}
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="website_description" className="text-sm font-medium text-gray-300">
              Website Description
            </Label>
            <Textarea
              id="website_description"
              placeholder="Describe your website and its purpose..."
              value={formData.website_description}
              onChange={(e) => setFormData(prev => ({ ...prev, website_description: e.target.value }))}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="channel_verification" className="text-sm font-medium text-gray-300">
              Channel Verification (Optional)
            </Label>
            <Input
              id="channel_verification"
              placeholder="YouTube channel verification details..."
              value={formData.channel_verification}
              onChange={(e) => setFormData(prev => ({ ...prev, channel_verification: e.target.value }))}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="additional_info" className="text-sm font-medium text-gray-300">
              Additional Information
            </Label>
            <Textarea
              id="additional_info"
              placeholder="Any additional details about your project..."
              value={formData.additional_info}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_info: e.target.value }))}
              className="mt-1 bg-gray-800 border-gray-600 text-white"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-gray-300">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVerificationDialog;
