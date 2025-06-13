
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface FixedProjectVerificationProps {
  projectId: string;
  projectName: string;
}

const FixedProjectVerification: React.FC<FixedProjectVerificationProps> = ({
  projectId,
  projectName
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [statusMessage, setStatusMessage] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && projectId) {
      checkVerificationStatus();
    }
  }, [user, projectId]);

  const checkVerificationStatus = async () => {
    try {
      console.log('🔍 Checking verification status for project:', projectId);

      const { data, error } = await supabase
        .from('project_verification_requests')
        .select('status, request_message, response_message')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Error checking verification:', error);
        return;
      }

      if (data) {
        setVerificationStatus(data.status as any);
        setStatusMessage(data.response_message || '');
        console.log('✅ Verification status:', data.status);
      }

    } catch (error) {
      console.error('❌ Failed to check verification status:', error);
    }
  };

  const submitVerificationRequest = async () => {
    if (!user || !message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message explaining why your project should be verified.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('📋 Submitting verification request...');

      // Insert new verification request
      const { error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: projectId,
          user_id: user.id,
          request_message: message.trim(),
          status: 'pending'
        });

      if (error) {
        console.error('❌ Verification request error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Verification request submitted successfully');
      
      setVerificationStatus('pending');
      setMessage('');
      setOpen(false);

      toast({
        title: "🎉 Verification Requested!",
        description: "Your project has been submitted for review.",
      });

    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Unable to submit request.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Render based on verification status
  if (verificationStatus === 'approved') {
    return (
      <Button variant="outline" size="sm" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs h-7" disabled>
        <CheckCircle size={10} className="mr-1" />
        Verified
      </Button>
    );
  }

  if (verificationStatus === 'pending') {
    return (
      <Button variant="outline" size="sm" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs h-7" disabled>
        <Clock size={10} className="mr-1" />
        Under Review
      </Button>
    );
  }

  if (verificationStatus === 'rejected') {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs h-7">
            <XCircle size={10} className="mr-1" />
            Rejected - Retry
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-sm">
              <Shield className="w-4 h-4 text-red-400" />
              Resubmit Verification Request
            </DialogTitle>
          </DialogHeader>
          
          {statusMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">
                <strong>Previous rejection reason:</strong> {statusMessage}
              </p>
            </div>
          )}
          
          <form onSubmit={(e) => { e.preventDefault(); submitVerificationRequest(); }} className="space-y-3">
            <div>
              <Label className="text-xs font-medium text-gray-300">Project: {projectName}</Label>
            </div>
            
            <div>
              <Label htmlFor="message" className="text-xs font-medium text-gray-300">
                Why should this project be verified? (Address previous concerns)
              </Label>
              <Textarea
                id="message"
                placeholder="Explain improvements made and why your project deserves verification..."
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
                {loading ? 'Submitting...' : 'Resubmit Request'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Default state - show verification request button
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
        
        <form onSubmit={(e) => { e.preventDefault(); submitVerificationRequest(); }} className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-300">Project: {projectName}</Label>
            <p className="text-xs text-gray-500 mt-1">Request verification for your project to gain credibility</p>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-xs font-medium text-gray-300">
              Why should this project be verified?
            </Label>
            <Textarea
              id="message"
              placeholder="Explain the quality, originality, and value of your project..."
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

export default FixedProjectVerification;
