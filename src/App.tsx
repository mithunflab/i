
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import MainWorkspace from '@/components/workspace/MainWorkspace';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <MainWorkspace />
        <Toaster />
      </div>
    </AuthProvider>
  );
}

export default App;
