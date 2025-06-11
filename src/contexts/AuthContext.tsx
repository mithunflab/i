
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  loginAsAdmin: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer the profile loading
          setTimeout(() => {
            loadProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      console.log('Loading profile for user:', userId);
      
      // Validate that userId is a proper UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('Invalid UUID format:', userId);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        // If profile doesn't exist, create one for admin emails
        if (error.code === 'PGRST116') {
          const userEmail = session?.user?.email;
          if (userEmail && (userEmail === 'kirishmithun2006@gmail.com' || userEmail === 'zenmithun@outlook.com')) {
            await createAdminProfile(userId, userEmail);
          } else {
            // Create regular user profile
            await createUserProfile(userId, userEmail || '');
          }
        }
      } else if (data) {
        console.log('Profile loaded:', data);
        // Ensure role is properly typed
        const typedProfile: Profile = {
          ...data,
          role: (data.role === 'admin' || data.role === 'user') ? data.role : 'user'
        };
        setProfile(typedProfile);
      }
    } catch (err) {
      console.error('Exception loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAdminProfile = async (userId: string, email: string) => {
    try {
      console.log('Creating admin profile for:', email);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          role: 'admin'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating admin profile:', error);
      } else {
        console.log('Admin profile created:', data);
        const typedProfile: Profile = {
          ...data,
          role: 'admin'
        };
        setProfile(typedProfile);
      }
    } catch (err) {
      console.error('Exception creating admin profile:', err);
    }
  };

  const createUserProfile = async (userId: string, email: string) => {
    try {
      console.log('Creating user profile for:', email);
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          role: 'user'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
      } else {
        console.log('User profile created:', data);
        const typedProfile: Profile = {
          ...data,
          role: 'user'
        };
        setProfile(typedProfile);
      }
    } catch (err) {
      console.error('Exception creating user profile:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    console.log('Sign in successful:', data.user?.email);
    return data;
  };

  // Add login as alias for signIn
  const login = signIn;

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('Attempting to sign up:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      throw error;
    }

    console.log('Sign up successful:', data.user?.email);
    return data;
  };

  const loginWithGoogle = async () => {
    console.log('Attempting Google login...');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      console.error('Google login error:', error);
      throw error;
    }

    console.log('Google login initiated');
    return data;
  };

  const loginAsAdmin = async (email: string, password: string) => {
    console.log('Admin login attempt for:', email);
    
    // Validate admin credentials first
    if (email !== 'kirishmithun2006@gmail.com' && email !== 'zenmithun@outlook.com') {
      throw new Error('Unauthorized: Admin access only');
    }
    
    // Use regular Supabase authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Admin login error:', error);
      throw error;
    }

    console.log('Admin login successful:', data.user?.email);
    return data;
  };

  const signOut = async () => {
    console.log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Add logout as alias for signOut
  const logout = signOut;

  const value = {
    user,
    profile,
    session,
    loading,
    isLoading: loading,
    signIn,
    login,
    signUp,
    loginWithGoogle,
    loginAsAdmin,
    signOut,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
