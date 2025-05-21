import axios from 'axios';
import cheerio from 'cheerio';
import { TrainStatus } from '../types';

/**
 * Generates the URL for dixielandsoftware.net
 * @param trainId The train ID ('3' or '4')
 * @param date The date to use for the URL
 * @returns The URL for the train status page
 */
export function generateDixielandUrl(trainId: string, date: Date): string {
  // Format the date components with leading zeros if needed
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=${trainId}&selyear=${year}&selmonth=${month}&selday=${day}`;
}

/**
 * Parses the HTML from dixielandsoftware.net to find the next station
 * @param html The HTML content to parse
 * @returns Information about the next station
 */
export function parseDixielandHtml(html: string): { 
  nextStationCode: string; 
  nextStationName: string; 
  scheduledArrivalTime: string;
} | null {
  try {
    // Load the HTML into cheerio
    const $ = cheerio.load(html);
    
    // Find the div with id="m1" which contains the stop information
    const stopInfoDiv = $('#m1');
    if (!stopInfoDiv.length) {
      console.error('No stop information found');
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
      nextStationCode,
      nextStationName,
      scheduledArrivalTime
    };
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return null;
  }
}

/**
 * Scrapes train status data from dixielandsoftware.net
 * @param trainId The train ID ('3' or '4')
 * @param date The date to use for the URL
 * @returns Promise with train status data
 */
export async function scrapeDixielandTrainStatus(trainId: string, date: Date = new Date()): Promise<TrainStatus | null> {
  try {
    // Generate the URL
    const url = generateDixielandUrl(trainId, date);
    
    // Fetch the HTML
    const response = await axios.get(url);
    const html = JSON.stringify(response.data);
    
    // Parse the HTML
    const stationInfo = parseDixielandHtml(html);
    
    if (!stationInfo) {
      return null;
    }
    
    // Create a train status object
    const trainStatus: TrainStatus = {
      trainId,
      direction: trainId === '3' ? 'westbound' : 'eastbound',
      lastUpdated: new Date().toISOString(),
      nextStation: stationInfo.nextStationName,
      status: 'On time',
      instanceId: 1,
      isNext: true
    };
    
    return trainStatus;
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    return null;
  }
}
