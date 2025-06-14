
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Database, Play, Wifi, History, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface QueryResult {
  id: string;
  query: string;
  result: any[];
  error: string | null;
  execution_time: number;
  timestamp: Date;
}

const RealTimeQueryRunner = () => {
  const [query, setQuery] = useState('SELECT * FROM profiles LIMIT 10;');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (user) {
      setupRealTimeUpdates();
      loadQueryHistory();
    }

    return () => {
      cleanupRealTimeUpdates();
    };
  }, [user?.id]);

  const cleanupRealTimeUpdates = () => {
    if (channelRef.current) {
      console.log('Cleaning up query runner real-time subscription');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const setupRealTimeUpdates = () => {
    cleanupRealTimeUpdates();
    
    console.log('Setting up real-time updates for query runner');
    
    const channelName = `query-runner-updates-${Date.now()}`;
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: '*'
        },
        (payload) => {
          console.log('Real-time database change detected:', payload);
          toast({
            title: "Database Change Detected",
            description: `Table: ${payload.table}, Event: ${payload.eventType}`,
            variant: "default"
          });
          setIsConnected(true);
        }
      )
      .subscribe((status) => {
        console.log('Query runner real-time subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
  };

  const loadQueryHistory = () => {
    const savedHistory = localStorage.getItem('query_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setResults(history.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Error loading query history:', error);
      }
    }
  };

  const saveQueryHistory = (newResults: QueryResult[]) => {
    try {
      localStorage.setItem('query_history', JSON.stringify(newResults));
    } catch (error) {
      console.error('Error saving query history:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SQL query",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      console.log('Executing query:', query);
      
      const trimmedQuery = query.trim().toLowerCase();
      let result;
      let error = null;

      if (trimmedQuery.startsWith('select')) {
        if (trimmedQuery.includes('profiles')) {
          const { data, error: queryError } = await supabase
            .from('profiles')
            .select('*')
            .limit(10);
          
          if (queryError) {
            error = queryError.message;
            result = [];
          } else {
            result = data || [];
          }
        } else if (trimmedQuery.includes('api_keys')) {
          const { data, error: queryError } = await supabase
            .from('api_keys')
            .select('*')
            .limit(10);
          
          if (queryError) {
            error = queryError.message;
            result = [];
          } else {
            result = data || [];
          }
        } else if (trimmedQuery.includes('deployment_tokens')) {
          const { data, error: queryError } = await supabase
            .from('deployment_tokens')
            .select('*')
            .limit(10);
          
          if (queryError) {
            error = queryError.message;
            result = [];
          } else {
            result = data || [];
          }
        } else if (trimmedQuery.includes('storage_usage_tracking')) {
          const { data, error: queryError } = await supabase
            .from('storage_usage_tracking')
            .select('*')
            .limit(10);
          
          if (queryError) {
            error = queryError.message;
            result = [];
          } else {
            result = data || [];
          }
        } else {
          error = 'This query pattern is not supported in the demo interface. Please use the suggested sample queries.';
          result = [];
        }
      } else {
        error = 'Only SELECT queries are supported in the web interface for security reasons';
        result = [];
      }

      const executionTime = Date.now() - startTime;
      const queryResult: QueryResult = {
        id: `query_${Date.now()}`,
        query,
        result,
        error,
        execution_time: executionTime,
        timestamp: new Date()
      };

      const newResults = [queryResult, ...results.slice(0, 9)];
      setResults(newResults);
      saveQueryHistory(newResults);

      if (error) {
        toast({
          title: "Query Error",
          description: error,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Query Executed",
          description: `Returned ${result.length} rows in ${executionTime}ms`
        });
      }

    } catch (err) {
      console.error('Error executing query:', err);
      const executionTime = Date.now() - startTime;
      const queryResult: QueryResult = {
        id: `query_${Date.now()}`,
        query,
        result: [],
        error: err instanceof Error ? err.message : 'Unknown error occurred',
        execution_time: executionTime,
        timestamp: new Date()
      };

      const newResults = [queryResult, ...results.slice(0, 9)];
      setResults(newResults);
      saveQueryHistory(newResults);

      toast({
        title: "Execution Error",
        description: "Failed to execute query",
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const exportResults = (result: QueryResult) => {
    if (result.result.length === 0) return;
    
    const csv = [
      Object.keys(result.result[0]).join(','),
      ...result.result.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${result.timestamp.getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleQueries = [
    'SELECT * FROM profiles LIMIT 10;',
    'SELECT COUNT(*) as total_users FROM profiles;',
    'SELECT * FROM api_keys WHERE provider = \'YouTube\';',
    'SELECT * FROM deployment_tokens;',
    'SELECT * FROM storage_usage_tracking;'
  ];

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database size={20} />
          Real-Time Database Query Runner
          <div className="ml-auto flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
            <Badge variant="outline" className="text-xs">
              {isConnected ? 'Real-time Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Query Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">SQL Query</label>
            <Badge variant="secondary" className="text-xs">
              SELECT queries only
            </Badge>
          </div>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your SQL query here..."
            className="bg-gray-800 border-gray-600 text-white font-mono text-sm min-h-[100px]"
          />
          
          <div className="flex flex-wrap gap-2">
            {sampleQueries.map((sampleQuery, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setQuery(sampleQuery)}
              >
                {sampleQuery.split(' ').slice(0, 3).join(' ')}...
              </Button>
            ))}
          </div>
        </div>

        <Button 
          onClick={executeQuery}
          disabled={isExecuting}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          <Play className="mr-2 h-4 w-4" />
          {isExecuting ? 'Executing...' : 'Execute Query'}
        </Button>

        {/* Query Results History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={16} className="text-gray-400" />
            <h3 className="text-lg font-semibold text-white">Query History</h3>
            <Badge variant="secondary" className="ml-auto">
              {results.length} queries
            </Badge>
          </div>

          {results.map((result) => (
            <Card key={result.id} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.error ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                    <span className="text-xs text-gray-400">
                      {result.timestamp.toLocaleString()}
                    </span>
                    <Badge variant={result.error ? "destructive" : "default"} className="text-xs">
                      {result.execution_time}ms
                    </Badge>
                  </div>
                  {!result.error && result.result.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-gray-600"
                      onClick={() => exportResults(result)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export
                    </Button>
                  )}
                </div>
                
                <div className="bg-gray-900 rounded p-2 mb-2">
                  <code className="text-sm text-gray-300">{result.query}</code>
                </div>

                {result.error ? (
                  <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                    <p className="text-red-400 text-sm">{result.error}</p>
                  </div>
                ) : (
                  <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                    <p className="text-green-400 text-sm mb-2">
                      {result.result.length} rows returned
                    </p>
                    {result.result.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-600">
                              {Object.keys(result.result[0]).map((key) => (
                                <th key={key} className="text-left p-1 text-gray-300">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.result.slice(0, 5).map((row, index) => (
                              <tr key={index} className="border-b border-gray-700">
                                {Object.values(row).map((value, cellIndex) => (
                                  <td key={cellIndex} className="p-1 text-gray-400">
                                    {String(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.result.length > 5 && (
                          <p className="text-xs text-gray-500 mt-2">
                            ... and {result.result.length - 5} more rows
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {results.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No queries executed yet</p>
              <p className="text-sm mt-2">Execute a SQL query to see results here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeQueryRunner;
