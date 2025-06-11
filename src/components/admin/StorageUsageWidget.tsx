
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Database, FileText, Image, Video, Music, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StorageUsage {
  bucket_name: string;
  file_count: number;
  total_size_bytes: number;
  last_updated: string;
}

const StorageUsageWidget = () => {
  const [storageData, setStorageData] = useState<StorageUsage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('storage_usage_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'storage_usage_tracking' 
      }, () => {
        loadStorageData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadStorageData = async () => {
    try {
      const { data, error } = await supabase
        .from('storage_usage_tracking')
        .select('*')
        .order('total_size_bytes', { ascending: false });

      if (error) {
        console.error('Error loading storage data:', error);
        return;
      }

      setStorageData(data || []);
    } catch (error) {
      console.error('Error in loadStorageData:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getBucketIcon = (bucketName: string) => {
    if (bucketName.includes('image') || bucketName.includes('photo')) return Image;
    if (bucketName.includes('video')) return Video;
    if (bucketName.includes('audio') || bucketName.includes('music')) return Music;
    if (bucketName.includes('archive') || bucketName.includes('backup')) return Archive;
    if (bucketName.includes('document') || bucketName.includes('file')) return FileText;
    return Database;
  };

  const totalStorage = storageData.reduce((acc, item) => acc + item.total_size_bytes, 0);
  const totalFiles = storageData.reduce((acc, item) => acc + item.file_count, 0);

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading storage data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Storage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Total Storage</p>
                <p className="text-lg font-bold text-white">{formatBytes(totalStorage)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Total Files</p>
                <p className="text-lg font-bold text-white">{totalFiles.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Active Buckets</p>
                <p className="text-lg font-bold text-white">{storageData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bucket Details */}
      <Card className="bg-white/5 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database size={20} />
            Storage Buckets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {storageData.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No storage buckets found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {storageData.map((bucket, index) => {
                const IconComponent = getBucketIcon(bucket.bucket_name);
                const percentage = totalStorage > 0 ? (bucket.total_size_bytes / totalStorage) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800/30">
                    <div className="flex items-center gap-3 flex-1">
                      <IconComponent className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white">{bucket.bucket_name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {bucket.file_count} files
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-400">{formatBytes(bucket.total_size_bytes)}</span>
                          <span className="text-xs text-gray-500">
                            {percentage.toFixed(1)}% of total
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(2, percentage)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(bucket.last_updated).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageUsageWidget;
