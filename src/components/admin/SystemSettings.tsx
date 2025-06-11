
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Server, Database, Shield } from 'lucide-react';

const SystemSettings = () => {
  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Settings size={20} />
          System Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mobile-text">Maintenance Mode</h3>
              <p className="text-xs text-muted-foreground">Enable to show maintenance page</p>
            </div>
            <Switch />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mobile-text">Auto Backups</h3>
              <p className="text-xs text-muted-foreground">Automatic daily database backups</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mobile-text">Debug Mode</h3>
              <p className="text-xs text-muted-foreground">Enable detailed error logging</p>
            </div>
            <Switch />
          </div>
          
          <div className="pt-4 border-t border-border/50">
            <Button className="bolt-button text-sm">
              Save Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
