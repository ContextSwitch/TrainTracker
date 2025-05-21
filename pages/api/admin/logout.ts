import { NextApiRequest, NextApiResponse } from 'next';

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
    
    // Set production flag
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Clear the admin token cookie with multiple paths to ensure it's properly cleared
    const clearCookieRoot = `admin_token=; Path=/; Max-Age=0; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=Lax`;
    const clearCookieAdmin = `admin_token=; Path=/admin; Max-Age=0; HttpOnly${isProduction ? '; Secure' : ''}; SameSite=Lax`;
    
    // Set both cookies
    res.setHeader('Set-Cookie', [clearCookieRoot, clearCookieAdmin]);
    
    console.log('Admin token cookies cleared successfully');
    
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
