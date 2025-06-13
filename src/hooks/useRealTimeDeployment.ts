
import { useState, useCallback } from 'react';
import { useNetlifyDeploy } from './useNetlifyDeploy';

interface DeploymentStatusObject {
  status: 'idle' | 'deploying' | 'deployed' | 'failed';
  message?: string;
  progress?: number;
}

export const useRealTimeDeployment = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatusObject>({
    status: 'idle'
  });
  const { deployToNetlify: netlifyDeploy, updateNetlifyDeployment } = useNetlifyDeploy();

  const deployToNetlify = useCallback(async (
    projectId: string,
    projectName: string,
    code: string,
    existingUrl?: string
  ): Promise<string | null> => {
    try {
      setDeploymentStatus({
        status: 'deploying',
        message: 'Deploying to Netlify...',
        progress: 25
      });
      
      let result;
      if (existingUrl) {
        result = await updateNetlifyDeployment(existingUrl, code);
        setDeploymentStatus({
          status: 'deployed',
          message: 'Updated successfully'
        });
        return existingUrl;
      } else {
        result = await netlifyDeploy(projectName, code);
        setDeploymentStatus({
          status: 'deployed',
          message: 'Deployed successfully'
        });
        return result.url;
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Deployment failed'
      });
      return null;
    }
  }, [netlifyDeploy, updateNetlifyDeployment]);

  return {
    deployToNetlify,
    deploymentStatus
  };
};
