
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, checkConnection, retrySupabaseRequest } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ error: any }>;
  loginAsAdmin: (email: string, password: string) => Promise<{ error: any }>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isLoading: true,
  connectionStatus: 'disconnected',
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  logout: async () => {},
  loginWithGoogle: async () => ({ error: null }),
  loginAsAdmin: async () => ({ error: null }),
  refreshAuth: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const mountedRef = useRef(true);
  const authSubscriptionRef = useRef<any>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const profileRequest = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data;
      };

      const data = await retrySupabaseRequest(profileRequest);
      
      if (data && mountedRef.current) {
        setProfile({
          ...data,
          role: data.role as 'admin' | 'user'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (mountedRef.current) {
        setProfile(null);
      }
    }
  };

  const refreshAuth = async () => {
    try {
      setConnectionStatus('reconnecting');
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (currentSession && mountedRef.current) {
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfile(currentSession.user.id);
        setConnectionStatus('connected');
      } else if (mountedRef.current) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
      if (mountedRef.current) {
        setConnectionStatus('disconnected');
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setConnectionStatus('reconnecting');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.session) {
        setConnectionStatus('connected');
      }
      
      return { error };
    } catch (error) {
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setConnectionStatus('reconnecting');
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: fullName ? { full_name: fullName } : undefined
        }
      });
      
      if (!error) {
        setConnectionStatus('connected');
      }
      
      return { error };
    } catch (error) {
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setProfile(null);
        setSession(null);
        setUser(null);
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setConnectionStatus('reconnecting');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      return { error };
    } catch (error) {
      setConnectionStatus('disconnected');
      return { error };
    }
  };

  const loginAsAdmin = async (email: string, password: string) => {
    return login(email, password);
  };

  useEffect(() => {
    mountedRef.current = true;
    let connectionCheckInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        // Check connection health first
        const isConnected = await checkConnection();
        if (!isConnected) {
          setConnectionStatus('disconnected');
          setLoading(false);
          return;
        }

        // Set up auth state listener first
        authSubscriptionRef.current = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log('Auth event:', event, currentSession?.user?.id);
          
          if (mountedRef.current) {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            if (currentSession?.user) {
              setConnectionStatus('connected');
              // Use setTimeout to prevent deadlock
              setTimeout(() => {
                if (mountedRef.current) {
                  fetchProfile(currentSession.user.id);
                }
              }, 0);
            } else {
              setProfile(null);
              setConnectionStatus('disconnected');
            }
          }
        });

        // Then get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mountedRef.current) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            setConnectionStatus('connected');
            await fetchProfile(initialSession.user.id);
          } else {
            setConnectionStatus('disconnected');
          }
          
          setLoading(false);
        }

        // Set up periodic connection health checks
        connectionCheckInterval = setInterval(async () => {
          if (mountedRef.current) {
            const isHealthy = await checkConnection();
            if (!isHealthy && connectionStatus === 'connected') {
              setConnectionStatus('reconnecting');
              setTimeout(refreshAuth, 1000);
            }
          }
        }, 30000); // Check every 30 seconds

      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mountedRef.current) {
          setConnectionStatus('disconnected');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mountedRef.current = false;
      if (authSubscriptionRef.current) {
        authSubscriptionRef.current.subscription?.unsubscribe();
      }
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile,
      session,
      loading, 
      isLoading: loading,
      connectionStatus,
      login,
      signUp,
      logout,
      loginWithGoogle,
      loginAsAdmin,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};
