import * as chai from 'chai';
import * as sinon from 'sinon';
import { scrapeTransitDocsTrainStatus } from '../../app/utils/transitdocs-scraper';
import { TrainStatus } from '../../app/types';

const { expect } = chai;

// Mock the global fetch function
const mockFetch = sinon.stub(global, 'fetch');

// Mock console methods to avoid cluttering test output
const consoleLogStub = sinon.stub(console, 'log');
const consoleErrorStub = sinon.stub(console, 'error');

describe('TransitDocs Scraper', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFetch.reset();
    consoleLogStub.reset();
    consoleErrorStub.reset();
  });

  afterEach(() => {
    // Restore original methods after all tests
    sinon.restore();
  });

  it('should fetch and process data from the TransitDocs API for train #3', async () => {
    // Mock API response for train #3
    const mockApiResponse = {
      id: '3',
      status: 'active',
      delay_minutes: 15,
      points: [
        { lat: 41.8781, lon: -87.6298, timestamp: Math.floor(Date.now() / 1000) - 3600 } // 1 hour ago
      ],
      stations: [
        {
          name: 'Chicago, IL',
          code: 'CHI',
          lat: 41.8781,
          lon: -87.6298,
          dep_timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          dep_delay: 15
        },
        {
          name: 'Galesburg, IL',
          code: 'GBB',
          lat: 40.9478,
          lon: -90.3712,
          arr_timestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          arr_delay: 15
        },
        {
          name: 'Los Angeles, CA',
          code: 'LAX',
          lat: 34.0522,
          lon: -118.2437,
          arr_timestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
          arr_delay: 0
        }
      ]
    };

    // Setup mock fetch to return the mock API response
    mockFetch.resolves({
      ok: true,
      json: async () => mockApiResponse
    } as Response);

    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('3');

    // Verify fetch was called with the correct URL
    expect(mockFetch.calledOnce).to.be.true;
    expect(mockFetch.firstCall.args[0]).to.contain('https://asm-backend.transitdocs.com/train/');
    expect(mockFetch.firstCall.args[0]).to.contain('/AMTRAK/3?points=true');

    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    
    const trainStatus = result[0];
    expect(trainStatus.trainId).to.equal('3');
    expect(trainStatus.currentLocation).to.equal('Chicago, IL');
    expect(trainStatus.nextStation).to.equal('Galesburg, IL');
    expect(trainStatus.status).to.equal('On Time');
    expect(trainStatus.delayMinutes).to.equal(15);
    expect(trainStatus.direction).to.equal('westbound');
    expect(trainStatus.isNext).to.equal(true);
  });

  it('should fetch and process data from the TransitDocs API for train #4', async () => {
    // Mock API response for train #4
    const mockApiResponse = {
      id: '4',
      status: 'delayed',
      delay_minutes: 30,
      points: [
        { lat: 34.0522, lon: -118.2437, timestamp: Math.floor(Date.now() / 1000) - 3600 } // 1 hour ago
      ],
      stations: [
        {
          name: 'Los Angeles, CA',
          code: 'LAX',
          lat: 34.0522,
          lon: -118.2437,
          dep_timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
          dep_delay: 30
        },
        {
          name: 'Flagstaff, AZ',
          code: 'FLG',
          lat: 35.1983,
          lon: -111.6513,
          arr_timestamp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          arr_delay: 30
        },
        {
          name: 'Chicago, IL',
          code: 'CHI',
          lat: 41.8781,
          lon: -87.6298,
          arr_timestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
          arr_delay: 0
        }
      ]
    };

    // Setup mock fetch to return the mock API response
    mockFetch.resolves({
      ok: true,
      json: async () => mockApiResponse
    } as Response);

    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('4');

    // Verify fetch was called with the correct URL
    expect(mockFetch.calledOnce).to.be.true;
    expect(mockFetch.firstCall.args[0]).to.contain('https://asm-backend.transitdocs.com/train/');
    expect(mockFetch.firstCall.args[0]).to.contain('/AMTRAK/4?points=true');

    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    
    const trainStatus = result[0];
    expect(trainStatus.trainId).to.equal('4');
    expect(trainStatus.currentLocation).to.equal('Los Angeles, CA');
    expect(trainStatus.nextStation).to.equal('Flagstaff, AZ');
    expect(trainStatus.status).to.equal('Delayed');
    expect(trainStatus.delayMinutes).to.equal(30);
    expect(trainStatus.direction).to.equal('eastbound');
    expect(trainStatus.isNext).to.equal(true);
  });

  it('should handle API errors gracefully', async () => {
    // Setup mock fetch to throw an error
    mockFetch.rejects(new Error('Network error'));

    // Call the scraper function and expect it to throw
    try {
      await scrapeTransitDocsTrainStatus('3');
      // If we get here, the test should fail
      expect.fail('Expected function to throw');
    } catch (error: any) {
      expect(error.message).to.equal('Network error');
    }
  });

  it('should handle invalid API responses gracefully', async () => {
    // Setup mock fetch to return an invalid response
    mockFetch.resolves({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    } as Response);

    // Call the scraper function and expect it to throw
    try {
      await scrapeTransitDocsTrainStatus('3');
      // If we get here, the test should fail
      expect.fail('Expected function to throw');
    } catch (error: any) {
      expect(error.message).to.equal('TransitDocs API returned status 404: Not Found');
    }
  });

  it('should create mock data when API response is incomplete', async () => {
    // Setup mock fetch to return an incomplete response
    mockFetch.resolves({
      ok: true,
      json: async () => ({
        id: '3',
        status: 'active'
        // Missing points and stations
      })
    } as Response);

    // Call the scraper function
    const result = await scrapeTransitDocsTrainStatus('3');

    // Verify the result is mock data
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    
    const trainStatus = result[0];
    expect(trainStatus.trainId).to.equal('3');
    expect(trainStatus.currentLocation).to.equal('Chicago, IL');
    expect(trainStatus.nextStation).to.equal('Galesburg, IL');
    expect(trainStatus.status).to.equal('On Time');
    expect(trainStatus.direction).to.equal('westbound');
    expect(trainStatus.isNext).to.equal(true);
  });
});
