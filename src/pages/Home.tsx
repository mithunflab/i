
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Youtube, Globe, Code, Zap, Shield, Menu, X } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';

const Home = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-r from-red-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">AI Website Builder</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Home
                </Link>
                <Link to="/about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  About
                </Link>
                <Link to="/features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Features
                </Link>
                <Link to="/pricing" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Pricing
                </Link>
                <Link to="/contact" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Contact
                </Link>
                <Link to="/workspace" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                  Workspace
                </Link>
              </div>
            </div>

            <div className="hidden md:block">
              <Link to="/login">
                <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 rounded-lg mt-2">
                <Link to="/" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Home
                </Link>
                <Link to="/about" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  About
                </Link>
                <Link to="/features" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Features
                </Link>
                <Link to="/pricing" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Pricing
                </Link>
                <Link to="/contact" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Contact
                </Link>
                <Link to="/workspace" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Workspace
                </Link>
                <Link to="/login" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Background Effects */}
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-red-900/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-pink-900/20 to-transparent"></div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Transform YouTube Channels into Stunning Websites
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create professional websites from YouTube content using AI. No coding required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-lg px-8 py-4">
                <Play className="mr-2 h-5 w-5" />
                Start Building
              </Button>
            </Link>
            <Link to="/features">
              <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-white/10 text-lg px-8 py-4">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="relative z-10 py-20 bg-gradient-to-b from-transparent to-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Features for Content Creators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Youtube className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">YouTube Integration</h3>
                <p className="text-gray-400">Seamlessly connect your YouTube channel and import content</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
                <p className="text-gray-400">Advanced AI creates beautiful, responsive websites automatically</p>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Professional Results</h3>
                <p className="text-gray-400">Get production-ready websites that look amazing on all devices</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators who've already built amazing websites with our platform.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-lg px-12 py-4">
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default Home;
