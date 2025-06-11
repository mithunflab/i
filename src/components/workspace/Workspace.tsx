import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Code, Eye, Rocket, Settings, Smartphone, Monitor, Tablet, Zap, Palette, Database, Cloud, Shield, Globe, Image, FileText, Download, Share2, Youtube, Play, Bell, TrendingUp, DollarSign, Radio } from 'lucide-react';
import Chatbot from './Chatbot';
import CodePreview from './CodePreview';
import ElementSelector from './ElementSelector';

const Workspace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('preview');
  const [deviceType, setDeviceType] = useState('desktop');
  const [previewMode, setPreviewMode] = useState('desktop');
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

  const getPreviewWidth = () => {
    const containerWidth = dimensions.width - (deviceType === 'mobile' ? 0 : 320); // Account for sidebar
    
    switch (previewMode) {
      case 'mobile': 
        return `w-80 mx-auto max-w-full`;
      case 'tablet': 
        return `w-3/4 mx-auto max-w-full`;
      default: 
        return 'w-full';
    }
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
              <div className={`h-full bg-white p-2 sm:p-4 ${getPreviewWidth()} relative overflow-auto`}>
                <div className="h-full border rounded-lg overflow-hidden relative min-h-[400px]">
                  {isElementSelectorActive && (
                    <ElementSelector 
                      onElementSelect={handleElementSelect}
                      isActive={isElementSelectorActive}
                    />
                  )}
                  <iframe
                    src={`data:text/html;charset=utf-8,%3Chtml%3E%3Chead%3E%3Cmeta%20name%3D%22viewport%22%20content%3D%22width%3Ddevice-width%2C%20initial-scale%3D1.0%22%3E%3Cstyle%3Ebody%7Bfont-family%3AArial%2Csans-serif%3Bmargin%3A0%3Bpadding%3A10px%3Bbackground%3Alinear-gradient(135deg%2C%20%23dc2626%200%25%2C%20%23991b1b%20100%25)%3Bmin-height%3A100vh%3Bcolor%3Awhite%3Boverflow-x%3Ahidden%7D.container%7Bmax-width%3A100%25%3Bmargin%3A0%20auto%3Bbackground%3Argba(255%2C255%2C255%2C0.1)%3Bpadding%3A20px%3Bborder-radius%3A15px%3Bbackdrop-filter%3Ablur(10px)%3Bbox-shadow%3A0%2010px%2030px%20rgba(0%2C0%2C0%2C0.3)%3Bposition%3Arelative%3Bword-wrap%3Abreak-word%7D.header%7Bdisplay%3Aflex%3Balign-items%3Acenter%3Bgap%3A10px%3Bmargin-bottom%3A20px%3Bpadding-bottom%3A15px%3Bborder-bottom%3A1px%20solid%20rgba(255%2C255%2C255%2C0.2)%7D.youtube-icon%7Bwidth%3A40px%3Bheight%3A40px%3Bbackground%3A%23FF0000%3Bborder-radius%3A8px%3Bdisplay%3Aflex%3Balign-items%3Acenter%3Bjustify-content%3Acenter%3Bcolor%3Awhite%3Bfont-weight%3Abold%7Dh1%7Bcolor%3A%23fff%3Bmargin%3A0%3Btext-shadow%3A0%202px%204px%20rgba(0%2C0%2C0%2C0.3)%3Bcursor%3Apointer%3Bfont-size%3Aclamp(1.5rem%2C4vw%2C2.5rem)%7Dh1%3Ahover%7Bbox-shadow%3A0%200%2010px%20rgba(255%2C0%2C0%2C0.5)%7D.subtitle%7Bcolor%3A%23ffcccc%3Bfont-size%3A0.9rem%3Bmargin-top%3A5px%7Dp%7Bcolor%3A%23f0f0f0%3Bline-height%3A1.6%3Bcursor%3Apointer%3Bfont-size%3Aclamp(0.9rem%2C2.5vw%2C1.1rem)%7Dp%3Ahover%7Bbox-shadow%3A0%200%205px%20rgba(255%2C0%2C0%2C0.3)%7D.feature%7Bbackground%3Argba(255%2C255%2C255%2C0.1)%3Bpadding%3A15px%3Bmargin%3A15px%200%3Bborder-radius%3A10px%3Bborder%3A1px%20solid%20rgba(255%2C0%2C0%2C0.3)%3Bcursor%3Apointer%3Btransition%3Aall%200.3s%7D.feature%3Ahover%7Bbox-shadow%3A0%200%2015px%20rgba(255%2C0%2C0%2C0.4)%3Btransform%3AscaleY(1.02)%7D.feature%20h3%7Bfont-size%3Aclamp(1rem%2C3vw%2C1.3rem)%3Bmargin-bottom%3A8px%3Bcolor%3A%23ffcccc%7D.btn%7Bbackground%3Alinear-gradient(45deg%2C%20%23FF0000%2C%20%23cc0000)%3Bcolor%3Awhite%3Bpadding%3A12px%2020px%3Bborder%3Anone%3Bborder-radius%3A8px%3Bcursor%3Apointer%3Bfont-weight%3A600%3Btransition%3Aall%200.3s%3Bbox-shadow%3A0%204px%2015px%20rgba(255%2C0%2C0%2C0.3)%3Bwidth%3A100%25%3Bmargin-top%3A15px%3Bfont-size%3Aclamp(0.9rem%2C2.5vw%2C1rem)%7D.btn%3Ahover%7Btransform%3AtranslateY(-2px)%3Bbox-shadow%3A0%208px%2025px%20rgba(255%2C0%2C0%2C0.4)%7D.video-grid%7Bdisplay%3Agrid%3Bgrid-template-columns%3Arepeat(auto-fit%2C%20minmax(200px%2C%201fr))%3Bgap%3A15px%3Bmargin%3A20px%200%7D.video-card%7Bbackground%3Argba(255%2C255%2C255%2C0.1)%3Bborder-radius%3A8px%3Bpadding%3A10px%3Bborder%3A1px%20solid%20rgba(255%2C0%2C0%2C0.2)%3Btransition%3Aall%200.3s%7D.video-card%3Ahover%7Btransform%3Ascale(1.05)%7D.video-thumbnail%7Bwidth%3A100%25%3Bheight%3A100px%3Bbackground%3A%23333%3Bborder-radius%3A5px%3Bdisplay%3Aflex%3Balign-items%3Acenter%3Bjustify-content%3Acenter%3Bmargin-bottom%3A8px%7D%40media(max-width%3A768px)%7B.container%7Bpadding%3A15px%3Bmargin%3A5px%7D%7D%3C%2Fstyle%3E%3Cscript%3Efunction%20selectElement(e)%7Be.preventDefault()%3Bconst%20element%3De.target%3Bif(window.parent)%7Bwindow.parent.postMessage(%7Btype%3A'elementSelected'%2CelementId%3Aelement.tagName%2BDate.now()%2CelementType%3Aelement.tagName%2CelementText%3Aelement.textContent%7D%2C'*')%3B%7D%7Ddocument.addEventListener('click'%2CselectElement)%3B%3C%2Fscript%3E%3C%2Fhead%3E%3Cbody%3E%3Cdiv%20class%3D%22container%22%3E%3Cdiv%20class%3D%22header%22%3E%3Cdiv%20class%3D%22youtube-icon%22%3E▶%3C%2Fdiv%3E%3Cdiv%3E%3Ch1%20data-editable%3D%22title%22%3E${encodeURIComponent(projectIdea)}%3C%2Fh1%3E%3Cdiv%20class%3D%22subtitle%22%3EYouTube%20Channel%20Website%3C%2Fdiv%3E%3C%2Fdiv%3E%3C%2Fdiv%3E%3Cp%20data-editable%3D%22description%22%3EWelcome%20to%20my%20YouTube%20channel%20website%21%20Here%20you%27ll%20find%20all%20my%20latest%20videos%2C%20playlists%2C%20and%20updates.%20Don%27t%20forget%20to%20subscribe%20for%20more%20amazing%20content%21%3C%2Fp%3E%3Cdiv%20class%3D%22feature%22%20data-editable%3D%22feature1%22%3E%3Ch3%3E📺%20Latest%20Videos%3C%2Fh3%3E%3Cp%3ECheck%20out%20my%20newest%20uploads%20and%20trending%20content%20from%20my%20YouTube%20channel.%3C%2Fp%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22video-grid%22%3E%3Cdiv%20class%3D%22video-card%22%3E%3Cdiv%20class%3D%22video-thumbnail%22%3E▶%3C%2Fdiv%3E%3Cp%3ELatest%20Video%3C%2Fp%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22video-card%22%3E%3Cdiv%20class%3D%22video-thumbnail%22%3E▶%3C%2Fdiv%3E%3Cp%3EPopular%20Video%3C%2Fp%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22video-card%22%3E%3Cdiv%20class%3D%22video-thumbnail%22%3E▶%3C%2Fdiv%3E%3Cp%3ETrending%20Video%3C%2Fp%3E%3C%2Fdiv%3E%3C%2Fdiv%3E%3Cdiv%20class%3D%22feature%22%20data-editable%3D%22feature2%22%3E%3Ch3%3E🔔%20Subscribe%20%26%20Connect%3C%2Fh3%3E%3Cp%3EConnected%20to%3A%20${encodeURIComponent(youtubeUrl)}%3C%2Fp%3E%3Cp%3EJoin%20our%20community%20and%20never%20miss%20an%20upload%21%20Follow%20me%20on%20all%20social%20platforms.%3C%2Fp%3E%3C%2Fdiv%3E%3Cbutton%20class%3D%22btn%22%20data-editable%3D%22button%22%20onclick%3D%22alert('🎉%20Thanks%20for%20visiting%21%20Don%5C%27t%20forget%20to%20subscribe%20to%20my%20YouTube%20channel%21')%22%3E🔔%20Subscribe%20to%20My%20Channel%3C%2Fbutton%3E%3C%2Fdiv%3E%3C%2Fbody%3E%3C%2Fhtml%3E`}
                    className="w-full h-full border-0"
                    title="YouTube Website Preview"
                    style={{ 
                      minHeight: deviceType === 'mobile' ? '400px' : '600px',
                      height: '100%'
                    }}
                  />
                </div>
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
