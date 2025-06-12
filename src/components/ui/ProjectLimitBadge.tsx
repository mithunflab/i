
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Crown } from 'lucide-react';
import { useProjectLimits } from '@/hooks/useProjectLimits';

const ProjectLimitBadge = () => {
  const { projectCount, maxProjects, usagePercentage, canCreateProject } = useProjectLimits();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Badge 
          variant={canCreateProject ? "secondary" : "destructive"}
          className="flex items-center gap-1"
        >
          {!canCreateProject && <AlertTriangle size={12} />}
          {projectCount}/{maxProjects} Projects
          {maxProjects > 5 && <Crown size={12} className="text-yellow-400" />}
        </Badge>
      </div>
      
      <Progress 
        value={usagePercentage} 
        className="h-2"
      />
      
      {!canCreateProject && (
        <p className="text-xs text-red-400">
          Project limit reached. Upgrade to Pro for more projects.
        </p>
      )}
    </div>
  );
};

export default ProjectLimitBadge;
