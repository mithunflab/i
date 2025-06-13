
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Globe, 
  Shield, 
  CheckCircle, 
  Users, 
  Play, 
  Calendar,
  ExternalLink
} from 'lucide-react';
import ProjectVerificationDialog from './ProjectVerificationDialog';

interface Project {
  id: string;
  name: string;
  description: string;
  youtube_url: string;
  github_url?: string;
  netlify_url?: string;
  channel_data?: any;
  verified?: boolean;
  created_at: string;
  updated_at: string;
}

interface EnhancedProjectCardProps {
  project: Project;
  onVerificationSubmitted: () => void;
}

const EnhancedProjectCard: React.FC<EnhancedProjectCardProps> = ({ 
  project, 
  onVerificationSubmitted 
}) => {
  const channelData = project.channel_data;

  return (
    <Card className="bg-white/5 border-gray-800 hover:bg-white/10 transition-colors overflow-hidden">
      <CardContent className="p-0">
        {/* Header with Channel Info */}
        {channelData && (
          <div className="p-4 bg-gradient-to-r from-red-500/10 to-purple-500/10 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={channelData.thumbnail} 
                  alt={channelData.title}
                  className="w-12 h-12 rounded-full object-cover border-2 border-red-500"
                />
                {project.verified && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  {channelData.title}
                  {project.verified && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {parseInt(channelData.subscriberCount || '0').toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Play size={12} />
                    {parseInt(channelData.videoCount || '0').toLocaleString()} videos
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Project Details */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-white mb-1">{project.name}</h4>
              <p className="text-gray-400 text-sm">{project.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              onClick={() => window.open(`/workspace?url=${encodeURIComponent(project.youtube_url)}&idea=${encodeURIComponent(project.description)}${channelData ? `&channelData=${encodeURIComponent(JSON.stringify(channelData))}` : ''}`, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Open Workspace
            </Button>

            {project.github_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(project.github_url, '_blank')}
                className="border-gray-600 text-white hover:bg-white/10"
              >
                <Github className="w-4 h-4 mr-1" />
                GitHub
              </Button>
            )}

            {project.netlify_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(project.netlify_url, '_blank')}
                className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
              >
                <Globe className="w-4 h-4 mr-1" />
                Live Site
              </Button>
            )}

            {/* Verification Button - positioned prominently */}
            {!project.verified && (
              <ProjectVerificationDialog
                project={project}
                onVerificationSubmitted={onVerificationSubmitted}
              />
            )}
          </div>

          {/* Project Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-700">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
            <span>
              Updated {new Date(project.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedProjectCard;
