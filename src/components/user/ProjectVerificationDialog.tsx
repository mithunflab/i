
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectVerificationDialogProps {
  project: Project;
  onVerificationSubmitted: () => void;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({ 
  project, 
  onVerificationSubmitted 
}) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: project.id,
          user_id: user.id,
          request_message: message.trim(),
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting verification request:', error);
        toast({
          title: "Error",
          description: "Failed to submit verification request. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Verification Requested",
        description: "Your project has been submitted for verification review.",
      });

      setOpen(false);
      setMessage('');
      onVerificationSubmitted();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1 h-9">
          <Shield className="w-3 h-3" />
          Get Verified
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Request Project Verification
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Project: {project.name}</Label>
            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Why should this project be verified?
            </Label>
            <Textarea
              id="message"
              placeholder="Explain why your project deserves verification (quality, originality, usefulness, etc.)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !message.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVerificationDialog;
