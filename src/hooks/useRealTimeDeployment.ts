
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DeploymentStatus {
  status: 'idle' | 'deploying' | 'success' | 'failed';
  url?: string;
  progress: number;
  message: string;
}

export const useRealTimeDeployment = () => {
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>({
    status: 'idle',
    progress: 0,
    message: 'Ready to deploy'
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const deployToNetlify = useCallback(async (
    projectId: string,
    siteName: string,
    htmlContent: string,
    existingUrl?: string
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      setDeploymentStatus({
        status: 'deploying',
        progress: 10,
        message: 'Initializing deployment...'
      });

      // Get Netlify API keys
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (netlifyError || !netlifyKeys || netlifyKeys.length === 0) {
        throw new Error('No active Netlify API keys found. Please configure Netlify integration.');
      }

      const netlifyToken = netlifyKeys[0].api_token;

      setDeploymentStatus({
        status: 'deploying',
        progress: 30,
        message: 'Preparing deployment package...'
      });

      if (existingUrl) {
        // Update existing site
        const siteId = extractSiteIdFromUrl(existingUrl);
        return await updateExistingSite(netlifyToken, siteId, htmlContent, siteName);
      } else {
        // Create new site
        return await createNewSite(netlifyToken, siteName, htmlContent, projectId);
      }

    } catch (error) {
      console.error('❌ Deployment error:', error);
      
      setDeploymentStatus({
        status: 'failed',
        progress: 0,
        message: error instanceof Error ? error.message : 'Deployment failed'
      });

      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy to Netlify",
        variant: "destructive"
      });

      return null;
    }
  }, [user, toast]);

  const createNewSite = async (
    token: string,
    siteName: string,
    htmlContent: string,
    projectId: string
  ): Promise<string> => {
    setDeploymentStatus({
      status: 'deploying',
      progress: 50,
      message: 'Creating new Netlify site...'
    });

    // Create site
    const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: siteName.toLowerCase().replace(/\s+/g, '-')
      })
    });

    if (!siteResponse.ok) {
      const error = await siteResponse.text();
      throw new Error(`Failed to create site: ${error}`);
    }

    const site = await siteResponse.json();

    setDeploymentStatus({
      status: 'deploying',
      progress: 70,
      message: 'Deploying website files...'
    });

    // Deploy files
    const deploymentFiles = {
      'index.html': htmlContent,
      'robots.txt': 'User-agent: *\nAllow: /',
      'sitemap.xml': generateSitemap(site.ssl_url || site.url)
    };

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/zip'
      },
      body: await createDeploymentZip(deploymentFiles)
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      throw new Error(`Failed to deploy: ${error}`);
    }

    const deployment = await deployResponse.json();

    setDeploymentStatus({
      status: 'deploying',
      progress: 90,
      message: 'Finalizing deployment...'
    });

    // Wait for deployment to complete
    await waitForDeployment(token, deployment.id);

    const finalUrl = site.ssl_url || site.url;

    // Update project with Netlify URL
    await supabase
      .from('projects')
      .update({ netlify_url: finalUrl })
      .eq('id', projectId);

    setDeploymentStatus({
      status: 'success',
      progress: 100,
      message: 'Deployment successful!',
      url: finalUrl
    });

    toast({
      title: "🎉 Deployment Successful!",
      description: `Your website is live at ${finalUrl}`,
    });

    return finalUrl;
  };

  const updateExistingSite = async (
    token: string,
    siteId: string,
    htmlContent: string,
    siteName: string
  ): Promise<string> => {
    setDeploymentStatus({
      status: 'deploying',
      progress: 50,
      message: 'Updating existing deployment...'
    });

    const deploymentFiles = {
      'index.html': htmlContent,
      'robots.txt': 'User-agent: *\nAllow: /'
    };

    const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/zip'
      },
      body: await createDeploymentZip(deploymentFiles)
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.text();
      throw new Error(`Failed to update deployment: ${error}`);
    }

    const deployment = await deployResponse.json();

    setDeploymentStatus({
      status: 'deploying',
      progress: 90,
      message: 'Processing update...'
    });

    await waitForDeployment(token, deployment.id);

    const finalUrl = deployment.ssl_url || deployment.url;

    setDeploymentStatus({
      status: 'success',
      progress: 100,
      message: 'Update successful!',
      url: finalUrl
    });

    toast({
      title: "🚀 Site Updated!",
      description: "Your changes are now live",
    });

    return finalUrl;
  };

  const extractSiteIdFromUrl = (url: string): string => {
    // Extract site ID from Netlify URL
    const match = url.match(/https:\/\/([^\.]+)\.netlify\.app/);
    return match ? match[1] : url.split('//')[1].split('.')[0];
  };

  const createDeploymentZip = async (files: Record<string, string>): Promise<Blob> => {
    // Create a simple tar-like format for Netlify
    const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substr(2);
    let body = '';

    Object.entries(files).forEach(([filename, content]) => {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
      body += `Content-Type: ${filename.endsWith('.html') ? 'text/html' : 'text/plain'}\r\n\r\n`;
      body += content;
      body += `\r\n`;
    });

    body += `--${boundary}--\r\n`;

    return new Blob([body], { type: 'multipart/form-data; boundary=' + boundary });
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
            throw new Error('Deployment failed');
          }
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.warn('Deployment check attempt failed:', attempts);
        attempts++;
      }
    }
  };

  const generateSitemap = (siteUrl: string): string => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  };

  return {
    deployToNetlify,
    deploymentStatus,
    resetStatus: () => setDeploymentStatus({
      status: 'idle',
      progress: 0,
      message: 'Ready to deploy'
    })
  };
};
