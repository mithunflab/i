
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, X, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CompactProjectVerificationDialogProps {
  projectData: any;
  onProjectUpdate?: (project: any) => void;
}

const CompactProjectVerificationDialog: React.FC<CompactProjectVerificationDialogProps> = ({
  projectData,
  onProjectUpdate
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('unverified');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (projectData?.verified) {
      setVerificationStatus('verified');
    } else {
      checkVerificationStatus();
    }
  }, [projectData]);

  const checkVerificationStatus = async () => {
    if (!user || !projectData?.id) return;

    try {
      const { data, error } = await supabase
        .from('project_verification_requests')
        .select('status')
        .eq('project_id', projectData.id)
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking verification status:', error);
        return;
      }

      setVerificationStatus(data?.status || 'unverified');
    } catch (error) {
      console.error('Error in checkVerificationStatus:', error);
    }
  };

  const handleSubmitVerification = async () => {
    if (!user || !projectData?.id) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_verification_requests')
        .insert({
          user_id: user.id,
          project_id: projectData.id,
          status: 'pending',
          request_message: `Verification request for project: ${projectData.name}`
        });

      if (error) throw error;

      setVerificationStatus('pending');
      toast({
        title: "Verification Requested",
        description: "Your project has been submitted for verification.",
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: "Failed to submit verification request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle size={12} className="text-green-400" />;
      case 'pending':
        return <Clock size={12} className="text-yellow-400" />;
      case 'rejected':
        return <X size={12} className="text-red-400" />;
      default:
        return <AlertCircle size={12} className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Verify';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'bg-green-500/20 border-green-500 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 border-red-500 text-red-400';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  if (verificationStatus === 'verified') {
    return (
      <Badge className={`text-xs ${getStatusColor()}`}>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <Shield size={10} />
          <span>Verified</span>
        </div>
      </Badge>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSubmitVerification}
      disabled={isSubmitting || verificationStatus === 'pending'}
      className={`text-xs h-7 ${getStatusColor()}`}
    >
      <div className="flex items-center gap-1">
        {getStatusIcon()}
        <span>{isSubmitting ? 'Submitting...' : getStatusText()}</span>
      </div>
    </Button>
  );
};

export default CompactProjectVerificationDialog;
