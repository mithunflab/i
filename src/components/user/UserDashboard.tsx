
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, Youtube, Rocket, Code, Zap, Users, TrendingUp, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [projectIdea, setProjectIdea] = useState('');

  const handleCreateWebsite = () => {
    if (!youtubeUrl || !projectIdea) {
      alert('Please fill in both your YouTube channel URL and website description');
      return;
    }
    
    // Navigate to workspace with project data
    navigate('/workspace', { 
      state: { 
        youtubeUrl, 
        projectIdea 
      } 
    });
  };

  const displayName = profile?.full_name || user?.email || 'Creator';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold neon-text">YouTube Website Builder</h1>
            <p className="text-sm text-muted-foreground">Welcome back, {displayName}</p>
          </div>
          <Button onClick={logout} variant="outline" className="flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 neon-text">
            Turn Your YouTube Channel Into a Professional Website
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            No coding required! Just paste your YouTube channel link and describe your vision
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="cyber-border">
              <CardContent className="p-6 text-center">
                <Youtube className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">YouTube Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically import your channel info, videos, and branding
                </p>
              </CardContent>
            </Card>
            
            <Card className="cyber-border">
              <CardContent className="p-6 text-center">
                <Zap className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold mb-2">AI-Powered Design</h3>
                <p className="text-sm text-muted-foreground">
                  Smart AI creates a custom website that matches your content style
                </p>
              </CardContent>
            </Card>
            
            <Card className="cyber-border">
              <CardContent className="p-6 text-center">
                <Globe className="w-12 h-12 text-accent mx-auto mb-4" />
                <h3 className="font-semibold mb-2">One-Click Publish</h3>
                <p className="text-sm text-muted-foreground">
                  Launch your website instantly with professional hosting
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Create Website Form */}
        <Card className="cyber-border max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="text-red-500" />
              Create Your Website
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Your YouTube Channel URL
              </label>
              <Input
                placeholder="https://www.youtube.com/@yourchannel"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="bg-input border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                We'll analyze your videos, thumbnails, and channel branding
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">
                Describe Your Website Vision
              </label>
              <Textarea
                placeholder="What kind of website do you want? (e.g., 'A gaming portfolio site with dark theme and neon effects' or 'A cooking blog with warm colors and recipe sections')"
                value={projectIdea}
                onChange={(e) => setProjectIdea(e.target.value)}
                rows={4}
                className="bg-input border-border resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe your style preferences, target audience, and desired features
              </p>
            </div>
            
            <Button 
              onClick={handleCreateWebsite}
              className="w-full cyber-button text-lg py-6"
              disabled={!youtubeUrl || !projectIdea}
            >
              <Rocket className="mr-2" />
              Build My Website
            </Button>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold mb-6">Your YouTube Websites</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Gaming Channel Site", views: "1.2K", status: "Live" },
              { name: "Cooking Blog", views: "850", status: "Live" },
              { name: "Tech Reviews", views: "2.1K", status: "Live" }
            ].map((project, i) => (
              <Card key={i} className="cyber-border">
                <CardContent className="p-6">
                  <div className="w-full h-32 bg-gradient-to-br from-red-500/20 to-accent/20 rounded mb-4 flex items-center justify-center">
                    <Youtube className="w-12 h-12 text-red-500" />
                  </div>
                  <h4 className="font-semibold mb-2">{project.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {project.views} views • {project.status}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs">
                      Edit Site
                    </Button>
                    <Button variant="outline" className="flex-1 text-xs">
                      View Live
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
