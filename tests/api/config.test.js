import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/admin/config';
import { appConfig } from '../../app/config';
import * as chai from 'chai';
import * as sinon from 'sinon';

const { expect } = chai;

// Mock the auth-client module
jest.mock('../../app/utils/auth-client', () => ({
  verifyToken: jest.fn(() => ({ username: 'admin' })),
}));

describe('Config API', () => {
  let req, res;
  
  beforeEach(() => {
    // Save the original config
    this.originalConfig = { ...appConfig };
    
    // Create mock request and response objects
    const mocks = createMocks({
      method: 'GET',
      headers: {
        'x-admin-auth': 'true'
      }
    });
    
    req = mocks.req;
    res = mocks.res;
  });
  
  afterEach(() => {
    // Restore the original config
    Object.assign(appConfig, this.originalConfig);
    
    // Clean up mocks
    jest.resetAllMocks();
  });
  
  it('should return the current configuration on GET request', async () => {
    // Set a known config value for testing
    appConfig.scraperType = 'dixieland';
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.true;
    expect(data.config).to.deep.include({
      scraperType: 'dixieland'
    });
  });
  
  it('should update the configuration on POST request', async () => {
    // Set up the request
    req.method = 'POST';
    req.body = {
      scraperType: 'transitdocs'
    };
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.true;
    expect(data.config).to.deep.include({
      scraperType: 'transitdocs'
    });
    
    // Check that the config was updated
    expect(appConfig.scraperType).to.equal('transitdocs');
  });
  
  it('should reject invalid scraper types', async () => {
    // Set up the request
    req.method = 'POST';
    req.body = {
      scraperType: 'invalid'
    };
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(400);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.false;
    expect(data.error).to.include('Invalid scraper type');
    
    // Check that the config was not updated
    expect(appConfig.scraperType).to.equal(this.originalConfig.scraperType);
  });
  
  it('should update notifications setting', async () => {
    // Set up the request
    req.method = 'POST';
    req.body = {
      notificationsEnabled: true
    };
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.true;
    expect(data.config).to.deep.include({
      notificationsEnabled: true
    });
    
    // Check that the config was updated
    expect(appConfig.notificationsEnabled).to.be.true;
  });
  
  it('should update multiple settings at once', async () => {
    // Set up the request
    req.method = 'POST';
    req.body = {
      scraperType: 'transitdocs',
      notificationsEnabled: true,
      checkIntervalMinutes: 30
    };
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(200);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.true;
    expect(data.config).to.deep.include({
      scraperType: 'transitdocs',
      notificationsEnabled: true,
      checkIntervalMinutes: 30
    });
    
    // Check that the config was updated
    expect(appConfig.scraperType).to.equal('transitdocs');
    expect(appConfig.notificationsEnabled).to.be.true;
    expect(appConfig.checkIntervalMinutes).to.equal(30);
  });
  
  it('should reject invalid check interval', async () => {
    // Set up the request
    req.method = 'POST';
    req.body = {
      checkIntervalMinutes: -1
    };
    
    // Call the handler
    await handler(req, res);
    
    // Check the response
    expect(res._getStatusCode()).to.equal(400);
    
    const data = JSON.parse(res._getData());
    expect(data.success).to.be.false;
    expect(data.error).to.include('Check interval must be a positive number');
    
    // Check that the config was not updated
    expect(appConfig.checkIntervalMinutes).to.equal(this.originalConfig.checkIntervalMinutes);
  });
});
