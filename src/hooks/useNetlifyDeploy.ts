
import { useState } from 'react';
import { apiKeyManager } from '@/utils/apiKeyManager';
import { useToast } from '@/hooks/use-toast';

interface NetlifyDeployment {
  url: string;
  admin_url: string;
  site_id: string;
}

export const useNetlifyDeploy = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deployToNetlify = async (siteName: string, code: string) => {
    setLoading(true);
    try {
      console.log('🌐 Deploying to Netlify:', siteName);
      
      const netlifyToken = await apiKeyManager.getNetlifyKey();
      if (!netlifyToken) {
        throw new Error('Netlify API key not available');
      }

      // Create site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: siteName.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (!siteResponse.ok) {
        const error = await siteResponse.json();
        throw new Error(`Failed to create Netlify site: ${error.message}`);
      }

      const site = await siteResponse.json();
      console.log('✅ Netlify site created:', site.url);

      // Deploy files
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/zip',
        },
        body: await createZipFile(code)
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.json();
        throw new Error(`Failed to deploy: ${error.message}`);
      }

      const deployment: NetlifyDeployment = await deployResponse.json();
      
      toast({
        title: "Netlify Deployment Success",
        description: `Site deployed to ${deployment.url}`,
      });

      return deployment;
    } catch (error) {
      console.error('❌ Netlify deployment error:', error);
      toast({
        title: "Netlify Error",
        description: error instanceof Error ? error.message : "Failed to deploy",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createZipFile = async (htmlContent: string): Promise<Blob> => {
    // Simple zip creation for single HTML file
    const files = {
      'index.html': htmlContent
    };

    // For now, return the HTML content directly
    // In a real implementation, you'd use a zip library
    return new Blob([htmlContent], { type: 'text/html' });
  };

  return {
    deployToNetlify,
    loading
  };
};
