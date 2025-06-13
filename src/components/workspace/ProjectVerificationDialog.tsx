
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
  verificationStatus?: string;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({
  projectId,
  projectName,
  projectData,
  isVerified,
  verificationStatus
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading || !message.trim()) return;

    setLoading(true);
    try {
      console.log('📋 Submitting verification request...');

      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('project_verification_requests')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking existing request:', checkError);
        throw new Error('Failed to check existing verification requests');
      }

      if (existingRequest) {
        toast({
          title: "Already Requested",
          description: `You've already submitted a verification request for this project. Status: ${existingRequest.status}`,
          variant: "destructive"
        });
        return;
      }

      // Create new verification request with correct schema
      const verificationData = {
        project_id: projectId,
        user_id: user.id,
        request_message: message.trim(),
        status: 'pending'
      };

      console.log('💾 Inserting verification request:', verificationData);

      const { error: insertError } = await supabase
        .from('project_verification_requests')
        .insert(verificationData);

      if (insertError) {
        console.error('❌ Verification request error:', insertError);
        throw new Error(insertError.message || 'Failed to submit verification request');
      }

      console.log('✅ Verification request submitted successfully');
      
      toast({
        title: "🎉 Verification Requested!",
        description: "Your project has been submitted for developer review.",
      });

      setOpen(false);
      setMessage('');

    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Unable to submit verification request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show verified badge if actually verified AND approved
  if (isVerified && verificationStatus === 'approved') {
    return (
      <Button variant="outline" size="sm" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs h-7" disabled>
        <Shield size={10} className="mr-1" />
        Verified
      </Button>
    );
  }

  // Show pending status
  if (verificationStatus === 'pending') {
    return (
      <Button variant="outline" size="sm" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs h-7" disabled>
        <Shield size={10} className="mr-1" />
        Pending Review
      </Button>
    );
  }

  // Show rejected status
  if (verificationStatus === 'rejected') {
    return (
      <Button variant="outline" size="sm" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs h-7" disabled>
        <Shield size={10} className="mr-1" />
        Rejected
      </Button>
    );
  }

  // Show verification request button for non-verified projects
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30 text-xs h-7"
        >
          <Shield size={10} className="mr-1" />
          Get Verified
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white text-sm">
            <Shield className="w-4 h-4 text-blue-400" />
            Request Project Verification
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-300">Project: {projectName}</Label>
            <p className="text-xs text-gray-500 mt-1">{projectData?.description || 'No description available'}</p>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-xs font-medium text-gray-300">
              Why should this project be verified?
            </Label>
            <Textarea
              id="message"
              placeholder="Explain why your project deserves verification (quality, originality, usefulness, etc.)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 bg-gray-800 border-gray-600 text-white text-xs"
              rows={4}
              required
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="text-gray-300 text-xs h-8">
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={loading || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
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
