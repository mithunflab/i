
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

const queryClient = new QueryClient();

const AppContent = () => {
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

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<LoginForm />} />
      
      {/* Root route logic */}
      <Route 
        path="/" 
        element={
          !user ? (
            <Home />
          ) : profile?.role === 'admin' ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/user-dashboard" replace />
          )
        } 
      />
      
      {/* Protected routes */}
      <Route 
        path="/dashboard" 
        element={
          user && profile?.role === 'admin' ? (
            <DeveloperDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/user-dashboard" 
        element={
          user && profile?.role === 'user' ? (
            <UserDashboard />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/workspace" 
        element={
          user ? (
            <Workspace />
          ) : (
            <Navigate to="/login" replace />
          )
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
