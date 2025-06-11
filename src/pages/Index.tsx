
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "./Home";

const Index = () => {
  const { user, profile, isLoading } = useAuth();

  // Show loading only for a reasonable time
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
    if (profile.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else {
      return <Navigate to="/user-dashboard" replace />;
    }
  }

  // If user is authenticated but no profile (shouldn't happen), redirect to login
  if (user && !profile) {
    return <Navigate to="/login" replace />;
  }

  // If no user, show the home page
  return <Home />;
};

export default Index;
