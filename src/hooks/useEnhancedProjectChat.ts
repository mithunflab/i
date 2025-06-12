
import { useState, useCallback, useEffect } from 'react';
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
      console.log('🤖 Calling real AI chat function...');
      
      // Call the actual Supabase edge function with real AI
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat', {
        body: {
          message: content,
          projectId: currentProject?.id || projectId,
          channelData: channelData,
          chatHistory: messages.slice(-5), // Last 5 messages for context
          generateCode: true
        }
      });

      if (aiError) {
        console.error('❌ AI API Error:', aiError);
        throw new Error(`AI API Error: ${aiError.message}`);
      }

      console.log('✅ AI Response received:', aiResponse);

      // Create AI response message
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: aiResponse.reply || 'I\'ve generated your code!',
        timestamp: new Date(),
        feature: aiResponse.feature || 'website',
        generatedCode: aiResponse.generatedCode,
        codeDescription: aiResponse.codeDescription,
        fileChanges: aiResponse.generatedCode ? [
          { path: 'index.html', content: aiResponse.generatedCode, action: 'update' }
        ] : undefined
      };

      // Handle project creation/update with real generated code
      if (aiResponse.generatedCode) {
        console.log('🚀 Real AI code generated, deploying...');
        
        try {
          const projectName = currentProject?.name || `${channelData?.title || 'AI'}-website-${Date.now()}`.replace(/\s+/g, '-');
          const projectDescription = `AI-generated website for ${channelData?.title || 'custom project'}`;
          
          let githubUrl = currentProject?.github_url;
          let netlifyUrl = currentProject?.netlify_url;

          if (currentProject && currentProject.github_url) {
            // Update existing repository
            console.log('📤 Updating existing GitHub repository...');
            await updateGitHubRepo(currentProject.github_url, [
              { path: 'index.html', content: aiResponse.generatedCode, action: 'update' }
            ]);
            
            // Update existing Netlify deployment
            if (currentProject.netlify_url) {
              console.log('🌐 Updating existing Netlify deployment...');
              await updateNetlifyDeployment(currentProject.netlify_url, aiResponse.generatedCode);
              netlifyUrl = currentProject.netlify_url;
            } else {
              // Create new Netlify deployment if doesn't exist
              console.log('🌐 Creating new Netlify deployment...');
              const netlifyDeployment = await deployToNetlify(projectName, aiResponse.generatedCode);
              netlifyUrl = netlifyDeployment.url;
            }
          } else {
            // Create new repository and deployment
            console.log('📤 Creating new GitHub repository...');
            const githubRepo = await createGitHubRepo(projectName, projectDescription, aiResponse.generatedCode, generateREADME());
            githubUrl = githubRepo.html_url;
            
            console.log('🌐 Creating new Netlify deployment...');
            const netlifyDeployment = await deployToNetlify(projectName, aiResponse.generatedCode);
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
            source_code: aiResponse.generatedCode,
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
            title: "🎉 AI-Generated Website Deployed!",
            description: `Your AI-powered website is live at ${netlifyUrl}`,
          });

        } catch (deployError) {
          console.error('❌ Deployment failed:', deployError);
          toast({
            title: "Deployment Error",
            description: "AI code generated but deployment failed. Check console for details.",
            variant: "destructive"
          });
        }
      }

      setMessages(prev => [...prev, botMessage]);

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
  }, [user, projectId, channelData, youtubeUrl, toast, createGitHubRepo, deployToNetlify, currentProject, updateGitHubRepo, updateNetlifyDeployment]);

  const generateREADME = () => {
    return `# ${channelData?.title || 'AI Generated Website'}

This website was automatically generated using AI technology with OpenRouter API.

## Features
- Real-time AI code generation
- Responsive design
- YouTube integration
- Modern UI/UX
- Mobile-optimized
- AI-powered content creation

## Technologies Used
- HTML5, CSS3, JavaScript
- OpenRouter AI API
- GitHub Integration
- Netlify Deployment
- Real-time Generation

## AI-Generated Content
This project was created using advanced AI models that generate custom code based on user requirements and YouTube channel data.

## Live Website
Visit the live website to see the AI-generated content in action!
`;
  };

  // Load existing project on mount
  useEffect(() => {
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
