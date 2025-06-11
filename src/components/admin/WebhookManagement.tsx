
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, Trash2 } from 'lucide-react';

const WebhookManagement = () => {
  const webhooks = [
    { id: 1, url: 'https://api.example.com/webhook', event: 'user.created', status: 'active' },
    { id: 2, url: 'https://api.slack.com/webhook', event: 'payment.completed', status: 'active' },
    { id: 3, url: 'https://api.discord.com/webhook', event: 'deployment.failed', status: 'inactive' }
  ];

  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Webhook size={20} />
          Webhook Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold mobile-text">Add New Webhook</h3>
            <div className="responsive-grid gap-4">
              <Input placeholder="Webhook URL" className="bolt-input" />
              <Input placeholder="Event Type" className="bolt-input" />
            </div>
            <Button className="bolt-button text-sm">
              <Plus size={16} />
              Add Webhook
            </Button>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="font-semibold mobile-text">Existing Webhooks</h3>
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30 gap-4">
                <div className="flex-1">
                  <p className="font-medium mobile-text break-all">{webhook.url}</p>
                  <p className="text-xs text-muted-foreground">{webhook.event}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {webhook.status}
                  </Badge>
                  <Button size="sm" variant="outline" className="text-xs">
                    <Trash2 size={14} />
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

export default WebhookManagement;
