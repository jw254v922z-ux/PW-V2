import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const search = useSearch();

  useEffect(() => {
    // Check if token is in URL query params
    const params = new URLSearchParams(search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    } else {
      // Try to get from sessionStorage (from signup)
      const storedToken = sessionStorage.getItem('verificationToken');
      if (storedToken) {
        setToken(storedToken);
      }
    }
  }, [search]);

  const verifyMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success('Email verified successfully! You can now login.');
      sessionStorage.removeItem('verificationToken');
      setLocation('/login');
    },
    onError: (error) => {
      toast.error(error.message || 'Email verification failed');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please enter a verification token');
      return;
    }

    setIsLoading(true);
    try {
      await verifyMutation.mutateAsync({ token });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Email</CardTitle>
          <CardDescription>Enter the verification token from your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="token" className="text-sm font-medium">
                Verification Token
              </label>
              <Input
                id="token"
                type="text"
                placeholder="Enter token from email"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Check your email for the verification token
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Already verified?{' '}
              <a href="/login" className="text-primary hover:underline">
                Login here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
