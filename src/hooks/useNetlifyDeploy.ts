
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
      console.log('🔍 Fetching Netlify token from Supabase tables...');
      
      const { data: netlifyKeys, error: netlifyError } = await supabase
        .from('netlify_api_keys')
        .select('api_token')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (netlifyError) {
        console.error('❌ Error fetching Netlify keys:', netlifyError);
        throw new Error('Failed to fetch Netlify API keys from database');
      }

      if (!netlifyKeys || netlifyKeys.length === 0) {
        console.error('❌ No active Netlify API keys found in database');
        throw new Error('No active Netlify API keys found in database');
      }

      const netlifyToken = netlifyKeys[0].api_token;
      console.log('✅ Found Netlify token in database');

      // Create site
      console.log('🔨 Creating Netlify site...');
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
        console.error('❌ Netlify site creation failed:', error);
        throw new Error(`Failed to create Netlify site: ${siteResponse.status} - ${error}`);
      }

      const site = await siteResponse.json();
      console.log('✅ Netlify site created:', site.url);

      // Create deployment with HTML content
      console.log('🚀 Deploying to Netlify...');
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
        console.error('❌ Netlify deployment failed:', error);
        throw new Error(`Failed to deploy: ${deployResponse.status} - ${error}`);
      }

      const deployment: NetlifyDeployment = await deployResponse.json();
      console.log('✅ Netlify deployment successful:', deployment.url);
      
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
    loading
  };
};
