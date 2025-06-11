
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Code, Eye, Rocket, Settings, Smartphone, Monitor, Tablet, Zap, Palette, Database, Cloud, Shield, Globe, Image, FileText, Download, Share2, Youtube, Play, Bell, TrendingUp, DollarSign, Radio } from 'lucide-react';
import Chatbot from './Chatbot';
import CodePreview from './CodePreview';
import ElementSelector from './ElementSelector';
import PreviewFrame from './PreviewFrame';

type PreviewMode = 'mobile' | 'tablet' | 'desktop';

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('preview');
  const [deviceType, setDeviceType] = useState('desktop');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [isElementSelectorActive, setIsElementSelectorActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const { youtubeUrl = 'https://youtube.com/@example', projectIdea = 'YouTube Channel Website' } = location.state || {};

  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({ width, height });
      
      if (width < 768) {
        setDeviceType('mobile');
        setPreviewMode('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
        setPreviewMode('tablet');
      } else {
        setDeviceType('desktop');
        setPreviewMode('desktop');
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleFeature = (feature: string) => {
    console.log(`${feature} feature activated`);
    
    switch (feature) {
      case 'YouTube Sync':
        alert('📺 YouTube Sync: Importing your latest videos, playlists, and channel branding...');
        break;
      case 'Channel Branding':
        alert('🎨 Channel Branding: Applying your YouTube colors, fonts, and style to the website...');
        break;
      case 'Video Gallery':
        alert('🎬 Video Gallery: Creating beautiful video showcases and playlists...');
        break;
      case 'Subscribe Widget':
        alert('🔔 Subscribe Widget: Adding YouTube subscribe buttons and social links...');
        break;
      case 'Analytics':
        alert('📊 Analytics: Setting up YouTube and website analytics tracking...');
        break;
      case 'SEO Boost':
        alert('🚀 SEO Boost: Optimizing for YouTube keywords and search rankings...');
        break;
      case 'Monetization':
        alert('💰 Monetization: Adding sponsor sections, merch links, and revenue tools...');
        break;
      case 'Mobile Optimize':
        alert('📱 Mobile Optimize: Ensuring perfect mobile viewing for your audience...');
        break;
      case 'Live Stream':
        alert('🔴 Live Stream: Integrating live streaming and premiere announcements...');
        break;
      default:
        alert(`✨ ${feature} feature is now active and working!`);
    }
  };

  const handleDeploy = () => {
    alert('🚀 Publishing your YouTube website... Your audience will love it!');
    setTimeout(() => {
      alert('✅ Website is live! Share it with your YouTube community: https://your-channel.website');
    }, 2000);
  };

  const handleElementSelect = (elementId: string) => {
    setSelectedElement(elementId);
    setIsElementSelectorActive(false);
    console.log('Selected element:', elementId);
    alert(`🎯 Element selected: ${elementId}. You can now edit this element!`);
  };

  const getLayoutStyle = () => {
    if (deviceType === 'mobile') {
      return 'flex-col h-auto min-h-screen';
    }
    return `flex-row h-screen max-h-screen`;
  };

  const getSidebarStyle = () => {
    if (deviceType === 'mobile') {
      return 'h-96 w-full order-2 border-t';
    }
    return 'w-80 h-full order-1 border-r';
  };

  const getMainContentStyle = () => {
    if (deviceType === 'mobile') {
      return 'flex-1 order-1 min-h-[60vh]';
    }
    return 'flex-1 h-full order-2';
  };

  return (
    <div className="min-h-screen bg-background animated-gradient overflow-hidden">
      {/* Header - Responsive */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm glass">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 cyber-button"
                >
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold neon-text flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    YouTube Website Builder
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {dimensions.width}x{dimensions.height} • {deviceType}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                {/* Device Preview Toggle */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                    className="flex items-center gap-1"
                  >
                    <Smartphone size={14} />
                    <span className="hidden sm:inline">Mobile</span>
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                    className="flex items-center gap-1"
                  >
                    <Tablet size={14} />
                    <span className="hidden sm:inline">Tablet</span>
                  </Button>
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                    className="flex items-center gap-1"
                  >
                    <Monitor size={14} />
                    <span className="hidden sm:inline">Desktop</span>
                  </Button>
                </div>

                <Tabs value={activeView} onValueChange={setActiveView}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preview" className="flex items-center gap-2">
                      <Eye size={14} />
                      <span className="hidden sm:inline">Preview</span>
                    </TabsTrigger>
                    <TabsTrigger value="code" className="flex items-center gap-2">
                      <Code size={14} />
                      <span className="hidden sm:inline">Code</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <Button onClick={handleDeploy} className="cyber-button flex items-center gap-2 w-full sm:w-auto">
                  <Rocket size={16} />
                  <span>Publish Website</span>
                </Button>
              </div>
            </div>

            {/* YouTube Creator Feature Toolbar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-2 pt-2 border-t border-border/30">
              <Button
                variant={isElementSelectorActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsElementSelectorActive(!isElementSelectorActive);
                  if (!isElementSelectorActive) {
                    alert('🎯 Element Selector activated! Click any element to customize it for your YouTube brand.');
                  }
                }}
                className="flex items-center gap-1 text-xs"
              >
                <Zap size={12} />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              
              {[
                { icon: Youtube, name: 'YT Sync', feature: 'YouTube Sync' },
                { icon: Palette, name: 'Branding', feature: 'Channel Branding' },
                { icon: Play, name: 'Videos', feature: 'Video Gallery' },
                { icon: Bell, name: 'Subscribe', feature: 'Subscribe Widget' },
                { icon: TrendingUp, name: 'Analytics', feature: 'Analytics' },
                { icon: Globe, name: 'SEO', feature: 'SEO Boost' },
                { icon: DollarSign, name: 'Monetize', feature: 'Monetization' },
                { icon: Smartphone, name: 'Mobile', feature: 'Mobile Optimize' },
                { icon: Radio, name: 'Live', feature: 'Live Stream' }
              ].map((item, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleFeature(item.feature)}
                  className="flex items-center gap-1 text-xs"
                >
                  <item.icon size={12} className={item.icon === Youtube ? 'text-red-500' : ''} />
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - Fully Responsive */}
      <div className={`flex ${getLayoutStyle()}`} style={{ height: `calc(100vh - ${deviceType === 'mobile' ? '160px' : '140px'})` }}>
        {/* Chatbot Sidebar - Responsive */}
        <div className={`${getSidebarStyle()} border-border bg-card/30 glass overflow-hidden`}>
          <div className="h-full flex flex-col">
            <Chatbot youtubeUrl={youtubeUrl} projectIdea={projectIdea} />
          </div>
        </div>

        {/* Main Content Area - Responsive */}
        <div className={`${getMainContentStyle()} overflow-hidden`}>
          <Tabs value={activeView} onValueChange={setActiveView} className="h-full flex flex-col">
            <TabsContent value="preview" className="flex-1 m-0 overflow-hidden">
              <div className="h-full bg-white p-2 sm:p-4 relative overflow-auto">
                {isElementSelectorActive && (
                  <ElementSelector 
                    onElementSelect={handleElementSelect}
                    isActive={isElementSelectorActive}
                  />
                )}
                <PreviewFrame 
                  youtubeUrl={youtubeUrl}
                  projectIdea={projectIdea}
                  previewMode={previewMode}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
              <div className="h-full">
                <CodePreview />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Workspace;
