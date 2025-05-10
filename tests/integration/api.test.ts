import axios from 'axios';
import { expect } from 'chai';

// Get the API URL from environment variable or use localhost
const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('API Integration Tests', () => {
  describe('GET /api/status', () => {
    it('should return current train status data', async () => {
      const response = await axios.get(`${API_URL}/api/status`);
      
      // Check response status
      expect(response.status).to.equal(200);
      
      // Check response structure
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('train3');
      expect(response.data).to.have.property('train4');
      expect(response.data).to.have.property('lastUpdated');
      
      // Check train3 data structure
      expect(response.data.train3).to.be.an('object');
      expect(response.data.train3).to.have.property('approaching');
      
      // Check train4 data structure
      expect(response.data.train4).to.be.an('object');
      expect(response.data.train4).to.have.property('approaching');
    });
  });
  
  describe('GET /api/stations', () => {
    it('should return station data for a specific train', async () => {
      const response = await axios.get(`${API_URL}/api/stations?trainId=3`);
      
      // Check response status
      expect(response.status).to.equal(200);
      
      // Check response structure
      expect(response.data).to.be.an('array');
      
      // If there are stations, check their structure
      if (response.data.length > 0) {
        const station = response.data[0];
        expect(station).to.have.property('name');
        expect(station).to.have.property('youtubeLink');
      }
    });
    
    it('should return 400 if trainId is missing', async () => {
      try {
        await axios.get(`${API_URL}/api/stations`);
        // Should not reach here
        expect.fail('Expected request to fail with 400');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
      }
    });
  });
  
  describe('GET /api/select-view', () => {
    it('should return view data for a specific train', async () => {
      const response = await axios.get(`${API_URL}/api/select-view?trainId=3`);
      
      // Check response status
      expect(response.status).to.equal(200);
      
      // Check response structure
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('trainId');
      expect(response.data).to.have.property('status');
    });
    
    it('should return 400 if trainId is missing', async () => {
      try {
        await axios.get(`${API_URL}/api/select-view`);
        // Should not reach here
        expect.fail('Expected request to fail with 400');
      } catch (error: any) {
        expect(error.response.status).to.equal(400);
      }
    });
  });
  
  describe('GET /api/scrape', () => {
    it('should trigger scraping and return updated data', async () => {
      const response = await axios.get(`${API_URL}/api/scrape`);
      
      // Check response status
      expect(response.status).to.equal(200);
      
      // Check response structure
      expect(response.data).to.be.an('object');
      expect(response.data).to.have.property('success');
      expect(response.data.success).to.be.true;
    });
  });
});
