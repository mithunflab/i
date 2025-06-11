
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserPortalSwitch = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Only show this component for admin users
  if (profile?.role !== 'admin') {
    return null;
  }

  const switchToUserPortal = () => {
    navigate('/');
  };

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="h-5 w-5" />
          Portal Access
          <Badge variant="outline" className="ml-auto text-purple-300 border-purple-400">
            Admin Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Developer Portal</h3>
              <p className="text-sm text-gray-400">You are currently in the admin/developer portal</p>
            </div>
          </div>
          <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30">
            Current
          </Badge>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">User Portal</h3>
              <p className="text-sm text-gray-400">Switch to the regular user interface</p>
            </div>
          </div>
          <Button 
            onClick={switchToUserPortal}
            variant="outline" 
            size="sm"
            className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
          >
            Switch <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-300">
            <Settings className="inline h-3 w-3 mr-1" />
            As an admin, you have access to both portals. Regular users only see the user portal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserPortalSwitch;
