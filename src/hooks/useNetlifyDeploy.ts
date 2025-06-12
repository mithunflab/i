
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

      // Create site
      const siteResponse = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Website-Builder'
        },
        body: JSON.stringify({
          name: siteName.toLowerCase().replace(/\s+/g, '-')
        })
      });

      if (!siteResponse.ok) {
        const error = await siteResponse.text();
        throw new Error(`Failed to create Netlify site: ${siteResponse.status} - ${error}`);
      }

      const site = await siteResponse.json();

      // Create deployment
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/zip',
          'User-Agent': 'AI-Website-Builder'
        },
        body: await createZipFile(code)
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.text();
        throw new Error(`Failed to deploy: ${deployResponse.status} - ${error}`);
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

      // Create new deployment
      const deployResponse = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${netlifyToken}`,
          'Content-Type': 'application/zip',
          'User-Agent': 'AI-Website-Builder'
        },
        body: await createZipFile(code)
      });

      if (!deployResponse.ok) {
        const error = await deployResponse.text();
        throw new Error(`Failed to update deployment: ${deployResponse.status} - ${error}`);
      }

      const deployment = await deployResponse.json();
      
      console.log('✅ Netlify deployment updated successfully');
      
      toast({
        title: "Site Updated",
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

  const createZipFile = async (htmlContent: string): Promise<Blob> => {
    // Create a simple zip-like structure for Netlify
    // For now, return the HTML content as a blob
    // In production, you'd use a proper zip library
    console.log('📦 Creating deployment package...');
    
    const files = new Map();
    files.set('index.html', htmlContent);
    
    // Create a simple tar-like format that Netlify can understand
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';
    
    files.forEach((content, filename) => {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
      body += `Content-Type: text/html\r\n\r\n`;
      body += content;
      body += `\r\n`;
    });
    
    body += `--${boundary}--\r\n`;
    
    return new Blob([body], { type: 'multipart/form-data; boundary=' + boundary });
  };

  return {
    deployToNetlify,
    updateNetlifyDeployment,
    loading
  };
};
