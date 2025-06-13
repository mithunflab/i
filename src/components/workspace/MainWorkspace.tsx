
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import SimpleChatInterface from '@/components/workspace/SimpleChatInterface';

const MainWorkspace: React.FC = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">AI Website Builder</h1>
          <p className="text-gray-600">Please sign in to start building</p>
          <Button onClick={() => setShowAuthModal(true)}>
            Sign In
          </Button>
        </div>
        {showAuthModal && (
          <AuthModal onClose={() => setShowAuthModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Chat Interface */}
      <div className="w-1/2 border-r">
        <SimpleChatInterface
          onCodeGenerated={setGeneratedCode}
        />
      </div>
      
      {/* Preview */}
      <div className="w-1/2 p-4">
        <div className="h-full border rounded-lg bg-white">
          {generatedCode ? (
            <iframe
              srcDoc={generatedCode}
              className="w-full h-full rounded-lg"
              title="Generated Website Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Generated website will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainWorkspace;
