import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../app/utils/auth-server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Set cache control headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Log headers and cookies for debugging
    console.log('Headers:', req.headers);
    console.log('Cookies:', req.cookies);
    
    // Check for auth header (set by client-side code when using localStorage)
    const authHeader = req.headers['x-admin-auth'];
    if (authHeader === 'true') {
      console.log('Found x-admin-auth header, considering authenticated');
      return res.status(200).json({ 
        authenticated: true, 
        user: 'admin',
        role: 'admin',
        authMethod: 'header',
        timestamp: Date.now() // Add timestamp to prevent caching
      });
    }
    
    // Get the admin user from the request cookies
    const token = req.cookies.admin_token;
    console.log('Token from cookies:', token ? 'exists' : 'not found');
    
    if (!token) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'No token found',
        cookies: req.cookies,
        timestamp: Date.now() // Add timestamp to prevent caching
      });
    }
    
    const user = verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Invalid token',
        timestamp: Date.now() // Add timestamp to prevent caching
      });
    }
    
    return res.status(200).json({ 
      authenticated: true, 
      user: user.username,
      role: user.role,
      authMethod: 'cookie',
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  }
}
