import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Code, Eye, Rocket, Smartphone, Monitor, Tablet, Zap, Palette, Youtube, Play, Bell, TrendingUp, DollarSign, Radio, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import EnhancedChatbot from './EnhancedChatbot';
import CodePreview from './CodePreview';
import ElementSelector from './ElementSelector';
import PreviewFrame from './PreviewFrame';
import ServiceStatusIndicators from '@/components/ui/ServiceStatusIndicators';

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
  const [showToolbar, setShowToolbar] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const { 
    youtubeUrl = 'https://youtube.com/@example', 
    projectIdea = 'YouTube Channel Website',
    channelData = null
  } = location.state || {};

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

  const quickActions = [
    { label: 'Add subscribe button', icon: '🔔' },
    { label: 'Import latest videos', icon: '📺' },
    { label: 'Match channel colors', icon: '🎨' },
    { label: 'Mobile optimize', icon: '📱' },
    { label: 'Add video gallery', icon: '🎬' },
    { label: 'Setup analytics', icon: '📊' }
  ];

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

  const renderChatbot = () => (
    <EnhancedChatbot 
      youtubeUrl={youtubeUrl} 
      projectIdea={projectIdea}
      channelData={channelData}
    />
  );

  return (
    <div className="min-h-screen bg-background animated-gradient overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm glass">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/user-dashboard')}
                className="flex items-center gap-2 cyber-button"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <ServiceStatusIndicators />
            </div>
            
            <div className="flex items-center gap-3">
              {/* Edit Button */}
              <Button
                variant={isElementSelectorActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsElementSelectorActive(!isElementSelectorActive);
                  if (!isElementSelectorActive) {
                    alert('🎯 Element Selector activated! Click any element to customize it for your YouTube brand.');
                  }
                }}
                className="flex items-center gap-1"
              >
                <Zap size={14} />
                <span className="hidden sm:inline">Edit</span>
              </Button>

              {/* Ideas Button */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickActions(!showQuickActions)}
                  className="flex items-center gap-1"
                >
                  <Lightbulb size={14} />
                  <span className="hidden sm:inline">Ideas</span>
                </Button>
                
                {showQuickActions && (
                  <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 min-w-64">
                    <div className="grid grid-cols-1 gap-2">
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="ghost"
                          size="sm"
                          className="justify-start text-left"
                          onClick={() => {
                            handleFeature(action.label);
                            setShowQuickActions(false);
                          }}
                        >
                          <span className="mr-2">{action.icon}</span>
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Features Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowToolbar(!showToolbar)}
                className="flex items-center gap-1"
              >
                <span className="hidden sm:inline">Features</span>
                {showToolbar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>

              {/* Device Preview Toggle */}
              <div className="hidden sm:flex items-center gap-1">
                <Button
                  variant={previewMode === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone size={14} />
                </Button>
                <Button
                  variant={previewMode === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('tablet')}
                >
                  <Tablet size={14} />
                </Button>
                <Button
                  variant={previewMode === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor size={14} />
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
              
              <Button onClick={handleDeploy} className="cyber-button flex items-center gap-2">
                <Rocket size={16} />
                <span>Publish</span>
              </Button>
            </div>
          </div>

          {/* Collapsible Features Toolbar */}
          {showToolbar && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 pt-3 mt-3 border-t border-border/30">
              {[
                { icon: Youtube, name: 'YT Sync', feature: 'YouTube Sync' },
                { icon: Palette, name: 'Branding', feature: 'Channel Branding' },
                { icon: Play, name: 'Videos', feature: 'Video Gallery' },
                { icon: Bell, name: 'Subscribe', feature: 'Subscribe Widget' },
                { icon: TrendingUp, name: 'Analytics', feature: 'Analytics' },
                { icon: Rocket, name: 'SEO', feature: 'SEO Boost' },
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
          )}
        </div>
      </header>

      {/* Main Layout - Full Height */}
      <div className={`flex ${getLayoutStyle()}`} style={{ height: `calc(100vh - ${showToolbar ? '140px' : '80px'})` }}>
        {/* Chatbot Sidebar */}
        <div className={`${getSidebarStyle()} border-border bg-card/30 glass overflow-hidden`}>
          <div className="h-full flex flex-col">
            {renderChatbot()}
          </div>
        </div>

        {/* Main Content Area */}
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
