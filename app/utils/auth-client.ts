// Admin user object
export interface AdminUser {
  username: string;
  role: 'admin';
}

/**
 * Store authentication in localStorage (client-side only)
 */
export function storeAuthInLocalStorage(user: AdminUser): void {
  if (typeof window !== 'undefined') {
    console.log('Storing auth in localStorage');
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
}

/**
 * Get authentication from localStorage (client-side only)
 */
export function getAuthFromLocalStorage(): AdminUser | null {
  if (typeof window !== 'undefined') {
    try {
      console.log('Getting auth from localStorage');
      const storedUser = localStorage.getItem('admin_user');
      if (!storedUser) {
        console.log('No auth found in localStorage');
        return null;
      }
      
      const user = JSON.parse(storedUser) as AdminUser;
      console.log('Found auth in localStorage for user:', user.username);
      return user;
    } catch (error) {
      console.error('Error getting auth from localStorage:', error);
      return null;
    }
  }
  return null;
}

/**
 * Clear authentication from localStorage (client-side only)
 */
export function clearAuthFromLocalStorage(): void {
  if (typeof window !== 'undefined') {
    console.log('Clearing auth from localStorage');
    localStorage.removeItem('admin_user');
  }
}
