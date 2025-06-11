
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, DollarSign, Clock, Zap, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApiUsageStats {
  totalRequests: number;
  totalCost: number;
  avgResponseTime: number;
  errorRate: number;
  requestsToday: number;
  costToday: number;
}

interface ModelUsage {
  model: string;
  requests: number;
  cost: number;
  avgResponseTime: number;
}

interface HourlyUsage {
  hour: string;
  requests: number;
  cost: number;
  errors: number;
}

const RealTimeApiUsage = () => {
  const [stats, setStats] = useState<ApiUsageStats>({
    totalRequests: 0,
    totalCost: 0,
    avgResponseTime: 0,
    errorRate: 0,
    requestsToday: 0,
    costToday: 0
  });
  
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApiUsageStats = async () => {
    try {
      // Get total stats
      const { data: totalData, error: totalError } = await supabase
        .from('api_usage_logs')
        .select('tokens_used, cost_usd, response_time_ms, status');

      if (totalError) {
        console.error('Error fetching total stats:', totalError);
        return;
      }

      // Get today's stats
      const today = new Date().toISOString().split('T')[0];
      const { data: todayData, error: todayError } = await supabase
        .from('api_usage_logs')
        .select('tokens_used, cost_usd, response_time_ms, status')
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      if (todayError) {
        console.error('Error fetching today stats:', todayError);
        return;
      }

      // Calculate stats
      const totalRequests = totalData?.length || 0;
      const totalCost = totalData?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0;
      const avgResponseTime = totalData?.length 
        ? totalData.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalData.length 
        : 0;
      const errorCount = totalData?.filter(log => log.status === 'error').length || 0;
      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      const requestsToday = todayData?.length || 0;
      const costToday = todayData?.reduce((sum, log) => sum + (log.cost_usd || 0), 0) || 0;

      setStats({
        totalRequests,
        totalCost,
        avgResponseTime,
        errorRate,
        requestsToday,
        costToday
      });

    } catch (error) {
      console.error('Error in fetchApiUsageStats:', error);
    }
  };

  const fetchModelUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('model, tokens_used, cost_usd, response_time_ms, status');

      if (error) {
        console.error('Error fetching model usage:', error);
        return;
      }

      // Group by model
      const modelStats = data?.reduce((acc, log) => {
        const model = log.model;
        if (!acc[model]) {
          acc[model] = {
            model,
            requests: 0,
            cost: 0,
            totalResponseTime: 0,
            avgResponseTime: 0
          };
        }
        
        acc[model].requests += 1;
        acc[model].cost += log.cost_usd || 0;
        acc[model].totalResponseTime += log.response_time_ms || 0;
        
        return acc;
      }, {} as Record<string, any>) || {};

      // Calculate averages and convert to array
      const modelUsageArray = Object.values(modelStats).map((model: any) => ({
        ...model,
        avgResponseTime: model.requests > 0 ? model.totalResponseTime / model.requests : 0
      }));

      setModelUsage(modelUsageArray.slice(0, 10)); // Top 10 models
    } catch (error) {
      console.error('Error in fetchModelUsage:', error);
    }
  };

  const fetchHourlyUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('created_at, cost_usd, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching hourly usage:', error);
        return;
      }

      // Group by hour
      const hourlyStats = data?.reduce((acc, log) => {
        const hour = new Date(log.created_at).getHours();
        const hourKey = `${hour}:00`;
        
        if (!acc[hourKey]) {
          acc[hourKey] = {
            hour: hourKey,
            requests: 0,
            cost: 0,
            errors: 0
          };
        }
        
        acc[hourKey].requests += 1;
        acc[hourKey].cost += log.cost_usd || 0;
        if (log.status === 'error') {
          acc[hourKey].errors += 1;
        }
        
        return acc;
      }, {} as Record<string, any>) || {};

      setHourlyUsage(Object.values(hourlyStats));
    } catch (error) {
      console.error('Error in fetchHourlyUsage:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchApiUsageStats(),
        fetchModelUsage(),
        fetchHourlyUsage()
      ]);
      setLoading(false);
    };

    fetchData();

    // Set up real-time updates
    const interval = setInterval(fetchData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="bolt-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Loading API usage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <Badge variant="outline" className="text-xs">Total</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">API Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <Badge variant="outline" className="text-xs">Total</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">${stats.totalCost.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">Total Cost</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <Badge variant="outline" className="text-xs">Avg</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.avgResponseTime.toFixed(0)}ms</p>
              <p className="text-xs text-muted-foreground">Response Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <Badge variant="outline" className="text-xs">Rate</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.errorRate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <Badge variant="outline" className="text-xs">Today</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">{stats.requestsToday.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Requests Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bolt-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <Badge variant="outline" className="text-xs">Today</Badge>
            </div>
            <div>
              <p className="text-lg font-bold">${stats.costToday.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">Cost Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Usage Chart */}
        <Card className="bolt-card">
          <CardHeader>
            <CardTitle className="bolt-text-gradient">24-Hour API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage Chart */}
        <Card className="bolt-card">
          <CardHeader>
            <CardTitle className="bolt-text-gradient">Model Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ model, requests }) => `${model.split('/')[1] || model}: ${requests}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="requests"
                  >
                    {modelUsage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Table */}
      <Card className="bolt-card">
        <CardHeader>
          <CardTitle className="bolt-text-gradient">Top Models by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-2">Model</th>
                  <th className="text-left p-2">Requests</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Avg Response Time</th>
                </tr>
              </thead>
              <tbody>
                {modelUsage.slice(0, 10).map((model, index) => (
                  <tr key={index} className="border-b border-border/10">
                    <td className="p-2 text-sm">{model.model}</td>
                    <td className="p-2 text-sm">{model.requests.toLocaleString()}</td>
                    <td className="p-2 text-sm">${model.cost.toFixed(4)}</td>
                    <td className="p-2 text-sm">{model.avgResponseTime.toFixed(0)}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeApiUsage;

