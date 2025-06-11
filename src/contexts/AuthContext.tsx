
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
  const [initialized, setInitialized] = useState(false);

  // Admin emails that should have admin role
  const ADMIN_EMAILS = ['kirishmithun2006@gmail.com', 'zenmithun@outlook.com'];

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state listener FIRST
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state change:', event, session);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Use setTimeout to defer the profile loading
              setTimeout(() => {
                if (mounted) {
                  loadProfile(session.user.id, session.user.email);
                }
              }, 0);
            } else {
              setProfile(null);
              if (mounted) {
                setLoading(false);
              }
            }
          }
        );

        // THEN get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;
        
        console.log('Initial session:', initialSession);
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        
        if (initialSession?.user) {
          await loadProfile(initialSession.user.id, initialSession.user.email);
        } else {
          setLoading(false);
        }
        
        setInitialized(true);

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const loadProfile = async (userId: string, userEmail?: string) => {
    try {
      console.log('Loading profile for user:', userId, 'email:', userEmail);
      
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
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          const email = userEmail || session?.user?.email;
          if (email) {
            const isAdmin = ADMIN_EMAILS.includes(email);
            await createProfile(userId, email, isAdmin);
          }
        }
      } else if (data) {
        console.log('Profile loaded:', data);
        // Check if this should be an admin but isn't
        const email = userEmail || session?.user?.email;
        if (email && ADMIN_EMAILS.includes(email) && data.role !== 'admin') {
          console.log('Updating profile to admin role for:', email);
          await updateProfileToAdmin(userId, email);
        } else {
          // Ensure role is properly typed
          const typedProfile: Profile = {
            ...data,
            role: (data.role === 'admin' || data.role === 'user') ? data.role : 'user'
          };
          setProfile(typedProfile);
        }
      }
    } catch (err) {
      console.error('Exception loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string, email: string, isAdmin: boolean = false) => {
    try {
      const role = isAdmin ? 'admin' : 'user';
      console.log('Creating profile for:', email, 'with role:', role);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: email.split('@')[0],
          role: role
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
      } else {
        console.log('Profile created:', data);
        const typedProfile: Profile = {
          ...data,
          role: role
        };
        setProfile(typedProfile);
      }
    } catch (err) {
      console.error('Exception creating profile:', err);
    }
  };

  const updateProfileToAdmin = async (userId: string, email: string) => {
    try {
      console.log('Updating profile to admin for:', email);
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile to admin:', error);
      } else {
        console.log('Profile updated to admin:', data);
        const typedProfile: Profile = {
          ...data,
          role: 'admin'
        };
        setProfile(typedProfile);
      }
    } catch (err) {
      console.error('Exception updating profile to admin:', err);
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
    if (!ADMIN_EMAILS.includes(email)) {
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

  // Don't render children until context is initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth called outside of AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
