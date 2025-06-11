
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Lock, User, Chrome, AlertCircle, Code, Users, ArrowLeft, Home } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signUp, loginWithGoogle, loginAsAdmin, user, profile, isLoading } = useAuth();

  // Special admin credentials
  const ADMIN_CREDENTIALS = [
    { email: 'kirishmithun2006@gmail.com', password: 'GoZ22266' },
    { email: 'zenmithun@outlook.com', password: 'GoZ22266' }
  ];

  // Redirect if already logged in
  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return;
    
    if (user && profile && profile.role) {
      console.log('User detected in LoginForm, redirecting...', profile.role);
      
      if (profile.role === 'admin') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/user-dashboard', { replace: true });
      }
    }
  }, [user, profile, navigate, isLoading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if trying to access developer portal with special credentials
      if (userType === 'developer') {
        const isValidAdmin = ADMIN_CREDENTIALS.some(
          cred => cred.email === email && cred.password === password
        );
        
        if (!isValidAdmin) {
          setError('Access denied. Only authorized developers can access the developer portal.');
          setLoading(false);
          return;
        }

        console.log('Attempting admin login for developer portal...');
        await loginAsAdmin(email, password);
      } else {
        console.log('Attempting regular login...');
        await login(email, password);
      }
      
      console.log('Login successful');
      // Navigation will be handled by the useEffect above
    } catch (loginError: any) {
      console.error('Login failed:', loginError);
      setError(loginError.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prevent developer signup for non-admin emails
    if (userType === 'developer') {
      const isAdminEmail = ADMIN_CREDENTIALS.some(cred => cred.email === email);
      if (!isAdminEmail) {
        setError('Developer accounts are restricted. Please contact administrator.');
        setLoading(false);
        return;
      }
    }

    try {
      await signUp(email, password, fullName);
      setError('');
      alert('Please check your email to confirm your account!');
    } catch (signUpError: any) {
      console.error('Signup failed:', signUpError);
      setError(signUpError.message || 'Signup failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    if (userType === 'developer') {
      setError('Developer portal access is restricted to specific credentials only.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await loginWithGoogle();
      console.log('Google login initiated');
    } catch (googleError: any) {
      console.error('Google login failed:', googleError);
      setError(googleError.message || 'Google login failed. Please try again.');
      setLoading(false);
    }
  };

  // Show loading while auth is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* YouTube-style red multicolor gradient background */}
      <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0">
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-red-600 to-pink-600"></div>
        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-red-900 to-orange-400"></div>
        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-orange-600 to-red-500"></div>
      </div>
      <div className="absolute inset-0 bg-noise opacity-30"></div>
      
      {/* Navigation Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button 
            onClick={() => navigate('/')} 
            variant="outline" 
            className="border-gray-600 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-white/5 border-gray-800 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-pink-600">
                <span className="text-2xl">🎥</span>
              </div>
              AI Website Builder
            </CardTitle>
            <p className="text-gray-400">Create websites from YouTube channels</p>
          </CardHeader>
          <CardContent>
            {/* User Type Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-800 rounded-lg">
                <Button
                  variant={userType === 'user' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setUserType('user')}
                  className="flex items-center gap-2"
                >
                  <Users size={16} />
                  Creator
                </Button>
                <Button
                  variant={userType === 'developer' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setUserType('developer')}
                  className="flex items-center gap-2"
                >
                  <Code size={16} />
                  Developer
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {userType === 'user' 
                  ? 'Create websites from YouTube channels'
                  : 'Access developer dashboard (Special credentials required)'
                }
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
                <TabsTrigger value="login" className="text-white">Login</TabsTrigger>
                <TabsTrigger value="signup" className="text-white">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white" disabled={loading}>
                    <User className="mr-2 h-4 w-4" />
                    {loading ? 'Signing in...' : `Access ${userType === 'user' ? 'Creator Portal' : 'Developer Portal'}`}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white" disabled={loading}>
                    <User className="mr-2 h-4 w-4" />
                    {loading ? 'Creating account...' : `Create ${userType === 'user' ? 'Creator' : 'Developer'} Account`}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {userType === 'user' && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Or continue with</span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full mt-4 bg-white/5 border-gray-600 text-white hover:bg-white/10"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  {loading ? 'Connecting...' : 'Continue with Google'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
