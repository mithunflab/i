
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Home, 
  Youtube, 
  Zap, 
  Code, 
  Shield, 
  Users, 
  Star,
  Globe,
  TrendingUp,
  Heart,
  Rocket
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: "AI Development Team",
      role: "Core Technology",
      description: "Building next-generation AI tools for content creators",
      icon: Code
    },
    {
      name: "YouTube Specialists",
      role: "Platform Integration", 
      description: "Expert integration with YouTube APIs and creator tools",
      icon: Youtube
    },
    {
      name: "Design Team",
      role: "User Experience",
      description: "Creating beautiful, intuitive interfaces for creators",
      icon: Star
    }
  ];

  const features = [
    {
      icon: Youtube,
      title: "YouTube-First Design",
      description: "Built specifically for YouTubers to showcase their content beyond the platform"
    },
    {
      icon: Zap,
      title: "AI-Powered Creation",
      description: "Smart algorithms that understand your content style and brand"
    },
    {
      icon: Globe,
      title: "Professional Hosting",
      description: "Reliable, fast hosting with custom domain support"
    },
    {
      icon: Shield,
      title: "Creator-Friendly",
      description: "No technical knowledge required - focus on your content"
    }
  ];

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      {/* Navigation Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            className="border-gray-600 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-r from-red-600 to-pink-600 p-4 rounded-full">
                <Youtube className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              About Our Platform
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're revolutionizing how YouTubers build their online presence. 
              Our AI-powered platform makes it easy to create stunning websites 
              that showcase your content and grow your audience.
            </p>
          </div>
          
          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <Rocket className="h-8 w-8 text-red-500" />
                  <CardTitle className="text-2xl text-white">Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  To empower every YouTube creator with professional tools to build 
                  their brand beyond the platform. We believe every creator deserves 
                  a beautiful, functional website without the technical complexity.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="h-8 w-8 text-purple-400" />
                  <CardTitle className="text-2xl text-white">Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  A world where content creators can focus on what they do best - 
                  creating amazing content - while we handle the technology to 
                  help them build thriving online businesses.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Why Creators Choose Us
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <feature.icon className={`h-8 w-8 ${feature.icon === Youtube ? 'text-red-500' : 'text-purple-400'}`} />
                      <CardTitle className="text-white">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Our Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-colors text-center">
                  <CardHeader>
                    <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-full w-fit">
                      <member.icon className="h-8 w-8 text-purple-400" />
                    </div>
                    <CardTitle className="text-white">{member.name}</CardTitle>
                    <p className="text-red-400 font-medium">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[
              { value: '10K+', label: 'Websites Created' },
              { value: '5K+', label: 'Happy Creators' },
              { value: '500K+', label: 'Videos Showcased' },
              { value: '2M+', label: 'Monthly Visitors' }
            ].map((stat, index) => (
              <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm text-center p-6">
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-red-600/20 to-pink-600/20 border-red-500/30 backdrop-blur-sm text-center">
            <CardContent className="p-12">
              <Youtube className="h-16 w-16 text-red-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to Build Your Creator Website?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of YouTubers who've already created stunning websites for their channels
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
                  onClick={() => navigate('/login')}
                >
                  Start Building Free
                  <Heart className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-white/10"
                  onClick={() => navigate('/features')}
                >
                  Explore Features
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
