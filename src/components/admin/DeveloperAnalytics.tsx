
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { BarChart3, TrendingUp, Users, Globe, DollarSign, Activity, Zap, Clock, Shield, Database } from 'lucide-react';

const DeveloperAnalytics = () => {
  const metrics = [
    { title: 'Total API Requests', value: '2.4M', change: '+18%', icon: Zap, color: 'text-purple-400' },
    { title: 'Active Developers', value: '3,247', change: '+12%', icon: Users, color: 'text-blue-400' },
    { title: 'Monthly Revenue', value: '$24,890', change: '+28%', icon: DollarSign, color: 'text-green-400' },
    { title: 'Avg Response Time', value: '234ms', change: '-8%', icon: Clock, color: 'text-cyan-400' },
    { title: 'Success Rate', value: '99.4%', change: '+0.2%', icon: Activity, color: 'text-emerald-400' },
    { title: 'Data Processed', value: '1.2TB', change: '+15%', icon: Database, color: 'text-yellow-400' }
  ];

  const usageByRegion = [
    { region: 'North America', usage: 45, revenue: 12500, color: '#8b5cf6' },
    { region: 'Europe', usage: 30, revenue: 8900, color: '#06b6d4' },
    { region: 'Asia Pacific', usage: 20, revenue: 5600, color: '#10b981' },
    { region: 'Others', usage: 5, revenue: 1200, color: '#f59e0b' }
  ];

  const weeklyMetrics = [
    { day: 'Mon', requests: 45000, revenue: 1200, users: 890 },
    { day: 'Tue', requests: 52000, revenue: 1450, users: 920 },
    { day: 'Wed', requests: 48000, revenue: 1350, users: 880 },
    { day: 'Thu', requests: 61000, revenue: 1680, users: 950 },
    { day: 'Fri', requests: 55000, revenue: 1520, users: 910 },
    { day: 'Sat', requests: 38000, revenue: 980, users: 760 },
    { day: 'Sun', requests: 42000, revenue: 1100, users: 820 }
  ];

  const endpointStats = [
    { endpoint: '/v1/chat/completions', calls: 890000, latency: 245 },
    { endpoint: '/v1/completions', calls: 650000, latency: 180 },
    { endpoint: '/v1/embeddings', calls: 420000, latency: 95 },
    { endpoint: '/v1/images/generations', calls: 280000, latency: 1200 },
    { endpoint: '/v1/audio/transcriptions', calls: 150000, latency: 800 },
    { endpoint: '/v1/moderations', calls: 95000, latency: 45 }
  ];

  const chartConfig = {
    requests: { label: 'Requests', color: '#8b5cf6' },
    revenue: { label: 'Revenue', color: '#10b981' },
    users: { label: 'Users', color: '#06b6d4' },
    latency: { label: 'Latency', color: '#f59e0b' }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="bg-white/5 border-gray-800 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <metric.icon size={20} className={metric.color} />
                <span className={`text-xs ${metric.change.startsWith('+') ? 'text-green-400' : metric.change.startsWith('-') ? 'text-red-400' : 'text-gray-400'}`}>
                  {metric.change}
                </span>
              </div>
              <div>
                <p className="text-lg font-bold text-white">{metric.value}</p>
                <p className="text-xs text-gray-400">{metric.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Overview */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 size={20} />
            Weekly Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <AreaChart data={weeklyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area 
                type="monotone" 
                dataKey="requests" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.3}
                name="API Requests"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by Region */}
        <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe size={20} />
              Usage by Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <PieChart>
                <Pie
                  data={usageByRegion}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="usage"
                >
                  {usageByRegion.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp size={20} />
              Revenue & User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64">
              <LineChart data={weeklyMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                  name="Revenue ($)"
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#06b6d4" 
                  strokeWidth={2}
                  dot={{ fill: '#06b6d4' }}
                  name="Active Users"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Endpoint Performance */}
      <Card className="bg-white/5 border-gray-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity size={20} />
            API Endpoint Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-80">
            <BarChart data={endpointStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="endpoint" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                yAxisId="left"
                dataKey="calls" 
                fill="#8b5cf6" 
                name="API Calls"
              />
              <Bar 
                yAxisId="right"
                dataKey="latency" 
                fill="#f59e0b" 
                name="Latency (ms)"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeveloperAnalytics;
