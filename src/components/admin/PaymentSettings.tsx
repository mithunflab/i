
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CreditCard, DollarSign } from 'lucide-react';

const PaymentSettings = () => {
  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <CreditCard size={20} />
          Payment Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold mobile-text">Stripe Configuration</h3>
            <div>
              <label className="text-sm font-medium">Publishable Key</label>
              <Input placeholder="pk_test_..." className="bolt-input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Secret Key</label>
              <Input type="password" placeholder="sk_test_..." className="bolt-input mt-1" />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="font-semibold mobile-text">PayPal Configuration</h3>
            <div>
              <label className="text-sm font-medium">Client ID</label>
              <Input placeholder="PayPal Client ID" className="bolt-input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Client Secret</label>
              <Input type="password" placeholder="PayPal Client Secret" className="bolt-input mt-1" />
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div>
              <h3 className="font-semibold mobile-text">Test Mode</h3>
              <p className="text-xs text-muted-foreground">Use sandbox environment</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <Button className="bolt-button text-sm">
            Save Payment Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSettings;
