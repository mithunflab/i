
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
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
  if (user && profile && profile.role) {
    console.log('Redirecting authenticated user with role:', profile.role);
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (profile.role === 'user') {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  // If no user or no profile, show the home page
  console.log('No authenticated user with profile, showing home page');
  return <Home />;
};

export default Index;
