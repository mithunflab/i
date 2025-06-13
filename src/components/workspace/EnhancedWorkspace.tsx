
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code, 
  Eye, 
  Zap, 
  FileText, 
  Github, 
  Globe, 
  Settings,
  Target,
  History
} from 'lucide-react';
import SmartAIEditor from './SmartAIEditor';
import CodePreview from './CodePreview';
import { useProjectVerification } from '@/hooks/useProjectVerification';
import { useToast } from '@/hooks/use-toast';

const EnhancedWorkspace: React.FC = () => {
  const location = useLocation();
  const { youtubeUrl, projectIdea, channelData } = location.state || {};
  const [generatedCode, setGeneratedCode] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [activeTab, setActiveTab] = useState('editor');
  const { submitVerificationRequest, isSubmitting } = useProjectVerification();
  const { toast } = useToast();

  // Initialize with sample website
  useEffect(() => {
    if (channelData) {
      generateInitialWebsite();
    }
  }, [channelData]);

  const generateInitialWebsite = () => {
    const initialCode = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${channelData?.title || 'YouTube Channel'} - Official Website</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        #main-header {
            background: linear-gradient(135deg, #ff0000, #cc0000);
            color: white;
            padding: 1rem 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .logo img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 3px solid white;
        }
        
        #main-nav ul {
            display: flex;
            list-style: none;
            gap: 30px;
        }
        
        #main-nav a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            transition: opacity 0.3s;
        }
        
        #main-nav a:hover {
            opacity: 0.8;
        }
        
        #hero-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 100px 0;
        }
        
        .hero-content h1 {
            font-size: 3.5rem;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        
        .hero-content p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 30px 0;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            display: block;
        }
        
        #cta-btn {
            background: #ff0000;
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
            display: inline-block;
        }
        
        #cta-btn:hover {
            background: #cc0000;
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(255,0,0,0.3);
        }
        
        #video-gallery {
            padding: 80px 0;
            background: #f8f9fa;
        }
        
        .section-title {
            text-align: center;
            font-size: 2.5rem;
            margin-bottom: 50px;
            color: #333;
        }
        
        .video-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
        }
        
        .video-card {
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .video-card:hover {
            transform: translateY(-5px);
        }
        
        .video-thumbnail {
            width: 100%;
            height: 200px;
            background: #ddd;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
        }
        
        .video-info {
            padding: 20px;
        }
        
        .video-title {
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .video-stats {
            color: #666;
            font-size: 0.9rem;
        }
        
        #main-footer {
            background: #333;
            color: white;
            text-align: center;
            padding: 40px 0;
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .social-links {
            display: flex;
            gap: 20px;
        }
        
        .social-links a {
            color: white;
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .social-links a:hover {
            color: #ff0000;
        }
        
        @media (max-width: 768px) {
            .hero-content h1 {
                font-size: 2.5rem;
            }
            
            .stats {
                flex-direction: column;
                gap: 20px;
            }
            
            .footer-content {
                flex-direction: column;
                gap: 20px;
            }
        }
    </style>
</head>
<body>
    <header id="main-header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <img src="${channelData?.thumbnail || '/api/placeholder/50/50'}" alt="${channelData?.title || 'Channel'} Logo">
                    <div>
                        <h2>${channelData?.title || 'YouTube Channel'}</h2>
                        <p>Official Website</p>
                    </div>
                </div>
                <nav id="main-nav">
                    <ul>
                        <li><a href="#home">Home</a></li>
                        <li><a href="#videos">Videos</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    </header>

    <section id="hero-section">
        <div class="container">
            <div class="hero-content">
                <h1>Welcome to ${channelData?.title || 'Our Channel'}</h1>
                <p>${projectIdea || 'Amazing content awaits you!'}</p>
                
                <div class="stats">
                    <div class="stat">
                        <span class="stat-number">${parseInt(channelData?.subscriberCount || '0').toLocaleString()}</span>
                        <span>Subscribers</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${parseInt(channelData?.videoCount || '0').toLocaleString()}</span>
                        <span>Videos</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${parseInt(channelData?.viewCount || '0').toLocaleString()}</span>
                        <span>Views</span>
                    </div>
                </div>
                
                <a href="${youtubeUrl}" target="_blank" id="cta-btn">Subscribe on YouTube</a>
            </div>
        </div>
    </section>

    <section id="video-gallery">
        <div class="container">
            <h2 class="section-title">Latest Videos</h2>
            <div class="video-grid">
                <div class="video-card">
                    <div class="video-thumbnail">
                        📺 Latest Video
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">Amazing Content Title</h3>
                        <p class="video-stats">1.2M views • 2 days ago</p>
                    </div>
                </div>
                <div class="video-card">
                    <div class="video-thumbnail">
                        📺 Popular Video
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">Trending Topic Discussion</h3>
                        <p class="video-stats">856K views • 1 week ago</p>
                    </div>
                </div>
                <div class="video-card">
                    <div class="video-thumbnail">
                        📺 Featured Video
                    </div>
                    <div class="video-info">
                        <h3 class="video-title">Special Series Episode</h3>
                        <p class="video-stats">2.1M views • 2 weeks ago</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <footer id="main-footer">
        <div class="container">
            <div class="footer-content">
                <div>
                    <p>&copy; 2025 ${channelData?.title || 'YouTube Channel'}. All rights reserved.</p>
                </div>
                <div class="social-links">
                    <a href="${youtubeUrl}" target="_blank">YouTube</a>
                    <a href="#twitter">Twitter</a>
                    <a href="#instagram">Instagram</a>
                    <a href="#discord">Discord</a>
                </div>
            </div>
        </div>
    </footer>

    <script>
        // Simple interactions
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scrolling for navigation links
            document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                });
            });

            // Add click tracking
            document.getElementById('cta-btn').addEventListener('click', function() {
                console.log('CTA button clicked - redirect to YouTube');
            });
        });
    </script>
</body>
</html>`;

    setGeneratedCode(initialCode);
    toast({
      title: "Website Generated",
      description: `Created a beautiful website for ${channelData?.title}`,
    });
  };

  const handleCodeUpdate = (newCode: string) => {
    setGeneratedCode(newCode);
    setPreviewKey(prev => prev + 1); // Force preview refresh
    toast({
      title: "Code Updated",
      description: "Smart edit applied successfully",
    });
  };

  const handleVerificationRequest = async () => {
    const projectData = {
      name: `${channelData?.title} Website`,
      description: projectIdea,
      netlify_url: '', // Would be filled when deployed
      github_url: ''   // Would be filled when pushed to GitHub
    };

    await submitVerificationRequest('temp-project-id', projectData);
  };

  const renderCodePreview = () => {
    if (!generatedCode) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Code className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No code generated yet</p>
            <p className="text-sm text-gray-500">Use the Smart AI Editor to create your website</p>
          </div>
        </div>
      );
    }

    return <CodePreview generatedCode={generatedCode} isLiveTyping={false} />;
  };

  const renderLivePreview = () => {
    if (!generatedCode) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No preview available</p>
            <p className="text-sm text-gray-500">Generate code first to see live preview</p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full">
        <iframe
          key={previewKey}
          srcDoc={generatedCode}
          className="w-full h-full border-0"
          title="Website Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {channelData?.thumbnail && (
                    <img 
                      src={channelData.thumbnail} 
                      alt={channelData.title}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <CardTitle className="text-white">
                      Enhanced AI Workspace
                    </CardTitle>
                    <p className="text-gray-400">
                      {channelData?.title || 'Smart Component-Level Editing'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-purple-600/20 text-purple-400">
                    <Target className="w-3 h-3 mr-1" />
                    Smart Editing
                  </Badge>
                  <Button
                    onClick={handleVerificationRequest}
                    disabled={isSubmitting}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Get Verified'}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Smart AI Editor Panel */}
          <div className="lg:col-span-1">
            <SmartAIEditor
              currentCode={generatedCode}
              onCodeUpdate={handleCodeUpdate}
              projectId="temp-project-id"
            />
          </div>

          {/* Code & Preview Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Live Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Source Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="h-[calc(100%-60px)]">
                <Card className="h-full">
                  <CardContent className="p-0 h-full">
                    {renderLivePreview()}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="code" className="h-[calc(100%-60px)]">
                <Card className="h-full">
                  <CardContent className="p-0 h-full">
                    {renderCodePreview()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedWorkspace;
