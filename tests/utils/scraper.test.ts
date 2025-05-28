import * as chai from 'chai';
import * as sinon from 'sinon';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import * as dixielandScraper from '../../app/utils/dixieland-scraper';
import * as transitdocsScraper from '../../app/utils/transitdocs-scraper';
import * as appConfig from '../../app/config';

const { expect } = chai;

describe('Scraper Utility Tests', () => {
  // Create stubs for the scrapers
  const dixielandStub = sinon.stub(dixielandScraper, 'scrapeDixielandTrainStatus');
  const transitdocsStub = sinon.stub(transitdocsScraper, 'scrapeTransitDocsTrainStatus');
  
  // Create a stub for console.log and console.error to avoid cluttering test output
  const consoleLogStub = sinon.stub(console, 'log');
  const consoleErrorStub = sinon.stub(console, 'error');
  
  // Create a mock for the appConfig
  let configStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Reset all stubs before each test
    dixielandStub.reset();
    transitdocsStub.reset();
    consoleLogStub.reset();
    consoleErrorStub.reset();
    
    // Setup default mock responses
    dixielandStub.resolves({
      trainId: '3',
      direction: 'westbound',
      lastUpdated: new Date().toISOString(),
      nextStation: 'Galesburg, IL',
      status: 'On time',
      instanceId: 1,
      isNext: true
    });
    
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
      scraperType: 'dixieland',
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
  
  it('should use the Dixieland scraper when scraperType is set to dixieland', async () => {
    // Set the config to use dixieland scraper
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'dixieland'
    });
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the Dixieland scraper was called
    expect(dixielandStub.calledOnce).to.be.true;
    expect(transitdocsStub.called).to.be.false;
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    expect(result[0].trainId).to.equal('3');
  });
  
  it('should use the TransitDocs scraper when scraperType is set to transitdocs', async () => {
    // Set the config to use transitdocs scraper
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'transitdocs'
    });
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the TransitDocs scraper was called
    expect(transitdocsStub.calledOnce).to.be.true;
    expect(dixielandStub.called).to.be.false;
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    expect(result[0].trainId).to.equal('3');
  });
  
  it('should default to the Dixieland scraper when scraperType is invalid', async () => {
    // Set the config to use an invalid scraper type
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'invalid' as any
    });
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the Dixieland scraper was called
    expect(dixielandStub.calledOnce).to.be.true;
    expect(transitdocsStub.called).to.be.false;
    
    // Verify the result
    expect(result).to.be.an('array');
    expect(result.length).to.equal(1);
    expect(result[0].trainId).to.equal('3');
  });
  
  it('should handle errors from the Dixieland scraper', async () => {
    // Set the config to use dixieland scraper
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'dixieland'
    });
    
    // Setup the Dixieland scraper to throw an error
    dixielandStub.rejects(new Error('Scraper error'));
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the Dixieland scraper was called
    expect(dixielandStub.calledOnce).to.be.true;
    
    // Verify the result is an empty array
    expect(result).to.be.an('array');
    expect(result.length).to.equal(0);
    
    // Verify the error was logged
    expect(consoleErrorStub.calledOnce).to.be.true;
  });
  
  it('should handle errors from the TransitDocs scraper', async () => {
    // Set the config to use transitdocs scraper
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'transitdocs'
    });
    
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
  
  it('should handle null result from the Dixieland scraper', async () => {
    // Set the config to use dixieland scraper
    configStub.value({
      ...appConfig.appConfig,
      scraperType: 'dixieland'
    });
    
    // Setup the Dixieland scraper to return null
    dixielandStub.resolves(null);
    
    // Call the scraper function
    const result = await scrapeTrainStatus('', '3');
    
    // Verify the Dixieland scraper was called
    expect(dixielandStub.calledOnce).to.be.true;
    
    // Verify the result is an empty array
    expect(result).to.be.an('array');
    expect(result.length).to.equal(0);
  });
});
