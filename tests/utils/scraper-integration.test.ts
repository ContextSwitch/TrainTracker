import * as chai from 'chai';
import * as sinon from 'sinon';
import * as axios from 'axios';

const { expect } = chai;
import { scrapeTrainStatus } from '../../app/utils/scraper.js';
import { scrapeAmtrakTrainStatus } from '../../app/utils/amtrak-scraper.js';
import { loadSampleHTML } from '../test-helpers.js';
import { TrainStatus } from '../../app/types/index.js';

describe('Scraper Integration Tests', () => {
  let axiosGetStub: sinon.SinonStub;
  let scrapeAmtrakStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Stub axios to prevent actual network requests
    axiosGetStub = sinon.stub(axios, 'get');
    
    // Stub the Amtrak scraper function
    scrapeAmtrakStub = sinon.stub(require('../../app/utils/amtrak-scraper.js'), 'scrapeAmtrakTrainStatus');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('scrapeTrainStatus', () => {
    it('should successfully scrape train #3 status', async () => {
      // Setup mock response for train #3
      const mockTrain3Status: TrainStatus[] = [{
        trainId: '3',
        direction: 'westbound',
        lastUpdated: new Date().toISOString(),
        nextStation: 'Gallup',
        estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        status: 'On time',
        instanceId: 1,
        isNext: true,
        currentLocation: 'Between Albuquerque and Gallup',
        timezone: 'MDT'
      }];
      
      // Setup the Amtrak scraper stub to return mock data
      scrapeAmtrakStub.withArgs('3').resolves(mockTrain3Status);
      
      const result = await scrapeTrainStatus('https://www.amtrak.com/track-your-train.html', '3');
      
      expect(scrapeAmtrakStub.calledOnceWith('3')).to.be.true;
      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0].trainId).to.equal('3');
      expect(result[0].direction).to.equal('westbound');
      expect(result[0].nextStation).to.equal('Gallup');
    });
    
    it('should successfully scrape train #4 status', async () => {
      // Setup mock response for train #4
      const mockTrain4Status: TrainStatus[] = [{
        trainId: '4',
        direction: 'eastbound',
        lastUpdated: new Date().toISOString(),
        nextStation: 'Albuquerque',
        estimatedArrival: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        status: 'Delayed 25 min',
        delayMinutes: 25,
        instanceId: 1,
        isNext: true,
        currentLocation: 'Between Gallup and Albuquerque',
        timezone: 'MDT'
      }];
      
      // Setup the Amtrak scraper stub to return mock data
      scrapeAmtrakStub.withArgs('4').resolves(mockTrain4Status);
      
      const result = await scrapeTrainStatus('https://www.amtrak.com/track-your-train.html', '4');
      
      expect(scrapeAmtrakStub.calledOnceWith('4')).to.be.true;
      expect(result).to.be.an('array');
      expect(result.length).to.equal(1);
      expect(result[0].trainId).to.equal('4');
      expect(result[0].direction).to.equal('eastbound');
      expect(result[0].nextStation).to.equal('Albuquerque');
      expect(result[0].status).to.include('Delayed');
      expect(result[0].delayMinutes).to.equal(25);
    });
    
    it('should handle multiple train instances', async () => {
      // Setup mock response for multiple train #3 instances
      const mockTrain3Status: TrainStatus[] = [
        {
          trainId: '3',
          direction: 'westbound',
          lastUpdated: new Date().toISOString(),
          nextStation: 'Gallup',
          estimatedArrival: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          status: 'On time',
          instanceId: 1,
          isNext: true,
          currentLocation: 'Between Albuquerque and Gallup',
          timezone: 'MDT'
        },
        {
          trainId: '3',
          direction: 'westbound',
          lastUpdated: new Date().toISOString(),
          nextStation: 'Mendota',
          estimatedArrival: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
          status: 'Delayed 15 min',
          delayMinutes: 15,
          instanceId: 2,
          isNext: true,
          currentLocation: 'Between Chicago and Mendota',
          timezone: 'CDT'
        }
      ];
      
      // Setup the Amtrak scraper stub to return mock data
      scrapeAmtrakStub.withArgs('3').resolves(mockTrain3Status);
      
      const result = await scrapeTrainStatus('https://www.amtrak.com/track-your-train.html', '3');
      
      expect(scrapeAmtrakStub.calledOnceWith('3')).to.be.true;
      expect(result).to.be.an('array');
      expect(result.length).to.equal(2);
      expect(result[0].instanceId).to.equal(1);
      expect(result[1].instanceId).to.equal(2);
    });
    
    it('should return empty array when scraping fails', async () => {
      // Setup the Amtrak scraper stub to throw an error
      scrapeAmtrakStub.withArgs('3').rejects(new Error('Scraping failed'));
      
      const result = await scrapeTrainStatus('https://www.amtrak.com/track-your-train.html', '3');
      
      expect(scrapeAmtrakStub.calledOnceWith('3')).to.be.true;
      expect(result).to.be.an('array').that.is.empty;
    });
  });
});
