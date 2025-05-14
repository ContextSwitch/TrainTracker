import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin, generateToken } from '../../../app/utils/auth-client';
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
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Authenticate admin
    const user = authenticateAdmin(password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    const token = generateToken(user);
    
    console.log('Generated token for user:', user.username);

    // Set cookie and return success
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      sameSite: 'lax' as 'lax', // TypeScript needs explicit type
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    };
    
    // Clear any existing cookie first
    res.setHeader('Set-Cookie', [
      cookie.serialize('admin_token', '', { 
        maxAge: 0,
        path: '/',
      }),
      cookie.serialize('admin_token', token, cookieOptions)
    ]);
    
    console.log('Setting admin_token cookie with token');
    
    return res.status(200).json({ 
      success: true, 
      user: user.username,
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
