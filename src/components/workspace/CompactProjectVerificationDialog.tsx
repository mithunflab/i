
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CompactProjectVerificationDialogProps {
  projectId: string;
  projectName: string;
  projectData: any;
  isVerified?: boolean;
}

interface VerificationData {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  response_message?: string;
}

const CompactProjectVerificationDialog: React.FC<CompactProjectVerificationDialogProps> = ({ 
  projectId,
  projectName,
  projectData,
  isVerified = false
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [formData, setFormData] = useState({
    contactEmail: '',
    websiteDescription: '',
    additionalInfo: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Check existing verification status
  useEffect(() => {
    if (user && projectId) {
      checkVerificationStatus();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('verification-status')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_verification_requests',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('Verification status changed:', payload);
            if (payload.new && typeof payload.new === 'object') {
              const newData = payload.new as VerificationData;
              setVerificationStatus(newData.status);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, projectId]);

  const checkVerificationStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('project_verification_requests')
        .select('status')
        .eq('project_id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking verification status:', error);
        return;
      }

      const verificationData = data as VerificationData | null;
      setVerificationStatus(verificationData?.status || 'none');
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.contactEmail.trim() || !formData.websiteDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        project_id: projectId,
        user_id: user.id,
        project_name: projectName,
        project_url: projectData?.netlify_url || projectData?.github_url || '',
        contact_email: formData.contactEmail.trim(),
        website_description: formData.websiteDescription.trim(),
        additional_info: formData.additionalInfo.trim(),
        project_data: projectData,
        status: 'pending',
        verification_type: 'youtube_website'
      };

      const { error } = await supabase
        .from('project_verification_requests')
        .upsert(requestData, {
          onConflict: 'project_id,user_id',
          ignoreDuplicates: false
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
      setVerificationStatus('pending');
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

  const getButtonContent = () => {
    if (isVerified) {
      return (
        <>
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-green-500 text-xs">Verified</span>
        </>
      );
    }

    switch (verificationStatus) {
      case 'pending':
        return (
          <>
            <Clock className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-500 text-xs">Pending</span>
          </>
        );
      case 'approved':
        return (
          <>
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-green-500 text-xs">Approved</span>
          </>
        );
      case 'rejected':
        return (
          <>
            <XCircle className="w-3 h-3 text-red-500" />
            <span className="text-red-500 text-xs">Rejected</span>
          </>
        );
      default:
        return (
          <>
            <Shield className="w-3 h-3" />
            <span className="text-xs">Verify</span>
          </>
        );
    }
  };

  const isDisabled = isVerified || verificationStatus === 'pending' || verificationStatus === 'approved';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 h-7 px-2 text-xs min-w-[70px]"
          disabled={isDisabled}
        >
          {getButtonContent()}
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
            <Label className="text-sm font-medium">Project: {projectName}</Label>
          </div>
          
          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Contact Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={formData.contactEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Website Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your website's purpose and features"
              value={formData.websiteDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, websiteDescription: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="additional" className="text-sm font-medium">
              Additional Information
            </Label>
            <Textarea
              id="additional"
              placeholder="Why should this project be verified? (quality, originality, usefulness, etc.)"
              value={formData.additionalInfo}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="text-xs h-8">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.contactEmail.trim() || !formData.websiteDescription.trim()}
              className="bg-green-600 hover:bg-green-700 text-xs h-8"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompactProjectVerificationDialog;
