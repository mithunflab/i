
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Features from '@/pages/Features';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import Workspace from '@/components/workspace/Workspace';
import LoginForm from '@/components/LoginForm';
import UserDashboard from '@/components/user/UserDashboard';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/auth" element={<LoginForm />} />
            <Route path="/user-dashboard" element={<UserDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
