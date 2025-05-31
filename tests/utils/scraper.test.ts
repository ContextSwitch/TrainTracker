import * as chai from 'chai';
import * as sinon from 'sinon';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import * as transitdocsScraper from '../../app/utils/transitdocs-scraper';
import * as appConfig from '../../app/config';

const { expect } = chai;

describe('Scraper Utility Tests', () => {
  // Create stub for the TransitDocs scraper
  const transitdocsStub = sinon.stub(transitdocsScraper, 'scrapeTransitDocsTrainStatus');
  
  // Create a stub for console.log and console.error to avoid cluttering test output
  const consoleLogStub = sinon.stub(console, 'log');
  const consoleErrorStub = sinon.stub(console, 'error');
  
  // Create a mock for the appConfig
  let configStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Reset all stubs before each test
    transitdocsStub.reset();
    consoleLogStub.reset();
    consoleErrorStub.reset();
    
    // Setup default mock response
    transitdocsStub.resolves([{
      trainId: '3',
      direction: 'westbound',
      lastUpdated: new Date().toISOString(),
      nextStation: 'Galesburg, IL',
      status: 'On Time',
      instanceId: Date.now(),
      isNext: true
    }]);
    
    // Setup config stub
    if (configStub) {
      configStub.restore();
    }
    configStub = sinon.stub(appConfig, 'appConfig').value({
      scraperType: 'transitdocs',
      checkIntervalMinutes: 60,
      approachWindowMinutes: 30,
      postArrivalWindowMinutes: 30,
      notificationsEnabled: false,
      stations: [],
      trainUrls: {
        '3': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=3',
        '4': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=4'
      }
    });
  });
  
  afterEach(() => {
    // Restore original methods after each test
    sinon.restore();
  });
  
  it('should use the TransitDocs scraper', async () => {
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the TransitDocs scraper was called
    expect(transitdocsStub.calledOnce).to.be.true;
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    expect(result[0].trainId).to.equal('3');
  });
  
  it('should handle errors from the TransitDocs scraper', async () => {
    // Setup the TransitDocs scraper to throw an error
    transitdocsStub.rejects(new Error('Scraper error'));
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the TransitDocs scraper was called
    expect(transitdocsStub.calledOnce).to.be.true;
    
    // Verify the result is an empty array
    expect(result).to.be.an('array');
    expect(result.length).to.equal(0);
    
    // Verify the error was logged
    expect(consoleErrorStub.calledOnce).to.be.true;
  });
});
