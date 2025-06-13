
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Youtube, 
  Code, 
  Zap, 
  Globe, 
  Star, 
  ArrowRight,
  CheckCircle,
  Sparkles,
  Brain,
  Rocket
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Youtube className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">AI Website Builder</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
              <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
              <Button 
                onClick={handleGetStarted}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-red-100 text-red-700 border-red-200">
            <Sparkles className="w-4 h-4 mr-1" />
            AI-Powered Website Builder
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Amazing
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-700 block">
              YouTube Websites
            </span>
            in Minutes
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your YouTube channel into a professional website with AI. 
            No coding required - just describe what you want and watch it come to life!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Building Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/features')}
              className="border-red-200 text-red-700 hover:bg-red-50 px-8 py-6 text-lg"
            >
              <Brain className="w-5 h-5 mr-2" />
              View Features
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">10K+</div>
              <div className="text-gray-600">Websites Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">5min</div>
              <div className="text-gray-600">Average Build Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">99%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Content Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to create a professional online presence for your YouTube channel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Youtube className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>YouTube Integration</CardTitle>
                <CardDescription>
                  Automatically sync your channel data, videos, and branding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>AI-Powered Design</CardTitle>
                <CardDescription>
                  Smart AI creates beautiful layouts based on your content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Real-time Preview</CardTitle>
                <CardDescription>
                  See changes instantly as you customize your website
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>No Code Required</CardTitle>
                <CardDescription>
                  Build professional websites without writing a single line of code
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Mobile Responsive</CardTitle>
                <CardDescription>
                  Your website looks perfect on all devices automatically
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle>Professional Templates</CardTitle>
                <CardDescription>
                  Choose from stunning templates designed for content creators
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Build Your Website?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of creators who have built amazing websites with our AI-powered platform
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-red-600 hover:bg-gray-50 px-8 py-6 text-lg font-semibold"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Start Building Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">AI Website Builder</span>
          </div>
          <p className="text-gray-400 mb-6">
            The easiest way to create professional websites for your YouTube channel
          </p>
          <div className="flex justify-center gap-6 text-sm text-gray-400">
            <button onClick={() => navigate('/features')}>Features</button>
            <button onClick={() => navigate('/pricing')}>Pricing</button>
            <button onClick={() => navigate('/about')}>About</button>
            <button onClick={() => navigate('/contact')}>Contact</button>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
            © 2024 AI Website Builder. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
