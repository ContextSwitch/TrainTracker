import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrainStatus } from '../types';
import { getStationByName } from '../config';
import { stat } from 'fs';
import { getStationTimeZoneOffset } from './predictions';

const railcamStations = ['Galesburg', 'Fort Madison', 'La Plata', 'Kansas City - Union Station', 'Las Vegas', 'Gallup','Winslow','Flagstaff - Amtrak Station', 'Barstow - Harvey House Railroad Depot', 'Fullerton'];


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
      const time = statusUpdateText[1] || '';
      const date = statusUpdateText[2] || '';
      if (time && date) {
        try {
          const dateObj = new Date(`${date}/2025 ${time}`);
          updatedLastUpdated = dateObj.toISOString();
        } catch (e) {
          console.error(`Error parsing date: ${date}/2025 ${time}`, e);
        }
      }
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
      departed: boolean;
      instanceId: number;
    }[] = [];
    
    // Extract all station entries with arrival times
    let firstStation = '';
    let instanceId = 1;

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
          const departed = false;

          if(firstStation == ''){
            firstStation = stationCode;
          }
          else if (['CHI', 'LAX'].includes(stationCode)){
            instanceId++;
            
          }
          // Parse the estimated arrival time
          // railrat.net uses Mountain Time (MT) for all train times
          const today = new Date();
          
          // Look for the actual date in the text
          // Format: "est. arrival 21:44 on 04/25"
          let arrivalDate = today;
          const dateMatch = text.match(/est\. arrival \d+:\d+ on (\d+\/\d+)/);
          if (dateMatch && dateMatch.length >= 2 && dateMatch[1]) {
            // Parse the date from the match
            const dateStr = dateMatch[1];
            try {
              arrivalDate = new Date(`${dateStr}/2025`);
            } catch (e) {
              console.error(`Error parsing date: ${dateStr}/2025`, e);
            }
          }

          stationEntries.push({
            stationCode,
            stationName,
            arrivalTime,
            arrivalDate,
            delayText,
            departed,
            instanceId
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
      
      // Define the railcam stations for both directions
      
      // Get the current time to check if trains have departed
      const now = new Date();
      
      // Filter station entries to only include railcam stations
      const railcamEntries = stationEntries.filter(entry => 
        railcamStations.includes(entry.stationName)
      );
      
      // Create train status objects for each railcam station
      for (const entry of railcamEntries) {
        // Create the train status object
        const trainStatus = createTrainStatus(
          trainId,
          direction,
          lastUpdated,
          entry.stationName,
          entry.arrivalTime,
          entry.arrivalDate,
          entry.delayText || '',
          `En route to ${entry.stationName}`,
          entry.instanceId
        );
        
        // Check if the train has departed from this station
        // Only mark as departed if the estimated arrival time is at least 5 minutes in the past
        // This prevents marking trains as departed when they're just arriving
        const estimatedArrivalTime = trainStatus.estimatedArrival ? new Date(trainStatus.estimatedArrival) : null;
        const hasDeparted = entry.departed;
        
        // Add the departed flag and timezone information
        trainStatus.departed = hasDeparted;
        
        // Update the current location if the train has departed
        if (hasDeparted) {
          trainStatus.currentLocation = `Departed from ${entry.stationName}`;
        }
        
        // Add the train status to the array
        trainStatuses.push(trainStatus);
      }
    }




    console.log('train statuses = ', trainStatuses)    

    let instanceIds = [...new Set(trainStatuses.map(status => status.instanceId))];
    let instanceStatus = [];
    let result = [];
    for( let instance of instanceIds){
      instanceStatus[instance] = trainStatuses.filter(status => status.instanceId == instance);
      instanceStatus[instance].sort((a,b) => {

        if(direction == 'eastbound'){
          return railcamStations.indexOf(b.nextStation) - railcamStations.indexOf(a.nextStation)
        }
        else{
          return railcamStations.indexOf(a.nextStation) - railcamStations.indexOf(b.nextStation)
        }
      })
      console.log('sorted trains = ', instance, instanceStatus[instance])
      result.push(instanceStatus[instance][0])
    }

    console.log("result - ", result)
    


    return result;
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    // Return default train statuses in case of error
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
    console.log('estimatedArrival = ', estimatedArrival, stationName, getStationTimeZoneOffset(stationName), offsetDiff * 60 * 60, localOffset, offsetDiff)
    // Log for debugging
    console.log(`Original MT time: ${hours}:${minutes}, Date: ${arrivalDate.toDateString()}`);
    console.log(`Local timezone offset: ${localOffset} minutes`);
    console.log(`Converted to local time: ${localTime.toLocaleString()}`);
    console.log(`Stored as UTC: ${estimatedArrival.toISOString()}`);
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
    
    // Log for debugging
    console.log(`Mock data - Hours to add: ${hoursToAdd}, Original MT time: ${mtDate.toLocaleString()}`);
    console.log(`Mock data - Local timezone offset: ${localOffset} minutes`);
    console.log(`Mock data - Converted to local time: ${localTime.toLocaleString()}`);
    console.log(`Mock data - Stored as UTC: ${adjustedDate.toISOString()}`);
    
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
