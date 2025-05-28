import * as chai from 'chai';
import * as sinon from 'sinon';
import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/test-scraper-flag';
import * as authClient from '../../app/utils/auth-client';
import * as dixielandScraper from '../../app/utils/dixieland-scraper';
import * as transitdocsScraper from '../../app/utils/transitdocs-scraper';
import { mockTrainStatus3, mockTrainStatus4Fort } from '../mocks/mockData';
import { AdminUser } from '../../app/utils/auth-client';

const { expect } = chai;

describe('Test Scraper Flag API Tests', () => {
  // Create stubs for the auth client and scrapers
  const verifyTokenStub = sinon.stub(authClient, 'verifyToken');
  const dixielandScraperStub = sinon.stub(dixielandScraper, 'scrapeDixielandTrainStatus');
  const transitdocsScraperStub = sinon.stub(transitdocsScraper, 'scrapeTransitDocsTrainStatus');
  
  // Create mock request and response objects
  let req: any;
  let res: any;
  
  beforeEach(() => {
    // Reset all stubs
    verifyTokenStub.reset();
    dixielandScraperStub.reset();
    transitdocsScraperStub.reset();
    
    // Setup mock request and response
    const { req: mockReq, res: mockRes } = createMocks({
      method: 'POST',
      cookies: {
        admin_token: 'valid-token'
      },
      headers: {},
      body: {
        scraperType: 'dixieland'
      }
    });
    
    req = mockReq;
    res = mockRes;
    
    // Setup default auth behavior
    verifyTokenStub.returns({ username: 'admin', role: 'admin' } as AdminUser);
    
    // Setup default scraper behavior
    dixielandScraperStub.withArgs('3').resolves(mockTrainStatus3);
    dixielandScraperStub.withArgs('4').resolves(mockTrainStatus4Fort);
    transitdocsScraperStub.withArgs('3').resolves([mockTrainStatus3]);
    transitdocsScraperStub.withArgs('4').resolves([mockTrainStatus4Fort]);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('POST /api/test-scraper-flag', () => {
    it('should test the dixieland scraper', async () => {
      // Setup the request body
      req.body = {
        scraperType: 'dixieland'
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(200);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.true;
      expect(data.scraperType).to.equal('dixieland');
      expect(data.data).to.exist;
      expect(data.data.train3).to.exist;
      expect(data.data.train4).to.exist;
      
      // Verify the dixieland scraper was called
      expect(dixielandScraperStub.calledTwice).to.be.true;
      expect(transitdocsScraperStub.called).to.be.false;
    });
    
    it('should test the transitdocs scraper', async () => {
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
      expect(data.scraperType).to.equal('transitdocs');
      expect(data.data).to.exist;
      expect(data.data.train3).to.exist;
      expect(data.data.train4).to.exist;
      
      // Verify the transitdocs scraper was called
      expect(transitdocsScraperStub.calledTwice).to.be.true;
      expect(dixielandScraperStub.called).to.be.false;
    });
    
    it('should return 400 if the scraper type is missing', async () => {
      // Setup the request body with no scraper type
      req.body = {};
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(400);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.equal('Missing scraper type');
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
    
    it('should handle scraper errors gracefully', async () => {
      // Setup the request body
      req.body = {
        scraperType: 'dixieland'
      };
      
      // Setup the dixieland scraper to throw an error
      dixielandScraperStub.withArgs('3').rejects(new Error('Scraper error'));
      
      // Call the handler
      await handler(req, res);
      
      // Verify the response
      expect(res._getStatusCode()).to.equal(500);
      
      const data = JSON.parse(res._getData());
      expect(data.success).to.be.false;
      expect(data.error).to.include('Error testing scraper');
    });
  });
  
  describe('Unsupported Methods', () => {
    it('should return 405 for GET requests', async () => {
      // Setup the request with GET method
      req.method = 'GET';
      
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
