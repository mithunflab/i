
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useProjectLimits = () => {
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  const FREE_USER_LIMIT = 5;
  const ADMIN_USER_LIMIT = 100;

  useEffect(() => {
    if (user) {
      loadProjectCount();
    }
  }, [user]);

  const loadProjectCount = async () => {
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      if (error) {
        console.error('Error loading project count:', error);
        return;
      }

      setProjectCount(count || 0);
    } catch (error) {
      console.error('Error in loadProjectCount:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxProjects = () => {
    return profile?.role === 'admin' ? ADMIN_USER_LIMIT : FREE_USER_LIMIT;
  };

  const canCreateProject = () => {
    return projectCount < getMaxProjects();
  };

  const getRemainingProjects = () => {
    return Math.max(0, getMaxProjects() - projectCount);
  };

  const getUsagePercentage = () => {
    return Math.round((projectCount / getMaxProjects()) * 100);
  };

  return {
    projectCount,
    maxProjects: getMaxProjects(),
    canCreateProject: canCreateProject(),
    remainingProjects: getRemainingProjects(),
    usagePercentage: getUsagePercentage(),
    loading,
    refreshCount: loadProjectCount
  };
};
