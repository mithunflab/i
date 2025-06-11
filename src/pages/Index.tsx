
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import Home from "./Home";

const Index = () => {
  const { user, profile, isLoading } = useAuth();

  console.log('Index component - user:', user?.email, 'profile:', profile?.role, 'loading:', isLoading);

  // Show loading spinner while authentication is being determined
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

  // If user is authenticated and has a profile, redirect to appropriate dashboard
  if (user && profile) {
    console.log('Redirecting authenticated user with role:', profile.role);
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  // If user is authenticated but profile is still loading or failed to load, 
  // give it a moment then redirect to user dashboard as default
  if (user && !profile) {
    console.log('User authenticated, profile not loaded yet, redirecting to user dashboard');
    // Use a small delay to allow profile loading to complete
    setTimeout(() => {
      window.location.href = '/user-dashboard';
    }, 1000);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If no user, show the home page
  console.log('No user, showing home page');
  return <Home />;
};

export default Index;
