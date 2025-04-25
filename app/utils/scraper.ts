import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrainStatus } from '../types';
import { getStationByName } from '../config';

/**
 * Scrapes train status data from railrat.net
 * @param url The URL of the train status page
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances of this train
 */
export async function scrapeTrainStatus(url: string, trainId: string): Promise<TrainStatus[]> {
  try {
    // Fetch the HTML content from railrat.net
    const response = await axios.get(url);
    const html = response.data as string;
    
    // Load the HTML into cheerio
    const $ = cheerio.load(html);
    
    // Initialize train status array
    const trainStatuses: TrainStatus[] = [];
    const lastUpdated = new Date().toISOString();
    const direction = trainId === '3' ? 'westbound' : 'eastbound';
    
    // Extract the latest status update time
    let updatedLastUpdated = lastUpdated;
    const statusUpdateText = $('body').text().match(/Latest status for Amtrak Southwest Chief Train \d, updated ([\d:]+) on (\d+\/\d+)/);
    if (statusUpdateText && statusUpdateText.length >= 3) {
      const time = statusUpdateText[1];
      const date = statusUpdateText[2];
      updatedLastUpdated = new Date(`${date}/2025 ${time}`).toISOString();
    }
    
    // Find all stations with estimated arrivals
    // We need to find all stations in the list that have "est. arrival" in their text
    const stationEntries: {
      stationCode: string;
      stationName: string;
      arrivalTime: string;
      arrivalDate: Date;
      delayText: string;
      currentLocation?: string;
    }[] = [];
    
    // Extract all station entries with arrival times
    $('li').each((i, el) => {
      const text = $(el).text();
      if (text.includes('est. arrival')) {
        // Parse the station information
        // Format: "GLP, est. arrival 21:44, 3 hr. 30 min. late, est. departure 21:45, 3 hr. 31 min. late (Gallup)."
        const match = text.match(/([A-Z]{3}).*est\. arrival (\d+:\d+).*?(\d+ hr\. \d+ min\. late)?.*?\((.*?)\)/);
        if (match && match.length >= 5) {
          const stationCode = match[1];
          const arrivalTime = match[2];
          const delayText = match[3] || '';
          const stationName = match[4];
          
          // Parse the estimated arrival time
          // railrat.net uses Mountain Time (MT) for all train times
          const today = new Date();
          
          // Look for the actual date in the text
          // Format: "est. arrival 21:44 on 04/25"
          let arrivalDate = today;
          const dateMatch = text.match(/est\. arrival \d+:\d+ on (\d+\/\d+)/);
          if (dateMatch && dateMatch.length >= 2) {
            // Parse the date from the match
            const dateStr = dateMatch[1];
            arrivalDate = new Date(`${dateStr}/2025`);
          }
          
          stationEntries.push({
            stationCode,
            stationName,
            arrivalTime,
            arrivalDate,
            delayText
          });
        }
      }
    });
    
    // Extract current location from the Position Updates section
    let currentLocation = '';
    const positionUpdateElement = $('div:contains("Position Updates")').next('ul').find('li').first();
    if (positionUpdateElement.length > 0) {
      // Format: "18:50 - 122 mi E of Gallup [GLP], 0 mph"
      currentLocation = positionUpdateElement.text().trim().replace(/^\d+:\d+ - /, '');
    }
    
    // If we have station entries, create train status objects for each
    if (stationEntries.length > 0) {
      // For Train #3 (westbound), we only want to track the next railcam station
      if (trainId === '3') {
        // Find the next railcam station
        const railcamStations = ['Gallup', 'Flagstaff', 'Winslow', 'Barstow', 'Fullerton'];
        const nextRailcamStation = stationEntries.find(entry => 
          railcamStations.includes(entry.stationName)
        );
        
        if (nextRailcamStation) {
          const trainStatus = createTrainStatus(
            trainId,
            direction,
            lastUpdated,
            nextRailcamStation.stationName,
            nextRailcamStation.arrivalTime,
            nextRailcamStation.arrivalDate,
            nextRailcamStation.delayText,
            currentLocation
          );
          
          trainStatuses.push(trainStatus);
        }
      } 
      // For Train #4 (eastbound), we want to track Fort Madison and Las Vegas
      else if (trainId === '4') {
        // Find Fort Madison and Las Vegas stations
        const fortMadison = stationEntries.find(entry => 
          entry.stationName === 'Fort Madison'
        );
        
        const lasVegas = stationEntries.find(entry => 
          entry.stationName === 'Las Vegas'
        );
        
        if (fortMadison) {
          const trainStatus = createTrainStatus(
            trainId,
            direction,
            lastUpdated,
            fortMadison.stationName,
            fortMadison.arrivalTime,
            fortMadison.arrivalDate,
            fortMadison.delayText,
            'En route to Fort Madison'
          );
          
          trainStatuses.push(trainStatus);
        }
        
        if (lasVegas) {
          const trainStatus = createTrainStatus(
            trainId,
            direction,
            lastUpdated,
            lasVegas.stationName,
            lasVegas.arrivalTime,
            lasVegas.arrivalDate,
            lasVegas.delayText,
            'En route to Las Vegas'
          );
          
          trainStatuses.push(trainStatus);
        }
      }
    }
    
    // If we couldn't find any stations, create a default train status
    if (trainStatuses.length === 0) {
      if (trainId === '3') {
        trainStatuses.push({
          trainId,
          direction,
          lastUpdated,
          status: 'On time',
          nextStation: 'Gallup',
          estimatedArrival: new Date(Date.now() + 6 * 60 * 60000).toISOString(), // 6 hours from now
          currentLocation: 'En route'
        });
      } else {
        // Train #4
        trainStatuses.push({
          trainId,
          direction,
          lastUpdated,
          status: 'On time',
          nextStation: 'Fort Madison',
          estimatedArrival: new Date(Date.now() + 55 * 60000).toISOString(), // 55 minutes from now
          currentLocation: 'En route'
        });
        
        trainStatuses.push({
          trainId,
          direction,
          lastUpdated,
          status: 'On time',
          nextStation: 'Las Vegas',
          estimatedArrival: new Date(Date.now() + 2 * 60 * 60000).toISOString(), // 2 hours from now
          currentLocation: 'En route'
        });
      }
    }
    
    return trainStatuses;
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    // Return default train statuses in case of error
    if (trainId === '3') {
      return [{
        trainId,
        direction: 'westbound',
        lastUpdated: new Date().toISOString(),
        status: 'On time',
        nextStation: 'Gallup',
        estimatedArrival: new Date(Date.now() + 6 * 60 * 60000).toISOString(), // 6 hours from now
        currentLocation: 'En route'
      }];
    } else {
      // Train #4
      return [
        {
          trainId,
          direction: 'eastbound',
          lastUpdated: new Date().toISOString(),
          status: 'On time',
          nextStation: 'Fort Madison',
          estimatedArrival: new Date(Date.now() + 55 * 60000).toISOString(), // 55 minutes from now
          currentLocation: 'En route'
        },
        {
          trainId,
          direction: 'eastbound',
          lastUpdated: new Date().toISOString(),
          status: 'On time',
          nextStation: 'Las Vegas',
          estimatedArrival: new Date(Date.now() + 2 * 60 * 60000).toISOString(), // 2 hours from now
          currentLocation: 'En route'
        }
      ];
    }
  }
}

/**
 * Helper function to create a train status object
 */
function createTrainStatus(
  trainId: string,
  direction: 'westbound' | 'eastbound',
  lastUpdated: string,
  stationName: string,
  arrivalTime: string,
  arrivalDate: Date,
  delayText: string,
  currentLocation: string
): TrainStatus {
  const timeParts = arrivalTime.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  // Create a date string in ISO format with MT timezone
  // Note: MT is either MST (UTC-7) or MDT (UTC-6) depending on daylight saving time
  // We'll use MDT for simplicity since the site is likely using the current timezone
  const mtOffset = -6; // MDT offset from UTC in hours
  
  // Create a new date in UTC
  const estimatedArrival = new Date(Date.UTC(
    arrivalDate.getFullYear(),
    arrivalDate.getMonth(),
    arrivalDate.getDate(),
    hours - mtOffset, // Convert MT hours to UTC
    minutes,
    0,
    0
  ));
  
  const trainStatus: TrainStatus = {
    trainId,
    direction,
    lastUpdated,
    nextStation: stationName,
    estimatedArrival: estimatedArrival.toISOString(),
    currentLocation,
    status: 'On time'
  };
  
  // Parse delay information
  if (delayText) {
    const delayRegex = /(\d+) hr\. (\d+) min\. late/;
    const delayMatch = delayText.match(delayRegex);
    if (delayMatch && delayMatch.length >= 3) {
      const hours = parseInt(delayMatch[1], 10);
      const minutes = parseInt(delayMatch[2], 10);
      trainStatus.delayMinutes = hours * 60 + minutes;
      trainStatus.status = `Delayed ${hours} hr ${minutes} min`;
    }
  }
  
  return trainStatus;
}

/**
 * Mocks train status data for development/testing
 * @param trainId The train ID ('3' or '4')
 * @returns Mocked train status data
 */
export function mockTrainStatus(trainId: string): TrainStatus[] {
  const now = new Date();
  const eta = new Date(now.getTime() + 25 * 60000); // 25 minutes from now
  
  if (trainId === '3') {
    return [{
      trainId,
      direction: 'westbound',
      lastUpdated: now.toISOString(),
      currentLocation: 'En route',
      nextStation: 'Gallup',
      estimatedArrival: new Date(now.getTime() + 6 * 60 * 60000).toISOString(), // 6 hours from now
      status: 'On time',
      delayMinutes: 0,
    }];
  } else {
    // Train #4
    return [
      {
        trainId,
        direction: 'eastbound',
        lastUpdated: now.toISOString(),
        currentLocation: 'En route to Fort Madison',
        nextStation: 'Fort Madison',
        estimatedArrival: new Date(now.getTime() + 55 * 60000).toISOString(), // 55 minutes from now
        status: 'On time',
        delayMinutes: 0,
      },
      {
        trainId,
        direction: 'eastbound',
        lastUpdated: now.toISOString(),
        currentLocation: 'En route to Las Vegas',
        nextStation: 'Las Vegas',
        estimatedArrival: new Date(now.getTime() + 2 * 60 * 60000).toISOString(), // 2 hours from now
        status: 'On time',
        delayMinutes: 0,
      }
    ];
  }
}
