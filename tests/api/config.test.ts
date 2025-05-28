import * as chai from 'chai';
import * as sinon from 'sinon';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/admin/config';
import * as authClient from '../../app/utils/auth-client';
import { appConfig } from '../../app/config';
import { AdminUser } from '../../app/utils/auth-client';

const { expect } = chai;

describe('Config API Tests', () => {
  // Create stubs for the auth client
  const verifyTokenStub = sinon.stub(authClient, 'verifyToken');
  
  // Create mock request and response objects
  let req: any;
  let res: any;
  
  // Save the original appConfig values
  const originalScraperType = appConfig.scraperType;
  const originalNotificationsEnabled = appConfig.notificationsEnabled;
  const originalCheckIntervalMinutes = appConfig.checkIntervalMinutes;
  
  beforeEach(() => {
    // Reset all stubs
    verifyTokenStub.reset();
    
    // Setup mock request and response
    const { req: mockReq, res: mockRes } = createMocks({
      method: 'GET',
      cookies: {
        admin_token: 'valid-token'
      },
      headers: {}
    });
    
    req = mockReq;
    res = mockRes;
    
    // Setup default auth behavior
    verifyTokenStub.returns({ username: 'admin', role: 'admin' } as AdminUser);
  });
  
  afterEach(() => {
    // Restore original appConfig values
    appConfig.scraperType = originalScraperType;
    appConfig.notificationsEnabled = originalNotificationsEnabled;
    appConfig.checkIntervalMinutes = originalCheckIntervalMinutes;
  });
  
  after(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('GET /api/admin/config', () => {
    it('should return the current configuration', async () => {
      // Set some config values
      appConfig.scraperType = 'dixieland';
      appConfig.notificationsEnabled = false;
      appConfig.checkIntervalMinutes = 60;
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.true;
      expect(data.config).to.exist;
      expect(data.config.scraperType).to.equal('dixieland');
      expect(data.config.notificationsEnabled).to.be.false;
      expect(data.config.checkIntervalMinutes).to.equal(60);
    });
    
    it('should return 401 if no token is provided', async () => {
      // Remove the token from the request
      req.cookies = {};
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(401);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Unauthorized - No token found');
    });
    
    it('should return 401 if the token is invalid', async () => {
      // Setup the auth client to return null (invalid token)
      verifyTokenStub.returns(null);
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(401);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Unauthorized - Invalid token');
    });
    
    it('should accept x-admin-auth header for authentication', async () => {
      // Setup the request with the x-admin-auth header
      req.cookies = {};
      req.headers = {
        'x-admin-auth': 'true'
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.true;
    });
  });
  
  describe('POST /api/admin/config', () => {
    beforeEach(() => {
      // Setup for POST requests
      req.method = 'POST';
      req.body = {};
    });
    
    it('should update the scraper type', async () => {
      // Set the initial scraper type
      appConfig.scraperType = 'dixieland';
      
      // Setup the request body
      req.body = {
        scraperType: 'transitdocs'
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.true;
      expect(data.config.scraperType).to.equal('transitdocs');
      
      // Verify the appConfig was updated
      expect(appConfig.scraperType).to.equal('transitdocs');
    });
    
    it('should update multiple config values at once', async () => {
      // Set the initial config values
      appConfig.scraperType = 'dixieland';
      appConfig.notificationsEnabled = false;
      appConfig.checkIntervalMinutes = 60;
      
      // Setup the request body
      req.body = {
        scraperType: 'transitdocs',
        notificationsEnabled: true,
        checkIntervalMinutes: 30
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.true;
      expect(data.config.scraperType).to.equal('transitdocs');
      expect(data.config.notificationsEnabled).to.be.true;
      expect(data.config.checkIntervalMinutes).to.equal(30);
      
      // Verify the appConfig was updated
      expect(appConfig.scraperType).to.equal('transitdocs');
      expect(appConfig.notificationsEnabled).to.be.true;
      expect(appConfig.checkIntervalMinutes).to.equal(30);
    });
    
    it('should return 400 if the scraper type is invalid', async () => {
      // Setup the request body with an invalid scraper type
      req.body = {
        scraperType: 'invalid'
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Invalid scraper type. Must be "dixieland" or "transitdocs".');
      
      // Verify the appConfig was not updated
      expect(appConfig.scraperType).to.not.equal('invalid');
    });
    
    it('should return 400 if the check interval is invalid', async () => {
      // Setup the request body with an invalid check interval
      req.body = {
        checkIntervalMinutes: -1
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Check interval must be a positive number.');
      
      // Verify the appConfig was not updated
      expect(appConfig.checkIntervalMinutes).to.not.equal(-1);
    });
  });
  
  describe('Unsupported Methods', () => {
    it('should return 405 for unsupported methods', async () => {
      // Setup the request with an unsupported method
      req.method = 'PUT';
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(405);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Method not allowed');
    });
  });
});
