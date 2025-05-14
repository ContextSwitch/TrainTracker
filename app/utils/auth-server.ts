import { cookies } from 'next/headers';
import { AdminUser, verifyToken } from './auth-client';

/**
 * Get the current admin user from cookies (for server components)
 */
export function getAdminUserFromServerComponent(): AdminUser | null {
  try {
    console.log('Getting admin user from server component');
    const cookieStore = cookies();
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) {
      console.log('No admin_token cookie found in server component');
      return null;
    }
    
    console.log('Found admin_token cookie in server component, verifying...');
    return verifyToken(token);
  } catch (error) {
    console.error('Error getting admin user from server component:', error);
    return null;
  }
}
