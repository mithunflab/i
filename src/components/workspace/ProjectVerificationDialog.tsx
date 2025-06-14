
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase, retrySupabaseRequest } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ProjectVerificationDialogProps {
  projectId: string;
  projectName: string;
  projectData: any;
  isVerified?: boolean;
}

interface VerificationData {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  response_message?: string;
}

const ProjectVerificationDialog: React.FC<ProjectVerificationDialogProps> = ({ 
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
  
  const { user, connectionStatus } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const cleanupRealTimeUpdates = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up verification status subscription');
      try {
        supabase.removeChannel(channelRef.current);
      } catch (error) {
        console.error('Error removing verification channel:', error);
      }
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
  }, []);

  const checkVerificationStatus = async () => {
    if (!user?.id || !mountedRef.current) return;
    
    try {
      const statusRequest = async () => {
        const { data, error } = await supabase
          .from('project_verification_requests')
          .select('status, response_message')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        return data;
      };

      const verificationData = await retrySupabaseRequest(statusRequest) as VerificationData | null;
      
      if (mountedRef.current) {
        setVerificationStatus(verificationData?.status || 'none');
      }
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
    }
  };

  const setupRealTimeUpdates = useCallback(() => {
    if (!user?.id || !projectId || connectionStatus !== 'connected' || !mountedRef.current) {
      return;
    }

    cleanupRealTimeUpdates();
    
    const channelName = `verification-status-${projectId}-${user.id}-${Date.now()}`;
    
    try {
      channelRef.current = supabase
        .channel(channelName)
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
            if (payload.new && typeof payload.new === 'object' && mountedRef.current) {
              const newData = payload.new as VerificationData;
              setVerificationStatus(newData.status);
              
              if (payload.eventType === 'UPDATE') {
                if (newData.status === 'approved') {
                  toast({
                    title: "Verification Approved! 🎉",
                    description: "Your project has been verified successfully.",
                  });
                } else if (newData.status === 'rejected') {
                  toast({
                    title: "Verification Rejected",
                    description: newData.response_message || "Your project verification was rejected.",
                    variant: "destructive"
                  });
                }
              }
            }
          }
        )
        .subscribe((status) => {
          console.log('Verification subscription status:', status);
          if (status === 'CHANNEL_ERROR' && mountedRef.current) {
            // Retry connection after delay
            reconnectTimeoutRef.current = setTimeout(() => {
              if (mountedRef.current) {
                setupRealTimeUpdates();
              }
            }, 5000);
          }
        });
    } catch (error) {
      console.error('Error setting up verification real-time updates:', error);
    }
  }, [user?.id, projectId, connectionStatus, toast, cleanupRealTimeUpdates]);

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
      const submitRequest = async () => {
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

        if (error) throw error;
      };

      await retrySupabaseRequest(submitRequest);

      if (mountedRef.current) {
        toast({
          title: "Verification Requested",
          description: "Your project has been submitted for verification review. You'll receive real-time updates on the status.",
        });

        setOpen(false);
        setVerificationStatus('pending');
      }
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      if (mountedRef.current) {
        toast({
          title: "Error",
          description: error.message || "Failed to submit verification request. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    
    if (user && projectId && connectionStatus === 'connected') {
      checkVerificationStatus();
      setupRealTimeUpdates();
    }

    return () => {
      mountedRef.current = false;
      cleanupRealTimeUpdates();
    };
  }, [user?.id, projectId, connectionStatus, setupRealTimeUpdates]);

  const getButtonContent = () => {
    if (isVerified) {
      return (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-500">Verified</span>
        </>
      );
    }

    switch (verificationStatus) {
      case 'pending':
        return (
          <>
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-yellow-500">Pending Review</span>
          </>
        );
      case 'approved':
        return (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-500">Approved</span>
          </>
        );
      case 'rejected':
        return (
          <>
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="text-red-500">Rejected</span>
          </>
        );
      default:
        return (
          <>
            <Shield className="w-4 h-4" />
            <span>Get Verified</span>
          </>
        );
    }
  };

  const isDisabled = isVerified || verificationStatus === 'pending' || verificationStatus === 'approved' || connectionStatus !== 'connected';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2 h-9 px-3"
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
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !formData.contactEmail.trim() || !formData.websiteDescription.trim() || connectionStatus !== 'connected'}
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
