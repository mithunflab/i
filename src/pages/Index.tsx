
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Home from "./Home";

const Index = () => {
  const { user, profile, isLoading } = useAuth();

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

  // If no user, show the home page directly instead of redirecting
  if (!user) {
    return <Home />;
  }

  // Redirect authenticated users based on their role
  if (profile?.role === 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/user-dashboard" replace />;
};

export default Index;
