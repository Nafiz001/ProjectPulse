'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { LoadingPage } from '@/components/ui/Loading';

export default function LoginPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'employee':
          router.push('/employee');
          break;
        case 'client':
          router.push('/client');
          break;
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Navigation will happen via useEffect
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingPage />;
  }

  if (user) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 text-white rounded-lg p-3">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ProjectPulse</h1>
          <p className="text-gray-600 mt-2">Project Health & Client Feedback Tracker</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Sign In</h2>

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-900">Admin:</p>
                <p>admin@projectpulse.com / Admin@123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-900">Employee:</p>
                <p>employee@projectpulse.com / Employee@123</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-900">Client:</p>
                <p>client@projectpulse.com / Client@123</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 ProjectPulse. All rights reserved.
        </p>
      </div>
    </div>
  );
}
