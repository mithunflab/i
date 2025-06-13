
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "./Home";

const Index = () => {
  const { user, profile, isLoading } = useAuth();

  // Add debugging
  console.log('Index component render - user:', user?.email, 'profile:', profile?.role, 'loading:', isLoading);
  console.log('Current timestamp:', new Date().toISOString());

  // Show loading spinner while authentication is being determined
  if (isLoading) {
    console.log('Index: Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and has a profile, redirect to appropriate dashboard
  if (user && profile && profile.role) {
    console.log('Index: Redirecting authenticated user with role:', profile.role);
    
    // Special handling for admin emails - force redirect to admin dashboard
    const adminEmails = ['kirishmithun2006@gmail.com', 'zenmithun@outlook.com'];
    if (user.email && adminEmails.includes(user.email)) {
      console.log('Index: Admin email detected, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
    
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (profile.role === 'user') {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  // If authenticated but no profile yet, wait for profile to load
  if (user && !profile) {
    console.log('Index: User authenticated but profile not loaded yet, waiting...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If no user, show the home page
  console.log('Index: No authenticated user, showing home page');
  console.log('About to render Home component');
  
  try {
    return <Home />;
  } catch (error) {
    console.error('Error rendering Home component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400">Please refresh the page</p>
        </div>
      </div>
    );
  }
};

export default Index;
