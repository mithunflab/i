
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Award, Rocket } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen bg-black">
      <div className="absolute inset-0 bg-noise opacity-20"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">About Our Platform</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We're building the future of AI-powered web development, making it accessible to everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">10K+ Users</h3>
              <p className="text-gray-400 text-sm">Developers worldwide</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">99.9%</h3>
              <p className="text-gray-400 text-sm">Uptime guaranteed</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Award className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">50+</h3>
              <p className="text-gray-400 text-sm">Awards won</p>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Rocket className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">1M+</h3>
              <p className="text-gray-400 text-sm">Projects deployed</p>
            </CardContent>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto text-gray-300 space-y-6">
          <p className="text-lg leading-relaxed">
            Our platform was born from the vision of democratizing web development through AI. 
            We believe that everyone should have the power to create beautiful, functional websites 
            without years of coding experience.
          </p>
          <p className="text-lg leading-relaxed">
            Founded in 2023, we've grown from a small team of passionate developers to a global 
            community of creators, innovators, and dreamers. Our AI-powered tools have helped 
            thousands of users bring their ideas to life.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
