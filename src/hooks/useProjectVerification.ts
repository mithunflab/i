
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useProjectVerification = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submitVerificationRequest = async (projectId: string, projectData: any) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit verification request",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from('project_verification_requests')
        .insert({
          user_id: user.id,
          project_id: projectId,
          project_name: projectData.name || 'Untitled Project',
          project_url: projectData.netlify_url || '',
          github_url: projectData.github_url || '',
          description: projectData.description || '',
          status: 'pending',
          submitted_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Verification Request Submitted",
        description: "Your project has been submitted for verification. We'll review it within 24-48 hours.",
      });

      return true;
    } catch (error) {
      console.error('Verification submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit verification request. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitVerificationRequest,
    isSubmitting
  };
};
