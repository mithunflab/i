
import React, { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Smartphone, Tablet, Monitor, ExternalLink, CheckCircle } from 'lucide-react';

interface PreviewFrameProps {
  youtubeUrl?: string;
  projectIdea?: string;
  previewMode?: 'mobile' | 'tablet' | 'desktop';
  generatedCode?: string;
  channelData?: any;
}

const PreviewFrame: React.FC<PreviewFrameProps> = ({
  youtubeUrl,
  projectIdea,
  previewMode = 'desktop',
  generatedCode,
  channelData
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasVerifiedBadge, setHasVerifiedBadge] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (generatedCode && iframeRef.current) {
      setIsLoading(true);
      
      // Check if this is a verified project (simulation)
      const isVerified = generatedCode.includes('verified') || Math.random() > 0.7;
      setHasVerifiedBadge(isVerified);
      
      try {
        const iframe = iframeRef.current;
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (doc) {
          // Add verification badge to generated code if verified
          let finalCode = generatedCode;
          if (isVerified && !finalCode.includes('verification-badge')) {
            const badgeHTML = `
              <div class="verification-badge" style="position: fixed; top: 10px; right: 10px; z-index: 9999; background: linear-gradient(45deg, #10b981, #3b82f6); color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Verified Site
              </div>
            `;
            
            if (finalCode.includes('<body>')) {
              finalCode = finalCode.replace('<body>', `<body>${badgeHTML}`);
            } else if (finalCode.includes('</head>')) {
              finalCode = finalCode.replace('</head>', `</head><body>${badgeHTML}`);
            }
          }
          
          doc.open();
          doc.write(finalCode);
          doc.close();
          
          setTimeout(() => setIsLoading(false), 1000);
        }
      } catch (error) {
        console.error('Error updating iframe:', error);
        setIsLoading(false);
      }
    }
  }, [generatedCode]);

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: '375px', height: '667px', scale: 0.8 };
      case 'tablet':
        return { width: '768px', height: '1024px', scale: 0.7 };
      default:
        return { width: '100%', height: '100%', scale: 1 };
    }
  };

  const dimensions = getPreviewDimensions();

  const getDeviceIcon = () => {
    switch (previewMode) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Preview Header */}
      <div className="p-4 border-b border-purple-500/30 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-cyan-400">
              {getDeviceIcon()}
              <span className="text-sm font-medium">
                {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} Preview
              </span>
            </div>
            {hasVerifiedBadge && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
                <CheckCircle size={12} />
                Verified
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {generatedCode && (
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className={isLoading ? 'text-yellow-400' : 'text-green-400'}>
                  {isLoading ? 'Loading...' : 'Live'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {channelData && (
          <div className="text-xs text-gray-400">
            Building for: {channelData.title || 'YouTube Channel'}
          </div>
        )}
      </div>

      {/* Preview Content */}
      <div className="flex-1 p-4 overflow-auto">
        {generatedCode ? (
          <div className="h-full flex items-center justify-center">
            <Card 
              className="bg-white border-gray-300 shadow-2xl overflow-hidden relative"
              style={{
                width: dimensions.width,
                height: dimensions.height,
                transform: `scale(${dimensions.scale})`,
                transformOrigin: 'center center'
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-sm text-gray-600">Loading your website...</div>
                  </div>
                </div>
              )}
              
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Website Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                style={{ 
                  backgroundColor: 'white',
                  minHeight: '100%'
                }}
              />
              
              {/* External Link Overlay */}
              <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                <button className="p-1 bg-black/50 text-white rounded hover:bg-black/70">
                  <ExternalLink size={14} />
                </button>
              </div>
            </Card>
          </div>
        ) : (
          /* No Code Generated State */
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                  <Monitor size={32} className="text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready for Live Preview
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Start chatting with the AI to generate your website code. You'll see the live preview here as it's being created.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 text-left">
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-purple-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Real-time code generation</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-purple-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Responsive design preview</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 border border-purple-500/20 rounded-lg">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">YouTube integration ready</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewFrame;
