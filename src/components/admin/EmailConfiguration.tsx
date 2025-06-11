
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Send } from 'lucide-react';

const EmailConfiguration = () => {
  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Mail size={20} />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="responsive-grid gap-4">
            <div>
              <label className="text-sm font-medium">SMTP Host</label>
              <Input placeholder="smtp.gmail.com" className="bolt-input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">SMTP Port</label>
              <Input placeholder="587" className="bolt-input mt-1" />
            </div>
          </div>
          
          <div className="responsive-grid gap-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input placeholder="your-email@gmail.com" className="bolt-input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="App Password" className="bolt-input mt-1" />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">From Email</label>
            <Input placeholder="noreply@yourdomain.com" className="bolt-input mt-1" />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button className="bolt-button text-sm">
              <Send size={16} />
              Test Connection
            </Button>
            <Button variant="outline" className="text-sm">
              Save Configuration
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailConfiguration;
