
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
}

type LoginResponse = {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
};

type SignUpResponse = {
  data: {
    user: User | null;
    session: Session | null;
  };
  error: AuthError | null;
};

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, fullName: string) => Promise<SignUpResponse>;
  signUp: (email: string, password: string, fullName: string) => Promise<SignUpResponse>;
  loginWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const createDefaultProfile = (user: User): Profile => {
    console.log('Creating default profile for user:', user.email);
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || null,
      role: 'user'
    };
  };

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      if (data) {
        console.log('Profile loaded successfully:', data);
        return data;
      }

      console.log('No profile found, will use default');
      return null;
    } catch (error) {
      console.error('Exception in loadProfile:', error);
      return null;
    }
  };

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('Auth state change:', event, session?.user?.email);
    
    setSession(session);
    
    if (session?.user) {
      setUser(session.user);
      
      // Try to load profile, but don't block on it
      const profileData = await loadProfile(session.user.id);
      
      if (profileData) {
        setProfile(profileData);
      } else {
        // Use default profile if loading fails
        const defaultProfile = createDefaultProfile(session.user);
        setProfile(defaultProfile);
      }
    } else {
      setUser(null);
      setProfile(null);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        if (mounted) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        await handleAuthStateChange(event, session);
      }
    });

    getInitialSession();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/`
        },
      });

      if (response.error) {
        throw response.error;
      }

      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    return signup(email, password, fullName);
  };

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isLoading: loading,
    login,
    logout,
    signup,
    signUp,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
