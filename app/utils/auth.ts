import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Secret key for JWT signing - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'traintracker-admin-secret';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'WhereDidTheSunGo'; // Default password for development

// Token expiration time
const TOKEN_EXPIRATION = '24h';

// Admin user object
export interface AdminUser {
  username: string;
  role: 'admin';
}

/**
 * Generate a JWT token for an admin user
 */
export function generateToken(user: AdminUser): string {
  console.log('Generating token for user:', user);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
  console.log('Token generated successfully');
  return token;
}

/**
 * Verify a JWT token and return the decoded user
 */
export function verifyToken(token: string): AdminUser | null {
  try {
    console.log('Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    console.log('Token verified successfully for user:', decoded.username);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Authenticate an admin user with a password
 */
export function authenticateAdmin(password: string): AdminUser | null {
  console.log('Authenticating admin with password');
  if (password === ADMIN_PASSWORD) {
    console.log('Password matched, authentication successful');
    return { username: 'admin', role: 'admin' };
  }
  console.log('Password did not match');
  return null;
}

/**
 * Get the current admin user from the request (for API routes)
 */
export function getAdminUserFromApiRequest(req: any): AdminUser | null {
  console.log('Getting admin user from API request');
  console.log('Cookies in request:', req.cookies);
  
  const token = req.cookies?.admin_token;
  if (!token) {
    console.log('No admin_token cookie found in request');
    return null;
  }
  
  console.log('Found admin_token cookie, verifying...');
  return verifyToken(token);
}

/**
 * Get the current admin user from cookies (for server components)
 */
export async function getAdminUserFromServerComponent(): Promise<AdminUser | null> {
  try {
    console.log('Getting admin user from server component');
    const cookieStore = await cookies();
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
