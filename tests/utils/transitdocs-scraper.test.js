import { scrapeTransitDocsTrainStatus } from '../../app/utils/transitdocs-scraper';
import * as chai from 'chai';
import * as sinon from 'sinon';

const { expect } = chai;

describe('TransitDocs Scraper', () => {
  let fetchStub;
  
  beforeEach(() => {
    // Create a stub for the global fetch function
    fetchStub = sinon.stub(global, 'fetch');
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  it('should scrape train status data for train #3', async () => {
    // Mock response data
    const mockResponseData = {
      points: [
        { lat: 35.123, lon: -105.456 }
      ],
      stations: [
        {
          name: 'Chicago, IL',
          dep_timestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        },
        {
          name: 'Galesburg, IL',
          arr_timestamp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        }
      ],
      status: 'active',
      delay_minutes: 15
    };
    
    // Configure the fetch stub to return the mock data
    fetchStub.resolves({
      ok: true,
      json: async () => mockResponseData
    });
    
    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('3');
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    
    const trainStatus = result[0];
    expect(trainStatus.trainId).to.equal('3');
    expect(trainStatus.currentLocation).to.equal('Chicago, IL');
    expect(trainStatus.nextStation).to.equal('Galesburg, IL');
    expect(trainStatus.status).to.equal('On Time');
    expect(trainStatus.direction).to.equal('westbound');
    expect(trainStatus.delayMinutes).to.equal(15);
    expect(trainStatus.isNext).to.be.true;
  });
  
  it('should scrape train status data for train #4', async () => {
    // Mock response data
    const mockResponseData = {
      points: [
        { lat: 35.123, lon: -105.456 }
      ],
      stations: [
        {
          name: 'Los Angeles, CA',
          dep_timestamp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        },
        {
          name: 'Flagstaff, AZ',
          arr_timestamp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        }
      ],
      status: 'delayed',
      delay_minutes: 30
    };
    
    // Configure the fetch stub to return the mock data
    fetchStub.resolves({
      ok: true,
      json: async () => mockResponseData
    });
    
    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('4');
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    
    const trainStatus = result[0];
    expect(trainStatus.trainId).to.equal('4');
    expect(trainStatus.currentLocation).to.equal('Los Angeles, CA');
    expect(trainStatus.nextStation).to.equal('Flagstaff, AZ');
    expect(trainStatus.status).to.equal('Delayed');
    expect(trainStatus.direction).to.equal('eastbound');
    expect(trainStatus.delayMinutes).to.equal(30);
    expect(trainStatus.isNext).to.be.true;
  });
  
  it('should handle API errors gracefully', async () => {
    // Configure the fetch stub to throw an error
    fetchStub.rejects(new Error('Network error'));
    
    // Call the scraper function and expect it to throw
    try {
      await scrapeTransitDocsTrainStatus('3');
      // If we get here, the function didn't throw as expected
      expect.fail('Expected function to throw');
    } catch (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.equal('Network error');
    }
  });
  
  it('should handle invalid API responses', async () => {
    // Configure the fetch stub to return an invalid response
    fetchStub.resolves({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    // Call the scraper function and expect it to throw
    try {
      await scrapeTransitDocsTrainStatus('3');
      // If we get here, the function didn't throw as expected
      expect.fail('Expected function to throw');
    } catch (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.include('404');
    }
  });
  
  it('should handle missing data in API response', async () => {
    // Configure the fetch stub to return a response with missing data
    fetchStub.resolves({
      ok: true,
      json: async () => ({})
    });
    
    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('3');
    
    // Verify the result is an empty array
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(0);
  });
});
