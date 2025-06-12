
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
  const { user } = useAuth();
  const { toast } = useToast();
  const { createGitHubRepo } = useGitHubIntegration();
  const { deployToNetlify } = useNetlifyDeploy();

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
      
      // Call the chat edge function with proper parameters
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          projectId,
          channelData,
          chatHistory: messages.slice(-5), // Send last 5 messages for context
          generateCode: true
        }
      });

      if (error) {
        console.error('❌ Chat function error:', error);
        throw new Error(`Chat function error: ${error.message}`);
      }

      console.log('✅ AI response received:', data);

      const { reply, feature, generatedCode, codeDescription } = data;

      // Create bot message
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: reply,
        timestamp: new Date(),
        feature,
        generatedCode,
        codeDescription
      };

      // If code was generated, deploy it
      if (generatedCode && codeDescription) {
        console.log('🚀 Code generated, starting deployment process...');
        
        try {
          // Generate project name and description
          const projectName = `${channelData?.title || 'AI'}-website-${Date.now()}`.replace(/\s+/g, '-');
          const projectDescription = codeDescription || `Website for ${channelData?.title || 'AI Generated Project'}`;
          
          // Create README
          const readme = `# ${channelData?.title || 'AI Generated Website'}

${projectDescription}

## About
This website was automatically generated using AI and deployed through our platform.

${channelData ? `
## Channel Information
- **Channel**: ${channelData.title}
- **Subscribers**: ${parseInt(channelData.subscriberCount).toLocaleString()}
- **Videos**: ${parseInt(channelData.videoCount).toLocaleString()}
- **Views**: ${parseInt(channelData.viewCount).toLocaleString()}
` : ''}

## Features
- Responsive design
- Modern UI/UX
- Interactive elements
- Mobile-friendly

## Deployment
This site is automatically deployed to:
- GitHub (source code)
- Netlify (live site)

Generated on: ${new Date().toISOString()}
`;

          console.log('📤 Deploying to GitHub...');
          const githubRepo = await createGitHubRepo(projectName, projectDescription, generatedCode, readme);
          botMessage.githubUrl = githubRepo.html_url;
          
          console.log('🌐 Deploying to Netlify...');
          const netlifyDeployment = await deployToNetlify(projectName, generatedCode);
          botMessage.netlifyUrl = netlifyDeployment.url;

          // Save project to database
          console.log('💾 Saving project to database...');
          const { error: projectError } = await supabase
            .from('projects')
            .insert({
              id: projectId,
              user_id: user.id,
              name: projectName,
              description: projectDescription,
              youtube_url: youtubeUrl,
              channel_data: channelData,
              source_code: generatedCode,
              github_url: githubRepo.html_url,
              netlify_url: netlifyDeployment.url,
              status: 'active'
            });

          if (projectError) {
            console.error('❌ Failed to save project:', projectError);
          } else {
            console.log('✅ Project saved to database');
          }

          toast({
            title: "🎉 Website Created Successfully!",
            description: `Your website is now live at ${netlifyDeployment.url}`,
          });

        } catch (deployError) {
          console.error('❌ Deployment failed:', deployError);
          toast({
            title: "Deployment Error",
            description: "Website generated but deployment failed. Check console for details.",
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
            project_id: projectId,
            user_id: user.id,
            message_type: 'user',
            content: content,
            metadata: {}
          },
          {
            project_id: projectId,
            user_id: user.id,
            message_type: 'bot',
            content: reply,
            metadata: {
              feature,
              codeGenerated: !!generatedCode,
              githubUrl: botMessage.githubUrl,
              netlifyUrl: botMessage.netlifyUrl
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
  }, [user, projectId, channelData, youtubeUrl, messages, toast, createGitHubRepo, deployToNetlify]);

  return {
    messages,
    loading,
    sendMessage,
    projectId
  };
};
