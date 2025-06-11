
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, Activity, Zap, Clock, DollarSign, Users } from 'lucide-react';

const ApiUsageAnalytics = () => {
  // Sample data for charts
  const hourlyData = [
    { time: '00:00', calls: 1200, latency: 245, errors: 12 },
    { time: '04:00', calls: 800, latency: 230, errors: 8 },
    { time: '08:00', calls: 3200, latency: 280, errors: 15 },
    { time: '12:00', calls: 4500, latency: 320, errors: 22 },
    { time: '16:00', calls: 3800, latency: 290, errors: 18 },
    { time: '20:00', calls: 2100, latency: 250, errors: 10 }
  ];

  const modelUsageData = [
    { name: 'GPT-4', usage: 35, revenue: 8450, color: '#8b5cf6' },
    { name: 'Claude 3.5', usage: 28, revenue: 6890, color: '#06b6d4' },
    { name: 'Gemini Pro', usage: 22, revenue: 4230, color: '#10b981' },
    { name: 'GPT-3.5', usage: 15, revenue: 2180, color: '#f59e0b' }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 12500, users: 1200 },
    { month: 'Feb', revenue: 14200, users: 1450 },
    { month: 'Mar', revenue: 15800, users: 1680 },
    { month: 'Apr', revenue: 17200, users: 1820 },
    { month: 'May', revenue: 18200, users: 1950 },
    { month: 'Jun', revenue: 19800, users: 2100 }
  ];

  const responseTimeData = [
    { endpoint: '/chat', avgTime: 245, p95: 380, p99: 520 },
    { endpoint: '/completion', avgTime: 180, p95: 290, p99: 420 },
    { endpoint: '/embedding', avgTime: 95, p95: 150, p99: 220 },
    { endpoint: '/moderation', avgTime: 45, p95: 80, p99: 120 }
  ];

  const chartConfig = {
    calls: { label: 'API Calls', color: '#8b5cf6' },
    latency: { label: 'Latency (ms)', color: '#06b6d4' },
    errors: { label: 'Errors', color: '#ef4444' },
    revenue: { label: 'Revenue', color: '#10b981' },
    users: { label: 'Users', color: '#f59e0b' }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* API Calls Timeline */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity size={20} />
            API Usage Timeline (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <AreaChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="calls" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Model Usage Distribution */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap size={20} />
            Model Usage Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <PieChart>
              <Pie
                data={modelUsageData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="usage"
              >
                {modelUsageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue Growth */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign size={20} />
            Revenue & User Growth
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
              <Line 
                type="monotone" 
                dataKey="users" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={{ fill: '#f59e0b' }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Response Time Analysis */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock size={20} />
            Response Time Analysis by Endpoint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <BarChart data={responseTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="endpoint" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="avgTime" fill="#06b6d4" name="Average" />
              <Bar dataKey="p95" fill="#8b5cf6" name="95th Percentile" />
              <Bar dataKey="p99" fill="#ef4444" name="99th Percentile" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Error Rate Trends */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp size={20} />
            Error Rate & Latency Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="latency" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="Latency (ms)"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="errors" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Errors"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiUsageAnalytics;
