import { TrainStatus } from '../types';
import { scrapeAmtrakTrainStatus } from './amtrak-scraper';
import { getStationTimeZoneOffset } from './predictions';

const railcamStations = ['Mendota', 'Galesburg', 'Fort Madison', 'La Plata', 'Kansas City - Union Station', 'Lawrence', 'Las Vegas', 'Gallup','Winslow','Flagstaff - Amtrak Station', 'Kingman', 'Needles', 'Barstow - Harvey House Railroad Depot', 'Fullerton'];

/**
 * Scrapes train status data from dixielandsoftware.net
 * @param url The URL parameter is kept for backward compatibility but is not used
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances of this train
 */
export async function scrapeTrainStatus(url: string, trainId: string): Promise<TrainStatus[]> {
  try {
    console.log(`Scraping train status for train #${trainId} from dixielandsoftware.net`);
    
    // Use the new Amtrak scraper to get train status data
    const trainStatuses = await scrapeAmtrakTrainStatus(trainId);
    
    // Return all statuses without filtering
    return trainStatuses;
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    return [];
  }
}

/**
 * Helper function to create a train status object
 */
function createTrainStatus(
trainId: string, direction: 'eastbound' | 'westbound', lastUpdated: string, stationName: string, arrivalTime: string, arrivalDate: Date, p0: string, p1: string, instanceId: number): TrainStatus {
  const timeParts = arrivalTime.split(':');
  const hours = parseInt(timeParts[0], 10);
  const minutes = parseInt(timeParts[1], 10);
  
  // Create a date string in ISO format with MT timezone
  // Note: MT is either MST (UTC-7) or MDT (UTC-6) depending on daylight saving time
  // We'll use MDT for simplicity since the site is likely using the current timezone
  const mtOffset = -6; // MDT offset from UTC in hours
  
  let estimatedArrival: Date;
  
  try {
    // Create a date object representing the arrival time in Mountain Time
    const mtDate = new Date(
      arrivalDate.getFullYear(),
      arrivalDate.getMonth(),
      arrivalDate.getDate(),
      hours,
      minutes,
      0,
      0
    );
    
    // Get the user's local timezone offset in minutes
    const localOffset = new Date().getTimezoneOffset()  / 60 * -1;
    
    // Calculate the difference between Mountain Time and local time in milliseconds
    // Mountain Time is UTC-6, so to convert from MT to local:
    // 1. Convert MT to UTC: Add 6 hours (mtOffset * -1 * 60 * 60 * 1000)
    // 2. Convert UTC to local: Subtract local offset (localOffset * 60 * 1000)
    const offsetDiff = localOffset - getStationTimeZoneOffset(stationName) 
    
    // Apply the offset difference to get the time in the user's local timezone
    const localTime = new Date(mtDate.getTime() + offsetDiff);
    
    // Create a new UTC date that represents the same moment
    // Use a direct approach to avoid TypeScript errors
    estimatedArrival = new Date();
    estimatedArrival.setTime(mtDate.getTime() + offsetDiff * 60 * 60 * 1000);

  } catch (e) {
    console.error('Error converting time:', e);
    // Fallback to current time plus 1 hour if there's an error
    estimatedArrival = new Date(new Date().getTime() + 60 * 60 * 1000);
  }
  
  const trainStatus: TrainStatus = {
    trainId,
    direction,
    lastUpdated,
    nextStation: stationName,
    estimatedArrival: estimatedArrival.toISOString(),
    status: 'On time',
    instanceId: instanceId,
    isNext: false
  };
  /*
  // Parse delay information
  if (delayText) {
    const delayRegex = /(\d+) hr\. (\d+) min\. late/;
    const delayMatch = delayText.match(delayRegex);
    if (delayMatch && delayMatch.length >= 3) {
      const hours = parseInt(delayMatch[1], 10);
      const minutes = parseInt(delayMatch[2], 10);
      trainStatus.delayMinutes = hours * 60 + minutes;
      trainStatus.status = `Delayed ${hours} hr ${minutes} min`;
      trainStatus.instanceId = instanceId;
    }
  }8*/
  
  return trainStatus;
}

/**
 * Mocks train status data for development/testing
 * @param trainId The train ID ('3' or '4')
 * @returns Mocked train status data
 */
export function mockTrainStatus(trainId: string): TrainStatus[] {
  const now = new Date();
  
  // Function to create a properly timezone-adjusted date
  const createAdjustedDate = (hoursToAdd: number): string => {
    // Create a date in Mountain Time (MDT)
    const mtOffset = -6; // MDT offset from UTC
    
    // Calculate the target time in Mountain Time
    const mtDate = new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
    
    // Get the user's local timezone offset in minutes
    const localOffset = new Date().getTimezoneOffset();
    
    // Calculate the difference between Mountain Time and local time in milliseconds
    const offsetDiff = (mtOffset * -1 * 60 * 60 * 1000) - (localOffset * 60 * 1000);
    
    // Apply the offset difference to get the time in the user's local timezone
    const localTime = new Date(mtDate.getTime() + offsetDiff);
    
    // Create a new UTC date that represents the same moment
    // Use a direct approach to avoid TypeScript errors
    const adjustedDate = new Date();
    adjustedDate.setTime(localTime.getTime());
    
    return adjustedDate.toISOString();
  };
  
  if (trainId === '3') {
    // For Train #3, create two instances to simulate multiple trains
    return [
     
    ];
  } else {
    // Train #4
    return [
   
    ];
  }
}
