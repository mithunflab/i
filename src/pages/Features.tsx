
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Shield, Users, Globe, Code, Palette, Database, Cloud } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Development',
      description: 'Build and deploy applications in minutes with our AI-powered tools.',
      color: 'text-yellow-400'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade security with end-to-end encryption and compliance.',
      color: 'text-green-400'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Real-time collaboration with version control and team management.',
      color: 'text-blue-400'
    },
    {
      icon: Globe,
      title: 'Global CDN',
      description: 'Deploy globally with our edge-optimized content delivery network.',
      color: 'text-purple-400'
    },
    {
      icon: Code,
      title: 'AI Code Generation',
      description: 'Generate clean, maintainable code with our advanced AI models.',
      color: 'text-orange-400'
    },
    {
      icon: Palette,
      title: 'Design System',
      description: 'Comprehensive design system with customizable components.',
      color: 'text-pink-400'
    },
    {
      icon: Database,
      title: 'Database Integration',
      description: 'Seamless integration with popular databases and APIs.',
      color: 'text-cyan-400'
    },
    {
      icon: Cloud,
      title: 'Cloud Deployment',
      description: 'One-click deployment to major cloud providers.',
      color: 'text-indigo-400'
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">Powerful Features</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to build, deploy, and scale modern web applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/5 border-gray-800 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <CardContent className="p-8">
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
