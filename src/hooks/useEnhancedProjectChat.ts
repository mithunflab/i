
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
      console.log('📨 Sending message to AI chat function...');
      
      // Generate code using AI
      const generatedCode = await generateCodeWithAI(content, channelData);
      
      // Create AI response
      const aiResponse = `I'll help you create that! Here's what I'm generating for you:\n\n${content}`;
      
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date(),
        generatedCode: generatedCode,
        codeDescription: `Generated ${channelData?.title || 'website'} based on your request`,
        fileChanges: [
          { path: 'index.html', content: generatedCode, action: 'update' }
        ]
      };

      // Handle project creation/update
      if (generatedCode) {
        console.log('🚀 Code generated, updating project...');
        
        try {
          const projectName = currentProject?.name || `${channelData?.title || 'AI'}-website-${Date.now()}`.replace(/\s+/g, '-');
          const projectDescription = `Website for ${channelData?.title || 'AI Generated Project'}`;
          
          let githubUrl = currentProject?.github_url;
          let netlifyUrl = currentProject?.netlify_url;

          if (currentProject && currentProject.github_url) {
            // Update existing repository
            console.log('📤 Updating existing GitHub repository...');
            await updateGitHubRepo(currentProject.github_url, [
              { path: 'index.html', content: generatedCode, action: 'update' }
            ]);
            
            // Update existing Netlify deployment
            if (currentProject.netlify_url) {
              console.log('🌐 Updating existing Netlify deployment...');
              await updateNetlifyDeployment(currentProject.netlify_url, generatedCode);
              netlifyUrl = currentProject.netlify_url;
            } else {
              // Create new Netlify deployment if doesn't exist
              console.log('🌐 Creating new Netlify deployment...');
              const netlifyDeployment = await deployToNetlify(projectName, generatedCode);
              netlifyUrl = netlifyDeployment.url;
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

  const generateCodeWithAI = async (prompt: string, channelData?: ChannelData | null) => {
    // Generate HTML code based on the prompt and channel data
    const channelTitle = channelData?.title || 'AI Generated';
    const channelDescription = channelData?.description || 'Welcome to our website';
    const subscriberCount = channelData?.subscriberCount || '0';
    const thumbnailUrl = channelData?.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; }
        .channel-info { 
            background: rgba(255,255,255,0.1); 
            backdrop-filter: blur(10px);
            border-radius: 20px; 
            padding: 30px; 
            margin: 20px 0; 
            border: 1px solid rgba(255,255,255,0.2);
        }
        .thumbnail { 
            width: 150px; 
            height: 150px; 
            border-radius: 50%; 
            object-fit: cover; 
            margin: 0 auto 20px;
            display: block;
            border: 3px solid rgba(255,255,255,0.3);
        }
        .title { font-size: 2.5em; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
        .description { font-size: 1.2em; opacity: 0.9; line-height: 1.6; }
        .stats { 
            display: flex; 
            justify-content: center; 
            gap: 30px; 
            margin: 20px 0; 
            flex-wrap: wrap;
        }
        .stat { 
            background: rgba(255,255,255,0.15); 
            padding: 15px 25px; 
            border-radius: 15px; 
            text-align: center;
            backdrop-filter: blur(5px);
        }
        .stat-number { font-size: 1.5em; font-weight: bold; }
        .stat-label { font-size: 0.9em; opacity: 0.8; }
        .cta-button {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            color: white;
            font-size: 1.1em;
            cursor: pointer;
            margin: 20px 10px;
            transition: transform 0.3s ease;
        }
        .cta-button:hover { transform: translateY(-2px); }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 25px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        .feature h3 { margin-bottom: 15px; color: #ffd700; }
        @media (max-width: 768px) {
            .title { font-size: 1.8em; }
            .stats { flex-direction: column; align-items: center; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="channel-info">
                <img src="${thumbnailUrl}" alt="Channel Thumbnail" class="thumbnail">
                <h1 class="title">${channelTitle}</h1>
                <p class="description">${channelDescription}</p>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${parseInt(subscriberCount).toLocaleString()}</div>
                        <div class="stat-label">Subscribers</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${channelData?.videoCount ? parseInt(channelData.videoCount).toLocaleString() : '0'}</div>
                        <div class="stat-label">Videos</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${channelData?.viewCount ? parseInt(channelData.viewCount).toLocaleString() : '0'}</div>
                        <div class="stat-label">Views</div>
                    </div>
                </div>
                <button class="cta-button" onclick="window.open('${youtubeUrl}', '_blank')">
                    Subscribe Now
                </button>
                <button class="cta-button" onclick="window.open('${youtubeUrl}', '_blank')">
                    Watch Videos
                </button>
            </div>
        </div>
        
        <div class="features">
            <div class="feature">
                <h3>🎥 Latest Content</h3>
                <p>Stay updated with our latest videos and exciting content. Subscribe to never miss an update!</p>
            </div>
            <div class="feature">
                <h3>🌟 Community</h3>
                <p>Join our amazing community of ${parseInt(subscriberCount).toLocaleString()}+ subscribers and be part of something special.</p>
            </div>
            <div class="feature">
                <h3>📱 Connect</h3>
                <p>Follow us on social media and stay connected across all platforms for exclusive content.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  };

  const generateREADME = () => {
    return `# ${channelData?.title || 'AI Generated Website'}

This website was automatically generated using AI technology.

## Features
- Responsive design
- YouTube integration
- Modern UI/UX
- Mobile-optimized

## Technologies Used
- HTML5
- CSS3
- JavaScript
- AI-Generated Content

## Live Website
Visit the live website to see it in action!
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
