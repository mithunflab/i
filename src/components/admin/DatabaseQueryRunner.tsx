
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Play, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Zap,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DatabaseQueryRunner = () => {
  const [query, setQuery] = useState('SELECT * FROM profiles LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [queryTime, setQueryTime] = useState(0);
  const [realTimeData, setRealTimeData] = useState<any[]>([]);
  const { toast } = useToast();

  // Load real-time data from profiles table
  useEffect(() => {
    loadRealTimeData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('profiles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('Real-time update:', payload);
        loadRealTimeData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRealTimeData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

      if (error) {
        console.error('Error loading real-time data:', error);
      } else {
        setRealTimeData(data || []);
      }
    } catch (error) {
      console.error('Exception loading real-time data:', error);
    }
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);
    
    const startTime = performance.now();

    try {
      // For security, only allow SELECT queries on specific tables
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for security reasons');
      }

      // Execute the query based on table detection
      let data, error;
      
      if (trimmedQuery.includes('profiles')) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .limit(100);
        data = profileData;
        error = profileError;
      } else if (trimmedQuery.includes('api_keys')) {
        const { data: apiData, error: apiError } = await supabase
          .from('api_keys')
          .select('*')
          .limit(100);
        data = apiData;
        error = apiError;
      } else if (trimmedQuery.includes('projects')) {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .limit(100);
        data = projectData;
        error = projectError;
      } else {
        // Default to profiles if no specific table is detected
        const { data: defaultData, error: defaultError } = await supabase
          .from('profiles')
          .select('*')
          .limit(10);
        data = defaultData;
        error = defaultError;
      }

      const endTime = performance.now();
      setQueryTime(endTime - startTime);

      if (error) {
        setError(error.message);
        toast({
          title: "Query Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setResults(data || []);
        toast({
          title: "Query Executed",
          description: `Retrieved ${data?.length || 0} rows in ${(endTime - startTime).toFixed(2)}ms`
        });
      }
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
      toast({
        title: "Error",
        description: err.message || 'Query execution failed',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      Object.keys(results[0]).join(','),
      ...results.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleQueries = [
    'SELECT * FROM profiles LIMIT 10;',
    'SELECT id, email, role FROM profiles WHERE role = \'admin\';',
    'SELECT * FROM api_keys LIMIT 5;',
    'SELECT * FROM projects ORDER BY created_at DESC LIMIT 10;'
  ];

  return (
    <div className="space-y-6">
      {/* Real-time Data Display */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-green-400" />
            Real-time Database Data
            <Badge variant="outline" className="text-green-400 border-green-400">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {realTimeData.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Latest {realTimeData.length} profiles (updates automatically):</p>
              <div className="bg-gray-800 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-green-400">
                  {JSON.stringify(realTimeData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No real-time data available</p>
          )}
        </CardContent>
      </Card>

      {/* Query Runner */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="h-5 w-5" />
            Database Query Runner
            <Badge variant="secondary" className="ml-auto">
              Real-time Results
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Queries */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Sample Queries:</p>
            <div className="flex flex-wrap gap-2">
              {sampleQueries.map((sample, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuery(sample)}
                  className="text-xs border-gray-600 text-gray-300 hover:bg-white/10"
                >
                  {sample.split(' ').slice(0, 4).join(' ')}...
                </Button>
              ))}
            </div>
          </div>

          {/* Query Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">SQL Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here..."
              className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
              rows={4}
            />
          </div>

          {/* Execute Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={executeQuery}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? 'Executing...' : 'Execute Query'}
            </Button>
            
            {results.length > 0 && (
              <Button
                variant="outline"
                onClick={exportResults}
                className="border-gray-600 text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}

            {queryTime > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                {queryTime.toFixed(2)}ms
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Display */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">
                  Query Results ({results.length} rows)
                </span>
                <Badge variant="outline" className="text-blue-400 border-blue-400">
                  Real-time
                </Badge>
              </div>
              
              <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        {Object.keys(results[0]).map((key) => (
                          <th key={key} className="text-left p-3 text-white border-r border-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-800/50">
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="p-3 text-gray-300 border-r border-gray-700">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Query Stats */}
          {results.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-400 pt-2 border-t border-gray-700">
              <div className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                Rows: {results.length}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Time: {queryTime.toFixed(2)}ms
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-green-400" />
                Real-time Data
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseQueryRunner;
