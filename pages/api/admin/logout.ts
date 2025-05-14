import { NextApiRequest, NextApiResponse } from 'next';
import { clearAuthFromLocalStorage } from '../../../app/utils/auth-client';
import cookie from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Logging out user');
    
    // Clear the admin token cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as 'lax',
      path: '/',
      maxAge: 0, // Expire immediately
    };
    
    // Ensure the cookie is properly cleared by setting multiple headers
    res.setHeader(
      'Set-Cookie', [
        cookie.serialize('admin_token', '', cookieOptions),
        // Add a second cookie with a different path as a fallback
        cookie.serialize('admin_token', '', { ...cookieOptions, path: '/admin' })
      ]
    );
    
    return res.status(200).json({ 
      success: true,
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  }
}
