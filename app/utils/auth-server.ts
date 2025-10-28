import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Secret key for JWT signing - REQUIRED in environment variables
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters long');
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is required');
}

// Token expiration time
const TOKEN_EXPIRATION = '24h';

// Admin user object
export interface AdminUser {
  username: string;
  role: 'admin';
}

/**
 * Generate a JWT token for an admin user (SERVER-SIDE ONLY)
 */
export function generateToken(user: AdminUser): string {
  logger.debug('Generating token for admin user', 'AUTH');
  const token = jwt.sign(user, JWT_SECRET!, { expiresIn: TOKEN_EXPIRATION });
  logger.debug('Token generated successfully', 'AUTH');
  return token;
}

/**
 * Verify a JWT token and return the decoded user (SERVER-SIDE ONLY)
 */
export function verifyToken(token: string): AdminUser | null {
  try {
    logger.debug('Verifying JWT token', 'AUTH');
    const decoded = jwt.verify(token, JWT_SECRET!) as AdminUser;
    logger.debug(`Token verified successfully for user: ${decoded.username}`, 'AUTH');
    return decoded;
  } catch (error) {
    logger.error('Error verifying JWT token', 'AUTH', error);
    return null;
  }
}

/**
 * Authenticate an admin user with a password (SERVER-SIDE ONLY)
 */
export function authenticateAdmin(password: string): AdminUser | null {
  logger.debug('Authenticating admin user', 'AUTH');
  if (password === ADMIN_PASSWORD!) {
    logger.info('Admin authentication successful', 'AUTH');
    return { username: 'admin', role: 'admin' };
  }
  logger.warn('Admin authentication failed - invalid password', 'AUTH');
  return null;
}
