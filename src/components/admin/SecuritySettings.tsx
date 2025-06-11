
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Key, AlertTriangle, CheckCircle } from 'lucide-react';

const SecuritySettings = () => {
  const securityFeatures = [
    { name: 'Two-Factor Authentication', status: 'enabled', icon: Lock, description: 'Extra layer of account security' },
    { name: 'API Rate Limiting', status: 'enabled', icon: Shield, description: 'Prevent API abuse and attacks' },
    { name: 'Encryption at Rest', status: 'enabled', icon: Key, description: 'Database encryption enabled' },
    { name: 'SSL/TLS Certificates', status: 'enabled', icon: CheckCircle, description: 'HTTPS encryption active' },
    { name: 'Vulnerability Scanning', status: 'warning', icon: AlertTriangle, description: '2 minor issues found' },
    { name: 'Access Logs', status: 'enabled', icon: Shield, description: 'All access attempts logged' }
  ];

  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Shield size={20} />
          Security Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {securityFeatures.map((feature) => (
            <div key={feature.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 gap-4">
              <div className="flex items-center gap-4">
                <feature.icon size={20} className={
                  feature.status === 'enabled' ? 'text-green-400' : 
                  feature.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                } />
                <div>
                  <h3 className="font-semibold mobile-text">{feature.name}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge variant={
                  feature.status === 'enabled' ? 'default' : 
                  feature.status === 'warning' ? 'secondary' : 'destructive'
                } className="text-xs">
                  {feature.status}
                </Badge>
                <Button size="sm" variant="outline" className="text-xs">
                  Configure
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
