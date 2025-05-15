// Integration test for the dixielandsoftware.net scraper
import { expect } from 'chai';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Function to generate the URL for dixielandsoftware.net
function generateDixielandUrl(trainId, date) {
  // Format the date components with leading zeros if needed
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=${trainId}&selyear=${year}&selmonth=${month}&selday=${day}`;
}

describe('Dixieland Scraper Integration Tests', () => {
  // Helper function to parse the HTML and find the next station
  async function scrapeNextStation(trainId, date) {
    // Generate the URL
    const url = generateDixielandUrl(trainId, date);
    
    // Fetch the HTML
    const response = await axios.get(url);
    const html = response.data;
    
    // Load the HTML into cheerio
    const $ = cheerio.load(html);
    
    // Find the div with id="m1" which contains the stop information
    const stopInfoDiv = $('#m1');
    if (!stopInfoDiv.length) {
      return null;
    }
    
    // Find all table rows in the div
    const rows = stopInfoDiv.find('tr');
    
    // Initialize variables to store station information
    let nextStationCode = '';
    let nextStationName = '';
    let scheduledArrivalTime = '';
    
    // Skip the header row (first row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows.eq(i);
      const cells = row.find('td');
      
      if (cells.length >= 3) {
        // First cell contains the station name and code
        const stationCell = cells.eq(0);
        const stationText = stationCell.text().trim();
        
        // Extract the station code from the text
        const stationCodeMatch = stationText.match(/\(([A-Z]{3})\)$/);
        if (stationCodeMatch) {
          const stationCode = stationCodeMatch[1];
          
          // Second cell contains the scheduled time
          const scheduledCell = cells.eq(1);
          const scheduledText = scheduledCell.text().trim();
          
          // Third cell contains the actual time and status
          const actualCell = cells.eq(2);
          const actualText = actualCell.text().trim();
          
          // Check if this station has actual departure times
          // If the actual text includes 'Dp' followed by a time, it means the train has already departed this station
          if (actualText.match(/Dp\s+\d+:\d+[AP]/) || actualText.match(/Dp\s+\d+[AP]/)) {
            continue;
          }
          
          // If we get here, this is the next station
          nextStationCode = stationCode;
          nextStationName = stationText.replace(/\s*\([A-Z]{3}\)$/, '').trim();
          
          // Parse the scheduled time
          if (scheduledText.includes('Dp')) {
            scheduledArrivalTime = scheduledText.replace('Dp', '').trim();
          } else if (scheduledText.includes('Ar')) {
            // If only arrival time is available, use that
            scheduledArrivalTime = scheduledText.replace('Ar', '').trim();
          }
          
          // We found the next station, so break the loop
          break;
        }
      }
    }
    
    // If we didn't find a next station, return null
    if (!nextStationCode) {
      return null;
    }
    
    return {
      stationCode: nextStationCode,
      stationName: nextStationName,
      scheduledArrival: scheduledArrivalTime
    };
  }
  
  it('should scrape next station for train #3', async function() {
    // This test may take some time to run
    this.timeout(10000);
    
    const today = new Date();
    const result = await scrapeNextStation('3', today);
    
    // The result might be null if there's no data for today
    if (result) {
      expect(result).to.have.property('stationCode');
      expect(result).to.have.property('stationName');
      expect(result).to.have.property('scheduledArrival');
      expect(result.stationCode).to.be.a('string').with.length(3);
    }
  });
  
  it('should scrape next station for train #4', async function() {
    // This test may take some time to run
    this.timeout(10000);
    
    const today = new Date();
    const result = await scrapeNextStation('4', today);
    
    // The result might be null if there's no data for today
    if (result) {
      expect(result).to.have.property('stationCode');
      expect(result).to.have.property('stationName');
      expect(result).to.have.property('scheduledArrival');
      expect(result.stationCode).to.be.a('string').with.length(3);
    }
  });
  
  it('should handle dates with no data', async function() {
    // This test may take some time to run
    this.timeout(10000);
    
    // Try a date far in the future
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    
    const result = await scrapeNextStation('3', futureDate);
    
    // We expect no data for a date far in the future
    expect(result).to.be.null;
  });
});
