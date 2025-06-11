
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ProjectVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  onSubmit: () => void;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({
  open,
  onOpenChange,
  project,
  onSubmit
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!project || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: project.id,
          user_id: user.id,
          request_message: message || 'Please verify my project for enhanced features and credibility.'
        });

      if (error) {
        console.error('Error submitting verification request:', error);
        toast({
          title: "Error",
          description: "Failed to submit verification request",
          variant: "destructive"
        });
        return;
      }

      onSubmit();
      setMessage('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Get Project Verified
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {project && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-white mb-1">{project.name}</h3>
              <p className="text-sm text-gray-400">{project.description}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="font-medium text-green-400 mb-1">Verification Benefits</h4>
                <ul className="text-gray-300 space-y-1">
                  <li>• Enhanced credibility and trust</li>
                  <li>• Priority support and features</li>
                  <li>• Verification badge display</li>
                  <li>• Access to premium tools</li>
                </ul>
              </div>
            </div>

            <div>
              <Label htmlFor="verification-message" className="text-gray-300">
                Additional Message (Optional)
              </Label>
              <Textarea
                id="verification-message"
                placeholder="Tell us more about your project and why it should be verified..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-2 bg-gray-800 border-gray-600 text-white"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVerificationDialog;
