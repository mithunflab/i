
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Globe, DollarSign, Activity } from 'lucide-react';

const Analytics = () => {
  const metrics = [
    { title: 'Total Visits', value: '45,231', change: '+12%', icon: Globe, color: 'text-blue-400' },
    { title: 'Active Users', value: '1,247', change: '+8%', icon: Users, color: 'text-green-400' },
    { title: 'Revenue', value: '$12,450', change: '+25%', icon: DollarSign, color: 'text-yellow-400' },
    { title: 'Conversion Rate', value: '3.2%', change: '+0.4%', icon: TrendingUp, color: 'text-purple-400' },
    { title: 'API Calls', value: '234K', change: '+15%', icon: Activity, color: 'text-red-400' },
    { title: 'Deployments', value: '456', change: '+22%', icon: BarChart3, color: 'text-cyan-400' }
  ];

  return (
    <div className="space-y-6">
      <Card className="bolt-card">
        <CardHeader>
          <CardTitle className="bolt-text-gradient">Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="responsive-grid gap-4">
            {metrics.map((metric) => (
              <Card key={metric.title} className="bolt-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon size={20} className={metric.color} />
                    <span className="text-xs text-green-400">{metric.change}</span>
                  </div>
                  <div>
                    <p className="text-lg sm:text-xl font-bold">{metric.value}</p>
                    <p className="text-xs text-muted-foreground">{metric.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bolt-card">
        <CardHeader>
          <CardTitle>Usage Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 sm:h-48 bg-card/30 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">Chart visualization would go here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
