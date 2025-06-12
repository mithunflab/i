
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGitHubIntegration } from './useGitHubIntegration';
import { useNetlifyDeploy } from './useNetlifyDeploy';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  feature?: string;
  generatedCode?: string;
  codeDescription?: string;
  githubUrl?: string;
  netlifyUrl?: string;
  fileChanges?: Array<{
    path: string;
    content: string;
    action: 'create' | 'update' | 'delete';
  }>;
}

interface ChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl?: string;
  videos: any[];
}

export const useEnhancedProjectChat = (youtubeUrl: string, projectIdea: string, channelData?: ChannelData | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectId] = useState(() => crypto.randomUUID());
  const [currentProject, setCurrentProject] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { createGitHubRepo, updateGitHubRepo } = useGitHubIntegration();
  const { deployToNetlify, updateNetlifyDeployment } = useNetlifyDeploy();

  // Load existing project if it exists
  const loadExistingProject = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: existingProject } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('youtube_url', youtubeUrl)
        .single();
      
      if (existingProject) {
        setCurrentProject(existingProject);
        console.log('📂 Found existing project:', existingProject.name);
      }
    } catch (error) {
      console.log('ℹ️ No existing project found, will create new one');
    }
  }, [user, youtubeUrl]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use the AI assistant",
        variant: "destructive"
      });
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      console.log('📨 Sending message to AI chat function...');
      
      // Call the chat edge function
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          projectId: currentProject?.id || projectId,
          channelData,
          chatHistory: messages.slice(-5),
          generateCode: true,
          existingProject: currentProject
        }
      });

      if (error) {
        console.error('❌ Chat function error:', error);
        throw new Error(`Chat function error: ${error.message}`);
      }

      console.log('✅ AI response received:', data);

      const { reply, feature, generatedCode, codeDescription, fileChanges } = data;

      // Create bot message with file changes
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: reply,
        timestamp: new Date(),
        feature,
        generatedCode,
        codeDescription,
        fileChanges
      };

      // If code was generated, update existing project or create new one
      if (generatedCode && codeDescription) {
        console.log('🚀 Code generated, updating project...');
        
        try {
          const projectName = currentProject?.name || `${channelData?.title || 'AI'}-website-${Date.now()}`.replace(/\s+/g, '-');
          const projectDescription = codeDescription || `Website for ${channelData?.title || 'AI Generated Project'}`;
          
          let githubUrl = currentProject?.github_url;
          let netlifyUrl = currentProject?.netlify_url;

          if (currentProject && currentProject.github_url) {
            // Update existing repository
            console.log('📤 Updating existing GitHub repository...');
            await updateGitHubRepo(currentProject.github_url, fileChanges || [
              { path: 'index.html', content: generatedCode, action: 'update' }
            ]);
            
            // Update existing Netlify deployment
            if (currentProject.netlify_url) {
              console.log('🌐 Updating existing Netlify deployment...');
              await updateNetlifyDeployment(currentProject.netlify_url, generatedCode);
              netlifyUrl = currentProject.netlify_url;
            }
          } else {
            // Create new repository and deployment
            console.log('📤 Creating new GitHub repository...');
            const githubRepo = await createGitHubRepo(projectName, projectDescription, generatedCode, generateREADME());
            githubUrl = githubRepo.html_url;
            
            console.log('🌐 Creating new Netlify deployment...');
            const netlifyDeployment = await deployToNetlify(projectName, generatedCode);
            netlifyUrl = netlifyDeployment.url;
          }

          botMessage.githubUrl = githubUrl;
          botMessage.netlifyUrl = netlifyUrl;

          // Save or update project in database
          console.log('💾 Saving project to database...');
          const projectData = {
            user_id: user.id,
            name: projectName,
            description: projectDescription,
            youtube_url: youtubeUrl,
            channel_data: channelData as any,
            source_code: generatedCode,
            github_url: githubUrl,
            netlify_url: netlifyUrl,
            status: 'active'
          };

          if (currentProject) {
            const { error: updateError } = await supabase
              .from('projects')
              .update(projectData)
              .eq('id', currentProject.id);
            
            if (updateError) {
              console.error('❌ Failed to update project:', updateError);
            } else {
              console.log('✅ Project updated in database');
            }
          } else {
            const { data: newProject, error: insertError } = await supabase
              .from('projects')
              .insert(projectData)
              .select()
              .single();

            if (insertError) {
              console.error('❌ Failed to create project:', insertError);
            } else {
              console.log('✅ Project created in database');
              setCurrentProject(newProject);
            }
          }

          toast({
            title: "🎉 Website Updated Successfully!",
            description: `Your website is live at ${netlifyUrl}`,
          });

        } catch (deployError) {
          console.error('❌ Deployment failed:', deployError);
          toast({
            title: "Deployment Error",
            description: "Code generated but deployment failed. Check console for details.",
            variant: "destructive"
          });
        }
      }

      setMessages(prev => [...prev, botMessage]);

      // Save chat history
      await supabase
        .from('project_chat_history')
        .insert([
          {
            project_id: currentProject?.id || projectId,
            user_id: user.id,
            message_type: 'user',
            content: content,
            metadata: {}
          },
          {
            project_id: currentProject?.id || projectId,
            user_id: user.id,
            message_type: 'bot',
            content: reply,
            metadata: {
              feature,
              codeGenerated: !!generatedCode,
              githubUrl: botMessage.githubUrl,
              netlifyUrl: botMessage.netlifyUrl,
              fileChanges: fileChanges || []
            }
          }
        ]);

    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to process your message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, projectId, channelData, youtubeUrl, messages, toast, createGitHubRepo, deployToNetlify, currentProject, updateGitHubRepo, updateNetlifyDeployment]);

  const generateREADME = () => {
    return `# AI Website Builder - Comprehensive Documentation

## Project Overview
This is an AI-powered website builder that creates modern, responsive websites using YouTube channel data.

## Supabase Database Tables

### Core Tables

#### \`profiles\`
- Stores user profile information
- Columns: id, email, full_name, role, avatar_url, created_at, updated_at
- Purpose: User management and authentication

#### \`projects\`
- Stores website projects created by users
- Columns: id, user_id, name, description, youtube_url, channel_data, source_code, github_url, netlify_url, status, created_at, updated_at
- Purpose: Project management and tracking

#### \`project_chat_history\`
- Stores chat conversations between users and AI
- Columns: id, project_id, user_id, message_type, content, metadata, created_at
- Purpose: Chat history and conversation tracking

### API Key Management Tables

#### \`youtube_api_keys\`
- Stores YouTube Data API keys
- Columns: id, user_id, name, api_key, quota_used, quota_limit, is_active, last_used_at, created_at, updated_at
- Purpose: YouTube channel data fetching

#### \`openrouter_api_keys\`
- Stores OpenRouter API keys for AI responses
- Columns: id, user_id, name, api_key, credits_used, credits_limit, requests_count, is_active, last_used_at, created_at, updated_at
- Purpose: AI chat and code generation

#### \`github_api_keys\`
- Stores GitHub personal access tokens
- Columns: id, user_id, name, api_token, rate_limit_used, rate_limit_limit, is_active, last_used_at, created_at, updated_at
- Purpose: Repository creation and management

#### \`netlify_api_keys\`
- Stores Netlify API tokens
- Columns: id, user_id, name, api_token, deployments_count, deployments_limit, is_active, last_used_at, created_at, updated_at
- Purpose: Website deployment and hosting

### Monitoring and Analytics Tables

#### \`api_usage_logs\`
- Tracks API usage across all services
- Columns: id, user_id, provider, model, tokens_used, cost_usd, response_time_ms, status, error_message, created_at
- Purpose: Usage monitoring and cost tracking

#### \`analytics\`
- Stores user behavior and system analytics
- Columns: id, user_id, event_type, event_data, created_at
- Purpose: Analytics and insights

#### \`audit_logs\`
- Tracks system changes and user actions
- Columns: id, user_id, resource_type, resource_id, action, old_values, new_values, ip_address, user_agent, created_at
- Purpose: Security and compliance

### Deployment and Infrastructure Tables

#### \`deployment_tokens\`
- Stores deployment service tokens
- Columns: id, user_id, provider, token_name, token_value, is_active, created_at, updated_at
- Purpose: Multi-provider deployment management

#### \`deployments\`
- Tracks deployment history
- Columns: id, project_id, user_id, status, url, created_at
- Purpose: Deployment tracking

#### \`domain_management\`
- Manages custom domains
- Columns: id, user_id, domain_name, status, verification_token, dns_configured, ssl_enabled, created_at, updated_at
- Purpose: Custom domain management

### Configuration Tables

#### \`email_configurations\`
- Email service configurations
- Columns: id, user_id, provider, smtp_host, smtp_port, smtp_username, smtp_password, from_email, is_active, created_at, updated_at
- Purpose: Email notifications and communications

#### \`webhook_endpoints\`
- Webhook configurations
- Columns: id, user_id, name, url, events, secret, is_active, last_triggered_at, created_at, updated_at
- Purpose: Event notifications and integrations

#### \`backup_schedules\`
- Automated backup configurations
- Columns: id, user_id, name, backup_type, schedule_cron, last_run_at, next_run_at, is_active, created_at, updated_at
- Purpose: Data backup and recovery

### System Tables

#### \`system_monitoring\`
- System performance metrics
- Columns: id, metric_name, metric_value, metric_unit, metadata, recorded_at
- Purpose: System health monitoring

#### \`storage_usage_tracking\`
- File storage usage tracking
- Columns: id, user_id, bucket_name, file_count, total_size_bytes, last_updated
- Purpose: Storage usage monitoring

#### \`file_storage\`
- File metadata and storage paths
- Columns: id, user_id, file_name, file_type, file_size, storage_path, public_url, metadata, created_at, updated_at
- Purpose: File management

## Database Functions

### \`handle_new_user()\`
- Automatically creates user profiles when new users register
- Assigns admin role to specific email addresses
- Ensures proper user initialization

### \`get_current_user_role()\`
- Security definer function to get current user's role
- Used for role-based access control
- Returns user role for authorization

### \`handle_updated_at()\` / \`update_updated_at_column()\`
- Trigger functions to automatically update timestamps
- Maintains data consistency
- Tracks record modification times

## Features

### Real-time AI Code Generation
- Uses OpenRouter API for AI responses
- Generates HTML, CSS, and JavaScript code
- Supports multiple AI models and providers

### GitHub Integration
- Automatic repository creation
- Code versioning and history
- Collaborative development support

### Netlify Deployment
- Instant website hosting
- Automatic SSL certificates
- Global CDN distribution

### YouTube Integration
- Channel data fetching
- Thumbnail and metadata extraction
- Video content integration

## Security Features

### Row Level Security (RLS)
- All tables have appropriate RLS policies
- Users can only access their own data
- Admin users have elevated permissions

### API Key Management
- Secure storage of API credentials
- Usage tracking and rate limiting
- Key rotation and lifecycle management

### Audit Logging
- Complete audit trail of all actions
- Security monitoring and compliance
- User activity tracking

## Deployment Information

- **Created**: ${new Date().toISOString()}
- **Platform**: Supabase + React + Vite
- **Hosting**: Netlify
- **Repository**: GitHub
- **AI Provider**: OpenRouter

## Environment Variables

All sensitive data is stored in Supabase secrets:
- \`OPENROUTER_API_KEY\`: AI model access
- \`SUPABASE_URL\`: Database connection
- \`SUPABASE_ANON_KEY\`: Public database access
- \`SUPABASE_SERVICE_ROLE_KEY\`: Admin database access

## Support

For issues or questions, please check the project documentation or contact support.
`;
  };

  // Load existing project on mount
  React.useEffect(() => {
    loadExistingProject();
  }, [loadExistingProject]);

  return {
    messages,
    loading,
    sendMessage,
    projectId: currentProject?.id || projectId,
    currentProject
  };
};
