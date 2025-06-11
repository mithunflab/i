
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
import DeveloperDashboard from "./components/admin/DeveloperDashboard";
import UserDashboard from "./components/user/UserDashboard";
import Workspace from "./components/workspace/Workspace";
import Home from "./pages/Home";
import About from "./pages/About";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const AppContent = () => {
  // Protected Route component moved inside AuthProvider context
  const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
    const { user, profile, isLoading } = useAuth();

    console.log('ProtectedRoute - user:', user?.email, 'profile:', profile?.role, 'requiredRole:', requiredRole, 'loading:', isLoading);

    // Show loading while authentication state is being determined
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

    // If not authenticated, redirect to login
    if (!user) {
      console.log('No user, redirecting to login');
      return <Navigate to="/login" replace />;
    }

    // If user doesn't have profile yet, redirect to home to let Index handle it
    if (!profile) {
      console.log('No profile, redirecting to home');
      return <Navigate to="/" replace />;
    }

    // If specific role is required and user doesn't have it, redirect to appropriate dashboard
    if (requiredRole && profile.role !== requiredRole) {
      console.log('Role mismatch, redirecting based on actual role');
      if (profile.role === 'admin') {
        return <Navigate to="/dashboard" replace />;
      } else {
        return <Navigate to="/user-dashboard" replace />;
      }
    }

    // All checks passed, render the protected content
    return <>{children}</>;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<LoginForm />} />
      
      {/* Root route - handles authentication logic */}
      <Route path="/" element={<Index />} />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute requiredRole="admin">
            <DeveloperDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/user-dashboard" 
        element={
          <ProtectedRoute requiredRole="user">
            <UserDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/workspace" 
        element={
          <ProtectedRoute>
            <Workspace />
          </ProtectedRoute>
        } 
      />
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
