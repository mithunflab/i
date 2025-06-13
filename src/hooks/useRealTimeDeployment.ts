
import { useState, useCallback } from 'react';
import { useNetlifyDeploy } from './useNetlifyDeploy';

type DeploymentStatus = 'idle' | 'deploying' | 'deployed' | 'failed';

export const useRealTimeDeployment = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('idle');
  const { deployToNetlify, updateNetlifyDeployment } = useNetlifyDeploy();

  const deployToNetlify = useCallback(async (
    projectId: string,
    projectName: string,
    code: string,
    existingUrl?: string
  ): Promise<string | null> => {
    try {
      setDeploymentStatus('deploying');
      
      let result;
      if (existingUrl) {
        result = await updateNetlifyDeployment(existingUrl, code);
        setDeploymentStatus('deployed');
        return existingUrl;
      } else {
        result = await deployToNetlify(projectName, code);
        setDeploymentStatus('deployed');
        return result.url;
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeploymentStatus('failed');
      return null;
    }
  }, [deployToNetlify, updateNetlifyDeployment]);

  return {
    deployToNetlify,
    deploymentStatus
  };
};
