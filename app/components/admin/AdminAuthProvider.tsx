'use client';

import { useEffect } from 'react';
import { getAuthFromLocalStorage } from '../../utils/auth-client';

/**
 * This component sets the auth header when using localStorage authentication
 * It should be included in the admin layout
 */
const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Always check localStorage on mount and after any potential changes
    const checkAuth = () => {
      const user = getAuthFromLocalStorage();
      
      // Always set up the fetch interceptor to ensure credentials are included
      console.log('Setting up fetch interceptor for admin routes');
      
      // Create a function to intercept fetch requests and add the auth header
      const originalFetch = window.fetch;
      window.fetch = async function(input, init) {
        // Clone the init object to avoid modifying the original
        const modifiedInit = init ? { ...init } : {};
        
        // Initialize headers if they don't exist
        if (!modifiedInit.headers) {
          modifiedInit.headers = {};
        }
        
        // Add the auth header if we have a user in localStorage
        if (user) {
          console.log('Adding x-admin-auth header to fetch request');
          if (modifiedInit.headers instanceof Headers) {
            modifiedInit.headers.set('x-admin-auth', 'true');
          } else {
            (modifiedInit.headers as Record<string, string>)['x-admin-auth'] = 'true';
          }
        }
        
        // Always ensure credentials are included for cookie auth to work
        modifiedInit.credentials = 'include';
        
        // For all requests, add cache control headers to prevent caching issues
        if (modifiedInit.headers instanceof Headers) {
          modifiedInit.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
          modifiedInit.headers.set('Pragma', 'no-cache');
          modifiedInit.headers.set('Expires', '0');
        } else {
          (modifiedInit.headers as Record<string, string>)['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          (modifiedInit.headers as Record<string, string>)['Pragma'] = 'no-cache';
          (modifiedInit.headers as Record<string, string>)['Expires'] = '0';
        }
        
        // Call the original fetch with the modified init
        return originalFetch.call(this, input, modifiedInit);
      };
      
      // Return cleanup function
      return () => {
        window.fetch = originalFetch;
      };
    };
    
    // Set up initial interceptor
    const cleanup = checkAuth();
    
    // Set up storage event listener to detect changes in other tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'admin_user') {
        // Clean up old interceptor and set up new one if needed
        cleanup();
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Clean up event listener and interceptor
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      cleanup();
    };
  }, []);
  
  return <>{children}</>;
};

export default AdminAuthProvider;
