
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-20"></div>
      
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          onClick={() => navigate('/')} 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 text-center">
            About Our Platform
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
              <p className="text-gray-300 leading-relaxed">
                We're revolutionizing how developers and creators build web applications. 
                Our platform combines the power of AI with intuitive design tools to make 
                web development accessible to everyone.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Technology</h2>
              <p className="text-gray-300 leading-relaxed">
                Built on cutting-edge technologies including React, TypeScript, and 
                modern deployment platforms. We integrate with GitHub, Netlify, and 
                YouTube APIs to provide seamless development experiences.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
            <h2 className="text-3xl font-semibold text-white mb-6 text-center">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-purple-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Easy Deployment</h3>
                <p className="text-gray-300">Deploy to Netlify with one click</p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
                <p className="text-gray-300">Monitor your applications in real-time</p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-500/20 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl">🎥</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">YouTube Integration</h3>
                <p className="text-gray-300">Create websites from YouTube channels</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
