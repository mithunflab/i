
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Code, 
  Eye, 
  Youtube,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealYouTubeData } from '@/hooks/useRealYouTubeData';
import SimpleChatbot from './SimpleChatbot';

const YouTubeWorkspace: React.FC = () => {
  const location = useLocation();
  const { youtubeUrl, projectIdea, channelData } = location.state || {};
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeView, setIsCodeView] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const { fetchRealChannelData, loading } = useRealYouTubeData();
  const { toast } = useToast();

  // Particle animation effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 10 + 5}px;
        height: ${Math.random() * 10 + 5}px;
        background-color: rgba(0, 255, 255, ${Math.random() * 0.15 + 0.05});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: float ${Math.random() * 10 + 10}s infinite ease-in-out;
        pointer-events: none;
      `;
      return particle;
    };

    const heroSection = document.querySelector('.hero-background');
    if (heroSection) {
      // Add initial particles
      for (let i = 0; i < 15; i++) {
        heroSection.appendChild(createParticle());
      }
    }

    // Add keyframes for particle animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.1; }
        25% { transform: translateY(-20px) rotate(90deg); opacity: 0.15; }
        50% { transform: translateY(-10px) rotate(180deg); opacity: 0.1; }
        75% { transform: translateY(-30px) rotate(270deg); opacity: 0.15; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  const handleCodeUpdate = (newCode: string) => {
    setGeneratedCode(newCode);
    toast({
      title: "Website Updated",
      description: "Your changes have been applied successfully",
    });
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px' };
      case 'tablet':
        return { width: '768px', height: '1024px' };
      default:
        return { width: '100%', height: '100%' };
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Left Panel - AI Chat with Gradient Background */}
      <div className="w-1/2 relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-800 to-purple-900"></div>
        
        {/* Chat Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <h2 className="font-semibold text-white">Lovable AI Assistant</h2>
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  Active
                </Badge>
              </div>
              <div className="text-xs text-white/60">
                {new Date().toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  second: '2-digit', 
                  hour12: true 
                })}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-hidden">
            <SimpleChatbot
              projectId="youtube-workspace"
              sourceCode={generatedCode}
              channelData={channelData}
              onCodeUpdate={handleCodeUpdate}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Preview/Code */}
      <div className="w-1/2 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium text-gray-600">
                {channelData?.title || 'YouTube Workspace'}
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            
            {/* Preview Mode Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="view-mode"
                checked={isCodeView}
                onCheckedChange={setIsCodeView}
              />
              <label htmlFor="view-mode" className="text-sm text-gray-600 cursor-pointer">
                {isCodeView ? 'Code' : 'Preview'}
              </label>
              {isCodeView ? <Code className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
            </div>
            <Badge variant="outline" className="text-xs">
              Desktop Preview
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isCodeView ? (
            <div className="h-full p-4">
              <div className="h-full bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 overflow-auto">
                <pre className="whitespace-pre-wrap">
                  {generatedCode || '// Your generated code will appear here...'}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4">
              {generatedCode ? (
                <div 
                  className="bg-white rounded-lg shadow-xl overflow-hidden"
                  style={getPreviewDimensions()}
                >
                  <iframe
                    srcDoc={generatedCode}
                    className="w-full h-full border-0"
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : (
                /* Hero Section with Particle Effects */
                <div className="hero-background relative w-full max-w-[720px] mx-auto bg-gradient-to-br from-[#0b0f1a] to-[#121c30] rounded-xl p-10 text-center overflow-hidden">
                  {/* Vignette Effect */}
                  <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/30 pointer-events-none"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Profile Section */}
                    <div className="flex items-center justify-center mb-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={channelData?.thumbnail || '/api/placeholder/50/50'}
                          alt="Channel"
                          className="w-12 h-12 rounded-full shadow-lg"
                        />
                        <h1 className="text-4xl md:text-5xl font-bold uppercase text-[#00cfff] tracking-wide" 
                            style={{ 
                              fontFamily: 'Poppins, Inter, sans-serif',
                              textShadow: '0 0 20px rgba(0, 207, 255, 0.5)',
                              letterSpacing: '0.5px'
                            }}>
                          {channelData?.title || 'CHANNEL NAME'}
                        </h1>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-lg text-[#dddddd] mb-8 leading-relaxed font-medium">
                      Hi guys welcome 🙏 to our new channel SUBSCRIBE to get satisfyiying vedio$
                    </p>

                    {/* CTA Button */}
                    <Button 
                      className="bg-[#ff0000] hover:bg-[#cc0000] text-white font-semibold text-lg px-6 py-3 rounded-full flex items-center gap-3 mx-auto transition-all duration-200 hover:scale-105 shadow-lg"
                      onClick={() => window.open(youtubeUrl, '_blank')}
                    >
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                        <Youtube className="w-4 h-4 text-[#ff0000]" />
                      </div>
                      Subscribe Now
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-8 border-t border-gray-200 bg-white flex items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            Live Preview Active
          </div>
          <div>
            {channelData?.title ? `Building for ${channelData.title}` : 'Ready to build'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeWorkspace;
