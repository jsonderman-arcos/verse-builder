import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Book, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validTokens, setValidTokens] = useState(false);
  const [checkingTokens, setCheckingTokens] = useState(true);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const extractTokens = () => {
      console.log('Extracting tokens from URL...');
      console.log('Current URL:', window.location.href);
      
      // Extract tokens from URL (both search params and hash)
      let access_token = searchParams.get('access_token');
      let refresh_token = searchParams.get('refresh_token');
      let type = searchParams.get('type');
      let errorParam = searchParams.get('error');
      let errorDescription = searchParams.get('error_description');
      
      // Check hash fragments if not found in search params
      if (!access_token && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        access_token = hashParams.get('access_token');
        refresh_token = hashParams.get('refresh_token');
        type = hashParams.get('type');
        errorParam = hashParams.get('error');
        errorDescription = hashParams.get('error_description');
      }
      
      console.log('Extracted tokens:', { 
        hasAccessToken: !!access_token, 
        hasRefreshToken: !!refresh_token, 
        type, 
        errorParam, 
        errorDescription 
      });
      
      // Handle errors from URL
      if (errorParam) {
        const errorMessage = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'An error occurred during password reset';
        setError(`Reset failed: ${errorMessage}`);
        setCheckingTokens(false);
        return;
      }
    
      if (access_token && refresh_token && type === 'recovery') {
        setAccessToken(access_token);
        setRefreshToken(refresh_token);
        setValidTokens(true);
        console.log('Valid tokens found, ready for password reset');
      } else {
        setError('Invalid reset link. Please request a new password reset.');
      }
      
      setCheckingTokens(false);
    };

    extractTokens();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validTokens) {
      setError('Invalid session. Please request a new password reset.');
      return;
    }

    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      console.log('Calling server-side password reset function...');
      
      // Call our Edge Function to handle the password reset server-side
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: {
          access_token: accessToken,
          refresh_token: refreshToken,
          new_password: password
        }
      });

      if (error) {
        console.error('Function invocation error:', error);
        throw new Error(error.message || 'Failed to reset password');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      console.log('Password reset successful');
      toast.success('Password updated successfully!');
      
      // Clear the URL hash/params and redirect to login
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/login');

    } catch (error) {
      console.error('Password reset error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
      setLoading(false);
    }
  };

  // Show loading while checking tokens
  if (checkingTokens) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-elevated mb-4">
              <Book className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
              Verifying Reset Link
            </h1>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Validating your reset tokens...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if tokens are invalid
  if (!validTokens && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-elevated mb-4">
              <Book className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
              Reset Link Issue
            </h1>
          </div>

          <Card className="bg-card/95 backdrop-blur-sm shadow-elevated border-border/50">
            <CardContent className="pt-6">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button onClick={() => navigate('/forgot-password')} className="w-full">
                  Request New Reset Link
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-elevated mb-4">
            <Book className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-muted-foreground">Enter your new password</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm shadow-elevated border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">New Password</CardTitle>
            <CardDescription className="text-center">
              Choose a strong password for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;