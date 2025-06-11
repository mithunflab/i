
"use client";

import { useState } from "react";
import { ArrowRight, Menu, X, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Hero2 = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const handleWatchDemo = () => {
    navigate('/features');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Gradient background with grain effect */}
      <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-red-600 to-pink-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-red-900 to-orange-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-orange-600 to-red-500"></div>
      </div>
      <div className="absolute inset-0 z-0 bg-noise opacity-30"></div>

      {/* Content container */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="container mx-auto flex items-center justify-between px-4 py-4 mt-6">
          <div className="flex items-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
              <Youtube className="w-5 h-5" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">YouTube Website Builder</span>
          </div>

          {/* Only show login button if user not authenticated */}
          {!user && (
            <div className="hidden md:flex items-center space-x-3">
              <button 
                onClick={handleLogin}
                className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 transition-colors"
              >
                Login
              </button>
            </div>
          )}

          {/* Mobile menu button - only for non-authenticated users */}
          {!user && (
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Toggle menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          )}
        </nav>

        {/* Mobile Navigation Menu with animation - only for non-authenticated users */}
        <AnimatePresence>
          {mobileMenuOpen && !user && (
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex flex-col p-4 bg-black/95 md:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                    <Youtube className="w-5 h-5" />
                  </div>
                  <span className="ml-2 text-xl font-bold text-white">
                    YouTube Website Builder
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="mt-8 flex flex-col space-y-6">
                <div className="pt-4">
                  <button 
                    onClick={handleLogin}
                    className="w-full justify-start border border-gray-700 text-white p-4 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Log in
                  </button>
                </div>
                <button 
                  onClick={handleGetStarted}
                  className="h-12 rounded-full bg-white px-8 text-base font-medium text-black hover:bg-white/90 transition-colors"
                >
                  Start Building Your Website
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge */}
        <div className="mx-auto mt-6 flex max-w-fit items-center justify-center space-x-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors" onClick={handleGetStarted}>
          <Youtube className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium text-white">
            Turn your YouTube channel into a website!
          </span>
          <ArrowRight className="h-4 w-4 text-white" />
        </div>

        {/* Hero section */}
        <div className="container mx-auto mt-12 px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            Create a Stunning Website for Your YouTube Channel
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
            No coding required! Just paste your YouTube channel link, describe your vision, and watch AI build your perfect website in minutes.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button 
              onClick={handleGetStarted}
              className="h-12 rounded-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 px-8 text-base font-medium text-white transition-colors flex items-center gap-2"
            >
              <Youtube className="w-5 h-5" />
              Build Your Website Free
            </button>
            <button 
              onClick={handleWatchDemo}
              className="h-12 rounded-full border border-gray-600 px-8 text-base font-medium text-white hover:bg-white/10 transition-colors"
            >
              See Examples
            </button>
          </div>

          <div className="relative mx-auto my-20 w-full max-w-6xl">
            <div className="absolute inset-0 rounded shadow-lg bg-white blur-[10rem] bg-grainy opacity-20" />

            {/* Hero Image - YouTube themed */}
            <div className="relative w-full h-auto shadow-md rounded cursor-pointer hover:scale-105 transition-all duration-500 bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 p-8" onClick={handleGetStarted}>
              <div className="flex items-center justify-center h-64 md:h-96">
                <div className="text-center">
                  <Youtube className="w-24 h-24 text-red-500 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">Your YouTube Channel</h3>
                  <div className="flex items-center justify-center gap-4 text-gray-300">
                    <div className="flex items-center gap-1">
                      <span>→</span>
                      <span>AI Analysis</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>→</span>
                      <span>Custom Website</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-4">Click to start building</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function NavItem({
  label,
  hasDropdown,
}: {
  label: string;
  hasDropdown?: boolean;
}) {
  return (
    <div className="flex items-center text-sm text-gray-300 hover:text-white cursor-pointer">
      <span>{label}</span>
      {hasDropdown && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </div>
  );
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-800 pb-2 text-lg text-white cursor-pointer hover:text-purple-400 transition-colors">
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-gray-400" />
    </div>
  );
}

export { Hero2 };
