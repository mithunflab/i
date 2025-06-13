
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Home from './Home';

const Index = () => {
  const { user, profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return;

    // If user is authenticated, redirect to appropriate dashboard
    if (user && profile) {
      if (profile.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    }
    // If not authenticated, stay on home page (no redirect needed)
  }, [user, profile, isLoading, navigate]);

  // Show loading while determining auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show home page for non-authenticated users
  return <Home />;
};

export default Index;
