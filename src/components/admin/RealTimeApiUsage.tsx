
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, DollarSign, Clock, Zap, TrendingUp, AlertCircle } from 'lucide-react';

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
    totalRequests: 15420,
    totalCost: 47.82,
    avgResponseTime: 285,
    errorRate: 0.8,
    requestsToday: 1247,
    costToday: 3.21
  });
  
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([
    { model: 'nousresearch/deephermes-3-mistral-24b-preview:free', requests: 5420, cost: 0, avgResponseTime: 250 },
    { model: 'deepseek/deepseek-r1-0528:free', requests: 3240, cost: 0, avgResponseTime: 320 },
    { model: 'qwen/qwen3-235b-a22b:free', requests: 2180, cost: 0, avgResponseTime: 180 },
    { model: 'claude-3-sonnet:beta', requests: 1520, cost: 28.50, avgResponseTime: 450 },
    { model: 'gpt-4o', requests: 1180, cost: 19.32, avgResponseTime: 380 },
    { model: 'deepseek/deepseek-prover-v2:free', requests: 980, cost: 0, avgResponseTime: 200 },
    { model: 'qwen/qwen3-30b-a3b:free', requests: 620, cost: 0, avgResponseTime: 240 },
    { model: 'deepseek/deepseek-v3-base:free', requests: 280, cost: 0, avgResponseTime: 290 }
  ]);
  
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsage[]>([
    { hour: '0:00', requests: 45, cost: 0.12, errors: 0 },
    { hour: '1:00', requests: 32, cost: 0.08, errors: 1 },
    { hour: '2:00', requests: 28, cost: 0.06, errors: 0 },
    { hour: '3:00', requests: 25, cost: 0.05, errors: 0 },
    { hour: '4:00', requests: 35, cost: 0.09, errors: 1 },
    { hour: '5:00', requests: 52, cost: 0.14, errors: 0 },
    { hour: '6:00', requests: 78, cost: 0.21, errors: 2 },
    { hour: '7:00', requests: 124, cost: 0.34, errors: 1 },
    { hour: '8:00', requests: 156, cost: 0.42, errors: 3 },
    { hour: '9:00', requests: 189, cost: 0.51, errors: 2 },
    { hour: '10:00', requests: 210, cost: 0.58, errors: 4 },
    { hour: '11:00', requests: 195, cost: 0.53, errors: 2 },
    { hour: '12:00', requests: 220, cost: 0.62, errors: 3 },
    { hour: '13:00', requests: 185, cost: 0.48, errors: 1 },
    { hour: '14:00', requests: 167, cost: 0.45, errors: 2 },
    { hour: '15:00', requests: 143, cost: 0.38, errors: 1 },
    { hour: '16:00', requests: 128, cost: 0.35, errors: 2 },
    { hour: '17:00', requests: 112, cost: 0.31, errors: 1 },
    { hour: '18:00', requests: 98, cost: 0.26, errors: 0 },
    { hour: '19:00', requests: 87, cost: 0.23, errors: 1 },
    { hour: '20:00', requests: 76, cost: 0.20, errors: 0 },
    { hour: '21:00', requests: 65, cost: 0.17, errors: 1 },
    { hour: '22:00', requests: 54, cost: 0.14, errors: 0 },
    { hour: '23:00', requests: 48, cost: 0.13, errors: 0 }
  ]);
  
  const [loading, setLoading] = useState(false);

  // Real-time data simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
        requestsToday: prev.requestsToday + Math.floor(Math.random() * 5),
        totalCost: prev.totalCost + Math.random() * 0.1,
        costToday: prev.costToday + Math.random() * 0.05,
        avgResponseTime: 200 + Math.floor(Math.random() * 200),
        errorRate: 0.2 + Math.random() * 1.5
      }));

      // Update hourly usage for current hour
      setHourlyUsage(prev => {
        const newData = [...prev];
        const currentHour = new Date().getHours();
        const currentHourData = newData.find(h => h.hour === `${currentHour}:00`);
        if (currentHourData) {
          currentHourData.requests += Math.floor(Math.random() * 5);
          currentHourData.cost += Math.random() * 0.02;
          if (Math.random() < 0.1) {
            currentHourData.errors += 1;
          }
        }
        return newData;
      });

      // Update model usage
      setModelUsage(prev => {
        const newData = [...prev];
        const randomModel = newData[Math.floor(Math.random() * newData.length)];
        randomModel.requests += Math.floor(Math.random() * 3);
        if (randomModel.model.includes(':free')) {
          randomModel.cost = 0;
        } else {
          randomModel.cost += Math.random() * 0.05;
        }
        return newData;
      });
    }, 10000); // Update every 10 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <Badge variant="outline" className="text-xs text-purple-300 border-purple-500/30">Total</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stats.totalRequests.toLocaleString()}</p>
              <p className="text-xs text-gray-400">API Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <Badge variant="outline" className="text-xs text-green-300 border-green-500/30">Total</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">${stats.totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Total Cost</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-400" />
              <Badge variant="outline" className="text-xs text-blue-300 border-blue-500/30">Avg</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stats.avgResponseTime}ms</p>
              <p className="text-xs text-gray-400">Response Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <Badge variant="outline" className="text-xs text-red-300 border-red-500/30">Rate</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stats.errorRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400">Error Rate</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-cyan-400" />
              <Badge variant="outline" className="text-xs text-cyan-300 border-cyan-500/30">Today</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stats.requestsToday.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Requests Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <Badge variant="outline" className="text-xs text-emerald-300 border-emerald-500/30">Today</Badge>
            </div>
            <div>
              <p className="text-lg font-bold text-white">${stats.costToday.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Cost Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Usage Chart */}
        <Card className="bg-white/5 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">24-Hour API Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="hour" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line type="monotone" dataKey="requests" stroke="#8b5cf6" strokeWidth={2} name="Requests" />
                  <Line type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2} name="Errors" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Model Usage Chart */}
        <Card className="bg-white/5 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Model Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelUsage.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ model, requests }) => {
                      const shortName = model.includes('/') ? model.split('/')[1].split(':')[0] : model;
                      return `${shortName}: ${requests}`;
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="requests"
                    fontSize={10}
                  >
                    {modelUsage.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Usage Table */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Top Models by Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 text-gray-300">Model</th>
                  <th className="text-left p-2 text-gray-300">Requests</th>
                  <th className="text-left p-2 text-gray-300">Cost</th>
                  <th className="text-left p-2 text-gray-300">Avg Response Time</th>
                </tr>
              </thead>
              <tbody>
                {modelUsage.slice(0, 10).map((model, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-white/5">
                    <td className="p-2 text-sm text-white">
                      <div className="truncate max-w-xs" title={model.model}>
                        {model.model}
                      </div>
                    </td>
                    <td className="p-2 text-sm text-gray-300">{model.requests.toLocaleString()}</td>
                    <td className="p-2 text-sm text-gray-300">
                      {model.cost > 0 ? `$${model.cost.toFixed(2)}` : 'Free'}
                    </td>
                    <td className="p-2 text-sm text-gray-300">{model.avgResponseTime}ms</td>
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
