
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, retrySupabaseRequest } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { connectionStatus } = useAuth();

  const handleAuth = useCallback(async () => {
    if (!email || !password) return;
    
    setLoading(true);
    
    try {
      const authRequest = async () => {
        if (isSignUp) {
          const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/`
            }
          });
          if (error) throw error;
          return { isSignUp: true };
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          return { isSignUp: false };
        }
      };

      const result = await retrySupabaseRequest(authRequest);
      
      if (result.isSignUp) {
        toast({
          title: "Success!",
          description: "Check your email to confirm your account",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [email, password, isSignUp, toast, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </h2>
        
        <div className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          
          <Button 
            onClick={handleAuth} 
            disabled={loading || !email || !password || connectionStatus === 'disconnected'}
            className="w-full"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>
          
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
          
          {connectionStatus !== 'connected' && (
            <p className="text-xs text-red-500 text-center">
              Connection issue detected - please check your internet connection
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
