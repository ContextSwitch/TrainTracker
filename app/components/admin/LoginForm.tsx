'use client';

import React, { useState } from 'react';
import { storeAuthInLocalStorage } from '../../utils/auth-client';

const LoginForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Submitting login...');
      
      // First, make a request to clear any existing cookies
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Then perform the login
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify({ password }),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();
      console.log('Login response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store authentication in localStorage as a fallback
      if (data.user) {
        storeAuthInLocalStorage({ username: data.user, role: 'admin' });
      }
      
      // Set login success
      console.log('Login successful, redirecting...');
      setLoginSuccess(true);
      
      // Verify the authentication was successful before redirecting
      const verifyResponse = await fetch('/api/admin/check-auth', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        credentials: 'include',
      });
      
      const verifyData = await verifyResponse.json();
      console.log('Verification response:', verifyResponse.status, verifyData);
      
      if (verifyData.authenticated) {
        console.log('Authentication verified, redirecting to admin dashboard');
        // Use a short timeout to ensure the browser has time to process the cookie
        setTimeout(() => {
          // Use window.location for a full page reload with cache busting
          window.location.href = `/admin?auth=true&t=${Date.now()}`;
        }, 500);
      } else {
        console.error('Authentication verification failed');
        setError('Authentication verification failed. Please try again.');
        setLoginSuccess(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoginSuccess(false);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Admin Login
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="-space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
            <div className="flex">
              <div className="text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            </div>
          </div>
        )}

        {loginSuccess && (
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
            <div className="flex">
              <div className="text-sm text-green-700 dark:text-green-400">
                Login successful! Redirecting to dashboard...
              </div>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading || loginSuccess}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {loading ? 'Logging in...' : loginSuccess ? 'Redirecting...' : 'Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
