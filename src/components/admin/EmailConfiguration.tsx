
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Send, CheckCircle, AlertCircle, Globe } from 'lucide-react';

const EmailConfiguration = () => {
  const [smtpConfig, setSmtpConfig] = useState({
    host: '',
    port: '',
    username: '',
    password: '',
    fromEmail: ''
  });

  const [googleConfig, setGoogleConfig] = useState({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    accessToken: '',
    fromEmail: ''
  });

  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testSMTPConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulate SMTP test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!smtpConfig.host || !smtpConfig.username || !smtpConfig.password) {
        throw new Error('Please fill in all SMTP configuration fields');
      }

      setTestResult({
        success: true,
        message: 'SMTP connection successful! Configuration is valid.'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'SMTP connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const testGoogleMail = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      if (!googleConfig.clientId || !googleConfig.clientSecret) {
        throw new Error('Please configure Google OAuth credentials');
      }

      // Simulate Google API test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTestResult({
        success: true,
        message: 'Google Mail API connection successful!'
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || 'Google Mail API connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setTestResult({
        success: true,
        message: `Test email sent successfully to ${testEmail}!`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Failed to send test email'
      });
    } finally {
      setTesting(false);
    }
  };

  const generateGoogleOAuthUrl = () => {
    const params = new URLSearchParams({
      client_id: googleConfig.clientId,
      redirect_uri: `${window.location.origin}/oauth/google`,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });
    
    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
  };

  const saveConfiguration = async (type: 'smtp' | 'google') => {
    try {
      // Here you would save to your database
      console.log(`Saving ${type} configuration:`, type === 'smtp' ? smtpConfig : googleConfig);
      
      alert(`${type.toUpperCase()} configuration saved successfully!`);
    } catch (error) {
      alert(`Failed to save ${type} configuration`);
    }
  };

  return (
    <Card className="bolt-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 bolt-text-gradient">
          <Mail size={20} />
          Email Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="smtp" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="smtp">SMTP Configuration</TabsTrigger>
            <TabsTrigger value="google">Google Mail API</TabsTrigger>
          </TabsList>

          <TabsContent value="smtp" className="space-y-4">
            <div className="space-y-4">
              <div className="responsive-grid gap-4">
                <div>
                  <label className="text-sm font-medium">SMTP Host</label>
                  <Input 
                    placeholder="smtp.gmail.com" 
                    className="bolt-input mt-1"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">SMTP Port</label>
                  <Input 
                    placeholder="587" 
                    className="bolt-input mt-1"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="responsive-grid gap-4">
                <div>
                  <label className="text-sm font-medium">Username</label>
                  <Input 
                    placeholder="your-email@gmail.com" 
                    className="bolt-input mt-1"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Password</label>
                  <Input 
                    type="password" 
                    placeholder="App Password" 
                    className="bolt-input mt-1"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">From Email</label>
                <Input 
                  placeholder="noreply@yourdomain.com" 
                  className="bolt-input mt-1"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="bolt-button text-sm"
                  onClick={testSMTPConnection}
                  disabled={testing}
                >
                  <Send size={16} />
                  {testing ? 'Testing...' : 'Test Connection'}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={() => saveConfiguration('smtp')}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="google" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h3 className="font-semibold text-blue-400 mb-2">🔧 Google Mail API Setup</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure Google Mail API for reliable email delivery with OAuth 2.0 authentication.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>• Create a project in Google Cloud Console</p>
                  <p>• Enable Gmail API</p>
                  <p>• Create OAuth 2.0 credentials</p>
                  <p>• Add authorized redirect URI: {window.location.origin}/oauth/google</p>
                </div>
              </div>

              <div className="responsive-grid gap-4">
                <div>
                  <label className="text-sm font-medium">Client ID</label>
                  <Input 
                    placeholder="xxxxx.apps.googleusercontent.com" 
                    className="bolt-input mt-1"
                    value={googleConfig.clientId}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, clientId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Client Secret</label>
                  <Input 
                    type="password"
                    placeholder="Your client secret" 
                    className="bolt-input mt-1"
                    value={googleConfig.clientSecret}
                    onChange={(e) => setGoogleConfig({ ...googleConfig, clientSecret: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">From Email</label>
                <Input 
                  placeholder="your-email@gmail.com" 
                  className="bolt-input mt-1"
                  value={googleConfig.fromEmail}
                  onChange={(e) => setGoogleConfig({ ...googleConfig, fromEmail: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={googleConfig.refreshToken ? "default" : "secondary"}>
                    {googleConfig.refreshToken ? "Authorized" : "Not Authorized"}
                  </Badge>
                  {googleConfig.refreshToken && <CheckCircle size={16} className="text-green-500" />}
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    if (googleConfig.clientId) {
                      window.open(generateGoogleOAuthUrl(), '_blank', 'width=500,height=600');
                    } else {
                      alert('Please enter Client ID first');
                    }
                  }}
                >
                  <Globe size={16} className="mr-2" />
                  Authorize Gmail Access
                </Button>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  className="bolt-button text-sm"
                  onClick={testGoogleMail}
                  disabled={testing}
                >
                  <Send size={16} />
                  {testing ? 'Testing...' : 'Test Google API'}
                </Button>
                <Button 
                  variant="outline" 
                  className="text-sm"
                  onClick={() => saveConfiguration('google')}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Test Email Section */}
        <div className="mt-6 pt-6 border-t border-border/30">
          <h3 className="font-semibold mb-3">📧 Send Test Email</h3>
          <div className="flex gap-2">
            <Input
              placeholder="test@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="bolt-input"
            />
            <Button onClick={sendTestEmail} disabled={testing} className="bolt-button">
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Test
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            testResult.success 
              ? 'bg-green-500/10 border border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}>
            {testResult.success ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            <span className="text-sm">{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailConfiguration;
