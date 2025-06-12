
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ApiUsage {
  id: string;
  provider: string;
  model: string;
  status: string;
  response_time_ms: number;
  tokens_used: number;
  cost_usd: number;
  created_at: string;
  user_id?: string;
}

const RealTimeApiAnalytics = () => {
  const [realtimeUsage, setRealtimeUsage] = useState<ApiUsage[]>([]);
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeProviders: 0
  });

  useEffect(() => {
    // Load initial data
    loadRealtimeUsage();

    // Set up real-time subscription using existing api_usage_logs table
    const channel = supabase
      .channel('api-usage-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_usage_logs'
        },
        (payload) => {
          console.log('New API usage:', payload);
          const newUsage = payload.new as ApiUsage;
          setRealtimeUsage(prev => [newUsage, ...prev.slice(0, 49)]);
          updateStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRealtimeUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading real-time API usage:', error);
        return;
      }

      const usage = (data || []) as ApiUsage[];
      setRealtimeUsage(usage);
      updateStats();
    } catch (error) {
      console.error('Exception loading real-time API usage:', error);
    }
  };

  const updateStats = async () => {
    try {
      // Get stats for last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('*')
        .gte('created_at', yesterday.toISOString());

      if (error) {
        console.error('Error loading stats:', error);
        return;
      }

      const usage = (data || []) as ApiUsage[];
      const totalRequests = usage.length;
      const successfulRequests = usage.filter(item => item.status === 'success').length;
      const totalTime = usage.reduce((sum, item) => sum + (item.response_time_ms || 0), 0);
      const avgResponseTime = usage.length > 0 ? totalTime / usage.length : 0;
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const activeProviders = new Set(usage.map(item => item.provider)).size;

      setStats({
        totalRequests,
        successRate,
        avgResponseTime,
        activeProviders
      });
    } catch (error) {
      console.error('Exception updating stats:', error);
    }
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      youtube: 'bg-red-500',
      openrouter: 'bg-blue-500',
      github: 'bg-gray-800',
      netlify: 'bg-teal-500'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-400" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-400" />;
    return <Clock className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Requests (24h)</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-green-400">{stats.successRate.toFixed(1)}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Response</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.avgResponseTime.toFixed(0)}ms</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Providers</p>
                <p className="text-2xl font-bold text-purple-400">{stats.activeProviders}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity size={20} />
            Live API Activity
            <Badge variant="outline" className="text-green-400 border-green-400">
              Real-time
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {realtimeUsage.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No API activity yet</p>
            ) : (
              realtimeUsage.map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getProviderColor(usage.provider)}`}></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium capitalize">{usage.provider}</span>
                        <Badge variant="outline" className="text-xs">
                          {usage.model}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(usage.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm text-white">
                        {usage.tokens_used} tokens
                      </p>
                      <p className="text-xs text-gray-400">
                        {usage.response_time_ms}ms
                      </p>
                    </div>
                    {getStatusIcon(usage.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeApiAnalytics;
