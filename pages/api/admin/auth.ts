import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAdmin, generateToken } from '../../../app/utils/auth-server';
import { logger } from '../../../app/utils/logger';

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
    logger.info('Processing admin login request', 'AUTH_API');
    const { password } = req.body;

    if (!password) {
      logger.warn('Login attempt without password', 'AUTH_API');
      return res.status(400).json({ error: 'Password is required' });
    }

    // Authenticate admin
    logger.debug('Authenticating admin credentials', 'AUTH_API');
    const user = authenticateAdmin(password);

    if (!user) {
      logger.warn('Authentication failed: Invalid password', 'AUTH_API');
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Generate JWT token
    logger.info('Authentication successful, generating token', 'AUTH_API');
    const token = generateToken(user);
    
    logger.info(`Generated token for user: ${user.username}`, 'AUTH_API');

    // Set cookie directly without using the cookie package
    const isProduction = process.env.NODE_ENV === 'production';
    const maxAge = 60 * 60 * 24; // 24 hours in seconds
    
    // Clear any existing cookie first
    const clearCookie = `admin_token=; Path=/; Max-Age=0; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=Lax`;
    
    // Set the new cookie
    const setCookie = `admin_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=Lax`;
    
    // Apply both cookies
    res.setHeader('Set-Cookie', [clearCookie, setCookie]);
    
    logger.info('Set admin_token cookie successfully', 'AUTH_API');
    
    return res.status(200).json({ 
      success: true, 
      user: user.username,
      timestamp: Date.now() // Add timestamp to prevent caching
    });
  } catch (error) {
    logger.error('Authentication error', 'AUTH_API', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
