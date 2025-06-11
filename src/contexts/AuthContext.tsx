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
  loginAsAdmin: (email: string) => Promise<void>;
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

  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('Loading profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        return null;
      }

      if (data) {
        console.log('Profile loaded successfully:', data);
        return data;
      }

      console.log('No profile found');
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
      
      // Load profile with a small delay to ensure database consistency
      const profileData = await loadProfile(session.user.id);
      setProfile(profileData);
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
      setLoading(true);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        setLoading(false);
        throw response.error;
      }

      console.log('Login successful:', response.data.user?.email);
      return response;
    } catch (error) {
      setLoading(false);
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginAsAdmin = async (email: string) => {
    try {
      setLoading(true);
      
      // Create a mock admin session for special credentials
      const mockUser: User = {
        id: 'admin-' + Date.now(),
        email: email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: { full_name: 'Admin User' }
      } as User;

      const mockProfile: Profile = {
        id: mockUser.id,
        email: email,
        full_name: 'Admin User',
        role: 'admin'
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setLoading(false);
      
      console.log('Admin login successful:', email);
    } catch (error) {
      setLoading(false);
      console.error('Admin login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
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
        setLoading(false);
        throw response.error;
      }

      return response;
    } catch (error) {
      setLoading(false);
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    return signup(email, password, fullName);
  };

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        setLoading(false);
        throw error;
      }
    } catch (error) {
      setLoading(false);
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
      
      // Clear local state
      setUser(null);
      setProfile(null);
      setSession(null);
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
    loginAsAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
