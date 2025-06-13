
import React from 'react';
import { Hero2 } from '@/components/ui/hero-2-1';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Youtube, 
  Zap, 
  Code, 
  Rocket, 
  Shield, 
  Clock, 
  Users, 
  Star,
  CheckCircle,
  ArrowRight,
  Globe,
  Palette,
  TrendingUp,
  Play,
  Eye,
  Heart
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: Youtube,
      title: 'YouTube Channel Integration',
      description: 'Connect your YouTube channel and automatically import videos, playlists, and channel branding into your website.'
    },
    {
      icon: Zap,
      title: 'AI Website Generation',
      description: 'Our AI analyzes your content style and creates a custom website that perfectly matches your YouTube brand.'
    },
    {
      icon: Palette,
      title: 'Smart Design Matching',
      description: 'AI detects your thumbnail colors, video style, and creates a cohesive design that represents your content.'
    },
    {
      icon: Globe,
      title: 'Professional Hosting',
      description: 'Get a custom domain and professional hosting to showcase your content beyond YouTube.'
    },
    {
      icon: TrendingUp,
      title: 'Audience Growth Tools',
      description: 'Built-in SEO, social sharing, and analytics to help grow your audience across platforms.'
    },
    {
      icon: Shield,
      title: 'Creator-Friendly',
      description: 'No coding knowledge required. Perfect for YouTubers who want to expand their online presence.'
    }
  ];

  const stats = [
    { label: 'YouTube Websites Created', value: '10K+', icon: Youtube },
    { label: 'Content Creators', value: '5K+', icon: Users },
    { label: 'Videos Showcased', value: '500K+', icon: Play },
    { label: 'Monthly Visitors', value: '2M+', icon: Eye }
  ];

  const pricingPlans = [
    {
      name: 'Creator',
      price: 'Free',
      description: 'Perfect for starting YouTubers',
      features: ['1 YouTube website', 'Basic templates', 'YouTube integration', 'Community support'],
      cta: 'Start Free'
    },
    {
      name: 'Pro Creator',
      price: '$19',
      description: 'For growing YouTube channels',
      features: ['5 YouTube websites', 'Premium templates', 'Custom domain', 'Analytics dashboard', 'Priority support'],
      cta: 'Go Pro',
      popular: true
    },
    {
      name: 'Creator Studio',
      price: '$49',
      description: 'For YouTube businesses',
      features: ['Unlimited websites', 'White-label options', 'Advanced integrations', 'Custom branding', '24/7 support'],
      cta: 'Scale Up'
    }
  ];

  const handleGetStarted = () => {
    if (user) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const handleLearnMore = () => {
    navigate('/features');
  };

  const handlePricing = () => {
    navigate('/pricing');
  };

  const handleContact = () => {
    navigate('/contact');
  };

  const handleAbout = () => {
    navigate('/about');
  };

  const handleWorkspace = () => {
    if (user) {
      navigate('/workspace');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 bg-noise opacity-20"></div>

      {/* Hero Section */}
      <div className="relative z-10">
        <Hero2 />
      </div>

      {/* Custom Content Sections */}
      <div className="relative z-10 py-20">
        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Trusted by YouTubers Worldwide
            </h2>
            <p className="text-xl text-gray-400">
              Helping content creators build their online presence beyond YouTube
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all" onClick={handleGetStarted}>
                <CardContent className="p-6 text-center">
                  <stat.icon className="h-8 w-8 text-red-500 mx-auto mb-4" />
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything YouTubers Need for Their Website
            </h2>
            <p className="text-xl text-gray-400">
              Purpose-built tools for content creators to showcase their YouTube channel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-colors cursor-pointer" onClick={handleGetStarted}>
                <CardHeader>
                  <feature.icon className={`h-10 w-10 ${feature.icon === Youtube ? 'text-red-500' : 'text-purple-400'} mb-4`} />
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Action Buttons */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={handleWorkspace}
              className="h-16 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 flex flex-col gap-2"
            >
              <Youtube size={20} />
              <span className="text-sm">Create Website</span>
            </Button>
            <Button 
              onClick={handleAbout}
              variant="outline"
              className="h-16 border-gray-600 text-white hover:bg-white/10 flex flex-col gap-2"
            >
              <Users size={20} />
              <span className="text-sm">For Creators</span>
            </Button>
            <Button 
              onClick={handlePricing}
              variant="outline"
              className="h-16 border-gray-600 text-white hover:bg-white/10 flex flex-col gap-2"
            >
              <TrendingUp size={20} />
              <span className="text-sm">Pricing</span>
            </Button>
            <Button 
              onClick={handleContact}
              variant="outline"
              className="h-16 border-gray-600 text-white hover:bg-white/10 flex flex-col gap-2"
            >
              <Heart size={20} />
              <span className="text-sm">Support</span>
            </Button>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="max-w-7xl mx-auto px-6 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Creator-Friendly Pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, grow with your channel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`bg-white/5 border-gray-800 backdrop-blur-sm relative cursor-pointer hover:bg-white/10 transition-all ${
                plan.popular ? 'border-red-500/50 scale-105' : ''
              }`} onClick={handleGetStarted}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-red-600 to-pink-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-white">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-white">{plan.price}</div>
                  <p className="text-gray-400">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetStarted();
                    }}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 text-center">
          <Card className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/30 backdrop-blur-sm cursor-pointer hover:bg-gradient-to-r hover:from-red-600/30 hover:to-pink-600/30 transition-all" onClick={handleGetStarted}>
            <CardContent className="p-12">
              <Youtube className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Showcase Your YouTube Channel?
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Join thousands of YouTubers who've created stunning websites for their channels
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetStarted();
                  }}
                >
                  Build Your Website Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLearnMore();
                  }}
                >
                  See Examples
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default Home;
