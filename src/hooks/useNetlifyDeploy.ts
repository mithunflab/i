
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Get Netlify token from Supabase tables
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (netlifyError || !netlifyKeys || netlifyKeys.length === 0) {
        throw new Error('No active Netlify API keys found in database');
      }

      const netlifyToken = netlifyKeys[0].api_token;

      // Create files object for deployment
      const files = {
        'index.html': code,
        'robots.txt': 'User-agent: *\nAllow: /',
        '_redirects': '/* /index.html 200'
      };

      // Create site first
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-')
        })
      });

      if (!siteResponse.ok) {
        const errorText = await siteResponse.text();
        throw new Error(`Failed to create site: ${errorText}`);
      }

      const site = await siteResponse.json();

      // Deploy files using the files API
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: files,
          draft: false
        })
      });

      if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        throw new Error(`Failed to deploy: ${errorText}`);
      }

      const deployment: NetlifyDeployment = await deployResponse.json();
      
      // Wait for deployment to be ready
      await waitForDeployment(netlifyToken, deployment.id);
      
      const finalUrl = site.ssl_url || site.url;
      
      toast({
        title: "🎉 Netlify Deployment Success!",
        description: `Site deployed to ${finalUrl}`,
      });

      return {
        url: finalUrl,
        admin_url: deployment.admin_url,
        site_id: site.site_id
      };
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

  const updateNetlifyDeployment = async (siteUrl: string, code: string) => {
    setLoading(true);
    try {
      console.log('🔄 Updating Netlify deployment:', siteUrl);
      
      // Extract site ID from URL
      const siteId = siteUrl.split('//')[1].split('.')[0];
      
      // Get Netlify token
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (netlifyError || !netlifyKeys || netlifyKeys.length === 0) {
        throw new Error('No active Netlify API keys found');
      }

      const netlifyToken = netlifyKeys[0].api_token;

      // Create files for update
      const files = {
        'index.html': code,
        'robots.txt': 'User-agent: *\nAllow: /',
        '_redirects': '/* /index.html 200'
      };

      // Create new deployment
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: files,
          draft: false
        })
      });

      if (!deployResponse.ok) {
        const errorText = await deployResponse.text();
        throw new Error(`Failed to update deployment: ${errorText}`);
      }

      const deployment = await deployResponse.json();
      
      // Wait for deployment to complete
      await waitForDeployment(netlifyToken, deployment.id);
      
      console.log('✅ Netlify deployment updated successfully');
      
      toast({
        title: "🚀 Site Updated!",
        description: "Your website has been updated and redeployed",
      });

      return deployment;
    } catch (error) {
      console.error('❌ Netlify update error:', error);
      toast({
        title: "Update Error",
        description: error instanceof Error ? error.message : "Failed to update deployment",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const waitForDeployment = async (token: string, deployId: string): Promise<void> => {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.netlify.com/api/v1/deploys/${deployId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const deploy = await response.json();
          if (deploy.state === 'ready') {
            return;
          }
          if (deploy.state === 'error') {
            throw new Error('Deployment failed on Netlify');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.warn('Deployment check attempt failed:', attempts);
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        attempts++;
      }
    }
    
    throw new Error('Deployment timeout - please check Netlify dashboard');
  };

  return {
    deployToNetlify,
    updateNetlifyDeployment,
    loading
  };
};
