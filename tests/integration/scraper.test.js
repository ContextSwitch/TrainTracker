// Integration test for the scraper
import { expect } from 'chai';
import { scrapeTrainStatus } from '../../app/utils/scraper.js';

describe('Scraper Integration Tests', () => {
  it('should scrape train status for train #3', async function() {
    // This test may take some time to run
    this.timeout(10000);
    
    const train3Status = await scrapeTrainStatus('https://dixielandsoftware.net', '3');
    
    // Basic validation of the response structure
    expect(train3Status).to.be.an('array');
    if (train3Status.length > 0) {
      expect(train3Status[0]).to.have.property('trainId', '3');
      expect(train3Status[0]).to.have.property('direction', 'westbound');
      expect(train3Status[0]).to.have.property('lastUpdated');
      expect(train3Status[0]).to.have.property('nextStation');
    }
  });
  
  it('should scrape train status for train #4', async function() {
    // This test may take some time to run
    this.timeout(10000);
    
    const train4Status = await scrapeTrainStatus('https://dixielandsoftware.net', '4');
    
    // Basic validation of the response structure
    expect(train4Status).to.be.an('array');
    if (train4Status.length > 0) {
      expect(train4Status[0]).to.have.property('trainId', '4');
      expect(train4Status[0]).to.have.property('direction', 'eastbound');
      expect(train4Status[0]).to.have.property('lastUpdated');
      expect(train4Status[0]).to.have.property('nextStation');
    }
  });
});
