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
  const [validSession, setValidSession] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const initializePasswordReset = async () => {
      // Check for tokens in both URL search params and hash fragments
      let accessToken = searchParams.get('access_token');
      let refreshToken = searchParams.get('refresh_token');
      let type = searchParams.get('type');
      let errorParam = searchParams.get('error');
      let errorDescription = searchParams.get('error_description');
      
      // If not found in search params, check hash fragments
      if (!accessToken && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token');
        refreshToken = hashParams.get('refresh_token');
        type = hashParams.get('type');
        errorParam = hashParams.get('error');
        errorDescription = hashParams.get('error_description');
      }
      
      // Check for errors first
      if (errorParam) {
        const errorMessage = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'An error occurred during password reset';
        setError(`Reset failed: ${errorMessage}`);
        return;
      }
    
      if (accessToken && refreshToken && type === 'recovery') {
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setError('Invalid or expired reset link. Please request a new password reset.');
            return;
          }

          if (data.session) {
            setValidSession(true);
          }
        } catch (error) {
          console.error('Error during session setup:', error);
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      } else {
        setError('Invalid reset link. Please request a new password reset.');
      }
    };

    initializePasswordReset();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validSession) {
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

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      toast.success('Password updated successfully!');
      // Sign out to ensure clean state, then redirect to login
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  // Show loading while checking session validity
  if (!validSession && !error) {
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
          </div>
        </div>
      </div>
    );
  }

  // Show error state if session is invalid
  if (!validSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-elevated mb-4">
              <Book className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
              Reset Link Invalid
            </h1>
          </div>

          <Card className="bg-card/95 backdrop-blur-sm shadow-elevated border-border/50">
            <CardContent className="pt-6">
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="text-center">
                <Button onClick={() => navigate('/forgot-password')} className="w-full">
                  Request New Reset Link
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