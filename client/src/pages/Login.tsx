import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  // Redirect if already logged in
  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setLocation('/');
    }
  }, [setLocation]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      console.log('[Login] Success response:', data);
      if (data.sessionToken) {
        console.log('[Login] Storing token in localStorage');
        localStorage.setItem('auth_token', data.sessionToken);
        console.log('[Login] Token stored, redirecting to /');
      } else {
        console.warn('[Login] No sessionToken in response');
      }
      toast.success('Login successful!');
      setLocation('/');
    },
    onError: (error) => {
      console.error('[Login] Error:', error);
      toast.error(error.message || 'Login failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[Login] Submitting login form for email:', email);

    try {
      await loginMutation.mutateAsync({
        email,
        password,
      });
    } catch (error) {
      console.error('[Login] Mutation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your email and password to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <a href="/signup" className="text-primary hover:underline">
                Sign up
              </a>
            </p>
            <p className="text-muted-foreground mt-2">
              <a href="/forgot-password" className="text-primary hover:underline">
                Forgot password?
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
