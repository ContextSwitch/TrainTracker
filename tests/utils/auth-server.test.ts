import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { 
  generateToken, 
  verifyToken, 
  authenticateAdmin,
  AdminUser
} from '../../app/utils/auth-server';

describe('Auth Server Utilities', () => {
  let clock: sinon.SinonFakeTimers;
  let originalJwtSecret: string | undefined;
  let originalAdminPassword: string | undefined;
  
  beforeEach(() => {
    // Set up a fixed time for consistent testing
    clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
    
    // Store original environment variables
    originalJwtSecret = process.env.JWT_SECRET;
    originalAdminPassword = process.env.ADMIN_PASSWORD;
    
    // Set up environment variables for testing
    process.env.JWT_SECRET = 'test-secret-key-that-is-long-enough-for-validation';
    process.env.ADMIN_PASSWORD = 'test-admin-password';
  });
  
  afterEach(() => {
    clock.restore();
    sinon.restore();
    
    // Restore original environment variables
    if (originalJwtSecret !== undefined) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
    
    if (originalAdminPassword !== undefined) {
      process.env.ADMIN_PASSWORD = originalAdminPassword;
    } else {
      delete process.env.ADMIN_PASSWORD;
    }
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = generateToken(user);
      
      expect(token).to.be.a('string');
      expect(token.split('.')).to.have.length(3); // JWT has 3 parts
      
      // Verify the token can be decoded
      const decoded = jwt.verify(token, 'test-secret-key-that-is-long-enough-for-validation') as AdminUser;
      expect(decoded.username).to.equal('admin');
      expect(decoded.role).to.equal('admin');
    });

    it('should generate tokens with 24h expiration by default', () => {
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = generateToken(user);
      
      const decoded = jwt.verify(token, 'test-secret-key-that-is-long-enough-for-validation') as any;
      const expectedExp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now
      expect(decoded.exp).to.equal(expectedExp);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = jwt.sign(user, 'test-secret-key-that-is-long-enough-for-validation', { expiresIn: '1h' });
      
      const result = verifyToken(token);
      expect(result).to.not.be.null;
      expect(result?.username).to.equal('admin');
      expect(result?.role).to.equal('admin');
    });

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid.token.here');
      expect(result).to.be.null;
    });

    it('should return null for expired token', () => {
      // Create an expired token
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const expiredToken = jwt.sign(
        user, 
        'test-secret-key-that-is-long-enough-for-validation', 
        { expiresIn: '-1h' }
      );
      
      const result = verifyToken(expiredToken);
      expect(result).to.be.null;
    });

    it('should return null for token with wrong secret', () => {
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = jwt.sign(user, 'wrong-secret-key');
      
      const result = verifyToken(token);
      expect(result).to.be.null;
    });
  });

  describe('authenticateAdmin', () => {
    it('should authenticate with correct password', () => {
      const result = authenticateAdmin('test-admin-password');
      
      expect(result).to.not.be.null;
      expect(result?.username).to.equal('admin');
      expect(result?.role).to.equal('admin');
    });

    it('should return null for incorrect password', () => {
      const result = authenticateAdmin('wrong-password');
      expect(result).to.be.null;
    });

    it('should return null for empty password', () => {
      const result = authenticateAdmin('');
      expect(result).to.be.null;
    });

    it('should handle case-sensitive passwords', () => {
      const result = authenticateAdmin('TEST-ADMIN-PASSWORD');
      expect(result).to.be.null;
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete auth flow', () => {
      // 1. Authenticate admin with password
      const user = authenticateAdmin('test-admin-password');
      expect(user).to.not.be.null;
      
      // 2. Generate a token for the authenticated user
      const token = generateToken(user!);
      expect(token).to.be.a('string');
      
      // 3. Verify the token
      const decoded = verifyToken(token);
      expect(decoded).to.not.be.null;
      expect(decoded?.username).to.equal('admin');
      expect(decoded?.role).to.equal('admin');
    });

    it('should reject invalid authentication flow', () => {
      // 1. Try to authenticate with wrong password
      const user = authenticateAdmin('wrong-password');
      expect(user).to.be.null;
      
      // 2. Try to verify an invalid token
      const invalidToken = 'invalid.token.string';
      const decoded = verifyToken(invalidToken);
      expect(decoded).to.be.null;
    });
  });

  describe('Environment variable validation', () => {
    it('should handle missing JWT_SECRET gracefully in verifyToken', () => {
      delete process.env.JWT_SECRET;
      
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = jwt.sign(user, 'some-secret');
      
      const result = verifyToken(token);
      expect(result).to.be.null;
    });

    it('should handle missing ADMIN_PASSWORD gracefully in authenticateAdmin', () => {
      delete process.env.ADMIN_PASSWORD;
      
      const result = authenticateAdmin('any-password');
      expect(result).to.be.null;
    });
  });

  describe('Token expiration edge cases', () => {
    it('should handle token that expires exactly now', () => {
      const user: AdminUser = { username: 'admin', role: 'admin' };
      const token = jwt.sign(
        user, 
        'test-secret-key-that-is-long-enough-for-validation', 
        { expiresIn: '0s' }
      );
      
      // Advance time by 1 second to ensure token is expired
      clock.tick(1000);
      
      const result = verifyToken(token);
      expect(result).to.be.null;
    });
  });
});
