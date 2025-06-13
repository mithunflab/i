
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Shield, Send, AlertCircle, Star, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  isVerified = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(false);
  const [formData, setFormData] = useState({
    contactEmail: '',
    websiteDescription: '',
    channelVerification: '',
    additionalInfo: '',
    agreeToTerms: false
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmitVerification = async () => {
    if (!user || !projectId) return;

    try {
      setLoading(true);
      console.log('📋 Submitting verification request for project:', projectId);

      // Validate form
      if (!formData.contactEmail || !formData.websiteDescription) {
        toast({
          title: "Incomplete Form",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Submit verification request
      const { data, error } = await supabase
        .from('project_verification_requests')
        .insert({
          project_id: projectId,
          user_id: user.id,
          contact_email: formData.contactEmail,
          website_description: formData.websiteDescription,
          channel_verification: formData.channelVerification,
          additional_info: formData.additionalInfo,
          project_data: projectData,
          status: 'pending',
          verification_type: 'youtube_website'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ Verification request submitted successfully:', data.id);
      
      setSubmittedRequest(true);
      
      toast({
        title: "Verification Submitted! 🎉",
        description: "Your project has been sent for developer review. You'll be notified once approved.",
      });

      // Reset form after short delay
      setTimeout(() => {
        setIsOpen(false);
        setSubmittedRequest(false);
        setFormData({
          contactEmail: '',
          websiteDescription: '',
          channelVerification: '',
          additionalInfo: '',
          agreeToTerms: false
        });
      }, 3000);

    } catch (error) {
      console.error('❌ Error submitting verification:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit verification request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Button variant="outline" className="flex items-center gap-2 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20">
        <CheckCircle size={16} />
        <span>Verified</span>
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20">
          <Shield size={16} />
          <span>Get Verified</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-purple-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-white">
            <Award className="text-yellow-400" size={24} />
            Project Verification Request
          </DialogTitle>
        </DialogHeader>

        {submittedRequest ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Request Submitted!</h3>
            <p className="text-gray-400 mb-4">
              Your verification request has been sent to our developer team for review.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                ⏱️ <strong>Review Time:</strong> 24-48 hours<br/>
                📧 <strong>Notification:</strong> You'll receive an email update<br/>
                ✨ <strong>Verification Badge:</strong> Will appear near your YouTube channel logo once approved
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Verification Benefits */}
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Star className="text-yellow-400" size={16} />
                Verification Benefits
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>✅ Verified badge near your YouTube channel logo</li>
                <li>✅ Enhanced credibility and trust</li>
                <li>✅ Priority support and features</li>
                <li>✅ Professional status recognition</li>
              </ul>
            </div>

            {/* Project Information */}
            <div className="bg-black/30 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Project Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-400">Project Name</Label>
                  <p className="text-white">{projectName}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Channel</Label>
                  <p className="text-white">{projectData?.channel_data?.title || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Subscribers</Label>
                  <p className="text-white">
                    {projectData?.channel_data?.subscriberCount 
                      ? parseInt(projectData.channel_data.subscriberCount).toLocaleString()
                      : 'N/A'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <Badge variant="outline" className="text-green-400 border-green-500/30">
                    {projectData?.status || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Verification Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactEmail" className="text-white mb-2 block">
                  Contact Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="websiteDescription" className="text-white mb-2 block">
                  Website Description <span className="text-red-400">*</span>
                </Label>
                <Textarea
                  id="websiteDescription"
                  placeholder="Describe your website's purpose, target audience, and key features..."
                  value={formData.websiteDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, websiteDescription: e.target.value }))}
                  className="bg-black/50 border-purple-500/30 text-white min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="channelVerification" className="text-white mb-2 block">
                  YouTube Channel Verification
                </Label>
                <Input
                  id="channelVerification"
                  placeholder="Provide your YouTube channel verification details (if verified)"
                  value={formData.channelVerification}
                  onChange={(e) => setFormData(prev => ({ ...prev, channelVerification: e.target.value }))}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="additionalInfo" className="text-white mb-2 block">
                  Additional Information
                </Label>
                <Textarea
                  id="additionalInfo"
                  placeholder="Any additional information that supports your verification request..."
                  value={formData.additionalInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                  className="bg-black/50 border-purple-500/30 text-white"
                />
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2">
                <AlertCircle size={16} />
                Verification Requirements
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Professional website design and content</li>
                <li>• Active YouTube channel with real content</li>
                <li>• Accurate channel information and data</li>
                <li>• Responsive design and mobile compatibility</li>
                <li>• No inappropriate or misleading content</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSubmitVerification}
                disabled={loading || !formData.contactEmail || !formData.websiteDescription}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Send size={16} className="mr-2" />
                )}
                Submit for Verification
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-gray-600 text-gray-400 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProjectVerificationDialog;
