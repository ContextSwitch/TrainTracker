'use client';

import { useEffect, useState } from 'react';
import { getAuthFromLocalStorage } from '../../utils/auth-client';

/**
 * This component checks authentication status on admin pages
 * and redirects to login if not authenticated
 */
const AdminAuthCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if we're coming from a successful login redirect with auth param
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParam = urlParams.get('auth') === 'true';
    
    if (hasAuthParam) {
      console.log('Direct access with auth param, considering authenticated');
      setIsAuthenticated(true);
      setIsChecking(false);
      
      // Clean up URL by removing auth parameter
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('auth');
      window.history.replaceState({}, document.title, cleanUrl.toString());
      return;
    }
    
    const checkAuth = async () => {
      try {
        console.log('Checking authentication status...');
        
        // First check localStorage
        const localUser = getAuthFromLocalStorage();
        if (localUser) {
          console.log('Found auth in localStorage, considering authenticated');
          setIsAuthenticated(true);
          setIsChecking(false);
          return;
        }
        
        // Then check with the server
        const response = await fetch('/api/admin/check-auth', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
          credentials: 'include',
        });
        
        const data = await response.json();
        console.log('Auth check response:', data);
        
        if (data.authenticated) {
          console.log('Server confirmed authentication');
          setIsAuthenticated(true);
        } else {
          console.log('Not authenticated, redirecting to login');
          // Add a cache-busting parameter to avoid any caching issues
          window.location.href = `/admin/login?t=${Date.now()}`;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // On error, check localStorage as fallback
        const localUser = getAuthFromLocalStorage();
        if (localUser) {
          console.log('Error occurred but found auth in localStorage');
          setIsAuthenticated(true);
        } else {
          console.log('Error occurred and no localStorage auth, redirecting to login');
          // Add a cache-busting parameter to avoid any caching issues
          window.location.href = `/admin/login?t=${Date.now()}`;
        }
      } finally {
        setIsChecking(false);
      }
    };
    
    // Add a small delay before checking auth to ensure any cookies are properly set
    const timer = setTimeout(() => {
      checkAuth();
    }, 300); // Increased delay to ensure cookies are properly set
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isChecking) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return <>{children}</>;
};

export default AdminAuthCheck;
