
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, ExternalLink } from 'lucide-react';

const DomainManagement = () => {
  const domains = [
    { id: 1, domain: 'example.com', status: 'active', ssl: true },
    { id: 2, domain: 'api.example.com', status: 'pending', ssl: false },
    { id: 3, domain: 'staging.example.com', status: 'active', ssl: true }
  ];

  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Globe size={20} />
          Domain Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold mobile-text">Add Custom Domain</h3>
            <div className="flex gap-2">
              <Input placeholder="yourdomain.com" className="bolt-input flex-1" />
              <Button className="bolt-button text-sm">
                <Plus size={16} />
                Add Domain
              </Button>
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="font-semibold mobile-text">Connected Domains</h3>
            {domains.map((domain) => (
              <div key={domain.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 gap-4">
                <div className="flex items-center gap-3">
                  <Globe size={16} className="text-primary" />
                  <div>
                    <p className="font-medium mobile-text">{domain.domain}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={domain.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {domain.status}
                      </Badge>
                      <Badge variant={domain.ssl ? 'default' : 'destructive'} className="text-xs">
                        {domain.ssl ? 'SSL Active' : 'No SSL'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <ExternalLink size={14} />
                    Visit
                  </Button>
                  <Button size="sm" variant="outline" className="text-xs">
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DomainManagement;
