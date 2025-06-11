
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  loginWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Special admin credentials
const ADMIN_CREDENTIALS = [
  'kirishmithun2006@gmail.com',
  'zenmithun@outlook.com'
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createOrUpdateProfile = async (user: User) => {
    try {
      // Check if user is admin based on email
      const isAdmin = ADMIN_CREDENTIALS.includes(user.email || '');
      
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: isAdmin ? 'admin' as const : 'user' as const,
        updated_at: new Date().toISOString()
      };

      // First try to get existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select()
          .single();

        if (!error && data) {
          setProfile(data as Profile);
        } else {
          // Fallback to local profile if update fails
          setProfile({
            ...profileData,
            created_at: existingProfile.created_at || new Date().toISOString()
          });
        }
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (!error && data) {
          setProfile(data as Profile);
        } else {
          // Fallback to local profile if insert fails
          setProfile({
            ...profileData,
            created_at: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      // Create a minimal profile if database operations fail
      const isAdmin = ADMIN_CREDENTIALS.includes(user.email || '');
      setProfile({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: isAdmin ? 'admin' : 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await createOrUpdateProfile(session.user);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        createOrUpdateProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        }
      }
    });
    
    return { error };
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const loginWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      session, 
      login, 
      signUp, 
      loginWithGoogle, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
