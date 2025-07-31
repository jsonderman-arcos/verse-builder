import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Book, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const redirectUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:8080/reset-password'
      : 'https://fantastic-paletas-83e43a.netlify.app/reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      toast.success('Password reset email sent!');
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-peaceful p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-elevated mb-4">
              <Book className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-divine bg-clip-text text-transparent">
              Check Your Email
            </h1>
          </div>

          <Card className="bg-card/95 backdrop-blur-sm shadow-elevated border-border/50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Check your email and follow the instructions to reset your password.
                </p>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Sign In
                  </Button>
                </Link>
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
          <p className="text-muted-foreground">Enter your email to reset your password</p>
        </div>

        <Card className="bg-card/95 backdrop-blur-sm shadow-elevated border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
            <CardDescription className="text-center">
              We'll send you a link to reset your password
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-primary hover:underline">
                <ArrowLeft className="mr-1 h-3 w-3 inline" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;