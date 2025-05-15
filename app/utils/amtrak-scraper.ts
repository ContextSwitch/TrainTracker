import axios from 'axios';
import * as cheerio from 'cheerio';
import { TrainStatus } from '../types';
import { getStationByName } from '../config';
import { getStationTimeZoneOffset } from './predictions';

// Define the ordered list of stations for each train route
// Train #3 (Southwest Chief) - Chicago to Los Angeles (westbound)
const train3Stations = [
  'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
  'Kansas City', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
  'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
  'Winslow', 'Flagstaff', 'Kingman', 'Needles', 'Barstow', 'Victorville', 'San Bernardino', 
  'Riverside', 'Fullerton', 'Los Angeles'
];

// Train #4 (Southwest Chief) - Los Angeles to Chicago (eastbound)
const train4Stations = [...train3Stations].reverse();

/**
 * Finds the next station in the route after the last visited station
 * @param trainId The train ID ('3' or '4')
 * @param lastVisitedStation The last station that was visited
 * @returns The next station in the route
 */
function findNextStationInRoute(trainId: string, lastVisitedStation: string): string | null {
  const stations = trainId === '3' ? train3Stations : train4Stations;
  
  // Find the index of the last visited station
  // Use a more flexible matching approach to handle variations in station names
  const lastVisitedIndex = stations.findIndex(station => {
    const stationLower = station.toLowerCase();
    const visitedLower = lastVisitedStation.toLowerCase();
    
    // Check if either name contains the other or if they share significant parts
    return stationLower.includes(visitedLower) || 
           visitedLower.includes(stationLower) ||
           // Handle cases like "Las Vegas, NM" vs "Las Vegas"
           (visitedLower.split(',')[0].trim() === stationLower.split(',')[0].trim());
  });
  
  console.log(`Finding next station after ${lastVisitedStation} for train #${trainId}. Found at index: ${lastVisitedIndex}`);
  
  // If the station wasn't found, return null
  if (lastVisitedIndex === -1) {
    return null;
  }
  
  // If it's the last station in the route, return that station again
  if (lastVisitedIndex === stations.length - 1) {
    console.log(`Last station in route reached: ${stations[lastVisitedIndex]}`);
    return stations[lastVisitedIndex];
  }
  
  // Otherwise, return the next station in the route
  return stations[lastVisitedIndex + 1];
}

/**
 * Generates a URL for the dixielandsoftware.net train status page
 * @param trainId The train ID ('3' or '4')
 * @param date The date to check
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
 * Sleep function to wait for a specified number of milliseconds
 * @param ms The number of milliseconds to wait
 * @returns A promise that resolves after the specified time
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Scrapes train status data from dixielandsoftware.net for a specific train and date
 * @param trainId The train ID ('3' or '4')
 * @param date The date to check
 * @returns Promise with train status data or null if not found
 */
export async function scrapeTrainFromDixieland(
  trainId: string,
  date: Date
): Promise<TrainStatus | null> {
  try {
    let html = '';
    let retryCount = 0;
    const maxRetries = 1; // One retry attempt
    
    // Fetch from the URL
    const url = generateDixielandUrl(trainId, date);
    console.log(`Fetching URL: ${url}`);
    
    while (retryCount <= maxRetries) {
      try {
        const response = await axios.get(url);
        html = response.data as string;
        
        // Check if we got an authorization error
        if (html.includes("You don't have the necessary authorization")) {
          if (retryCount < maxRetries) {
            console.log(`Authorization error for train #${trainId}, retrying in 5 seconds...`);
            retryCount++;
            await sleep(5000); // Wait 5 seconds before retrying
            continue;
          } else {
            console.log(`Authorization error for train #${trainId} after retry`);
            return null;
          }
        }
        
        // If we get here, we have valid HTML
        break;
      } catch (error) {
        if (retryCount < maxRetries) {
          console.error(`Error fetching URL for train #${trainId}, retrying in 5 seconds:`, error);
          retryCount++;
          await sleep(5000); // Wait 5 seconds before retrying
        } else {
          console.error(`Error fetching URL for train #${trainId} after retry:`, error);
          return null;
        }
      }
    }
    
    // If we didn't get any HTML, return null
    if (!html) {
      console.error(`No HTML content received for train #${trainId}`);
      return null;
    }
    
    // Log the first 500 characters of the HTML response
    console.log(`HTML response (first 500 chars): ${html.substring(0, 500)}`);
    
    // Check if the HTML contains an error message
    if (html.includes(`No status file was found for train ${trainId} on`)) {
      console.error(`No status file found for train #${trainId} on ${date.toISOString().split('T')[0]}`);
      return null;
    }
    
    // Load the HTML into cheerio
    const $ = cheerio.load(html);
    
    // Find the div with id="m1" which contains the stop information
    const stopInfoDiv = $('#m1');
    if (!stopInfoDiv.length) {
      console.error(`No stop information found for train #${trainId} on ${date.toISOString().split('T')[0]}`);
      
      // Log all div IDs in the HTML
      const divIds: string[] = [];
      $('div[id]').each((i, el) => {
        const id = $(el).attr('id');
        if (id) divIds.push(id);
      });
      console.log(`Available div IDs: ${divIds.join(', ')}`);
      
      return null;
    }
    
    // Parse the HTML table structure for both trains
    console.log(`Parsing HTML table for train #${trainId}...`);
    
    // Find all table rows in the div
    const rows = stopInfoDiv.find('tr');
    console.log(`Found ${rows.length} rows in the table`);
    
    // Initialize variables to store station information
    let nextStationCode = '';
    let nextStationName = '';
    let scheduledArrivalTime = '';
    let actualArrivalTime = '';
    let delayText = '';
    let departed = false;
    
    // Variables to track the last station with arrival/departure data
    let lastStationWithDataCode = '';
    let lastStationWithDataName = '';
    let lastStationScheduledTime = '';
    let foundStationWithoutDeparture = false;
    
    console.log(`Searching for next station for train #${trainId}...`);
    
    // Skip the header row (first row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows.eq(i);
      const cells = row.find('td');
      
      if (cells.length >= 3) {
        // First cell contains the station name and code
        const stationCell = cells.eq(0);
        const stationText = stationCell.text().trim();
        
        // Extract the station code from the text (e.g., "Chicago, IL (CHI)")
        const stationCodeMatch = stationText.match(/\(([A-Z]{3})\)$/);
        if (stationCodeMatch) {
          const stationCode = stationCodeMatch[1];
          
          // Check if there's an asterisk (*) to the left of the station code
          const hasAsterisk = stationCell.html()?.includes('*') || false;
          
          // Second cell contains the scheduled time
          const scheduledCell = cells.eq(1);
          const scheduledText = scheduledCell.text().trim();
          
          // Third cell contains the actual time and status
          const actualCell = cells.eq(2);
          const actualText = actualCell.text().trim();
          
          console.log(`Station ${stationCode}: Has Asterisk: ${hasAsterisk}, Scheduled: ${scheduledText}, Actual: ${actualText}`);
          
          // Check if this station has actual departure or arrival times
          // If the actual text includes 'Dp' followed by a time, it means the train has already departed this station
          // If the actual text includes 'Arrived:' but no 'Departed:', it might be the final destination
          // Also check for arrival time without departure time (e.g., "Ar 422P")
          const hasDeparted = actualText.match(/Dp\s+\d+:\d+[AP]/) || actualText.match(/Dp\s+\d+[AP]/);
          const hasArrivedOnly = (actualText.match(/Arrived:/) && !actualText.match(/Departed:/)) || 
                                (actualText.match(/Ar\s+\d+:\d+[AP]/) || actualText.match(/Ar\s+\d+[AP]/));
          
          if (hasDeparted || hasArrivedOnly) {
            // Train has departed this station or arrived at final destination
            if (hasDeparted) {
              console.log(`Station ${stationCode} has already departed: ${actualText}`);
            } else {
              console.log(`Station ${stationCode} has arrived (potential final destination): ${actualText}`);
            }
            
            // Update the last station with data
            lastStationWithDataCode = stationCode;
            lastStationWithDataName = stationText.replace(/\s*\([A-Z]{3}\)$/, '').trim();
            lastStationScheduledTime = scheduledText.includes('Dp') 
              ? scheduledText.replace('Dp', '').trim() 
              : scheduledText.includes('Ar') 
                ? scheduledText.replace('Ar', '').trim() 
                : '';
            
            // Extract delay information if available
            const hourMinuteDelayMatch = actualText.match(/(\d+)\s+hour(?:s)?,\s+(\d+)\s+minute(?:s)?\s+late/i);
            const minuteDelayMatch = actualText.match(/(\d+)\s+minute(?:s)?\s+late/i);
            
            if (hourMinuteDelayMatch) {
              const hours = parseInt(hourMinuteDelayMatch[1], 10);
              const minutes = parseInt(hourMinuteDelayMatch[2], 10);
              delayText = `${hours} hour${hours !== 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} late`;
            } else if (minuteDelayMatch) {
              delayText = `${minuteDelayMatch[1]} minutes late`;
            } else if (actualText.includes('On time')) {
              delayText = 'On time';
            }
              
            continue;
          }
          
          // This is a station without departure time
          // We'll store it temporarily but not break the loop yet
          if (!nextStationCode) {
            nextStationCode = stationCode;
            nextStationName = stationText.replace(/\s*\([A-Z]{3}\)$/, '').trim();
            
            // Parse the scheduled time
            if (scheduledText.includes('Dp')) {
              scheduledArrivalTime = scheduledText.replace('Dp', '').trim();
            } else if (scheduledText.includes('Ar')) {
              // If only arrival time is available, use that
              scheduledArrivalTime = scheduledText.replace('Ar', '').trim();
            }
            
            console.log(`Found station without departure time: ${nextStationName} (${nextStationCode}), Scheduled arrival: ${scheduledArrivalTime}`);
          }
          
          // We found a station without departure time
          foundStationWithoutDeparture = true;
        }
      }
    }
    
    // After processing all stations, determine the next station based on the route
    if (lastStationWithDataName) {
      console.log(`Last station with departure/arrival data: ${lastStationWithDataName}`);
      
      // Check if the last station with data is the final destination
      const finalDestination = trainId === '3' ? 'Los Angeles' : 'Chicago';
      const isFinalDestination = lastStationWithDataName.toLowerCase().includes(finalDestination.toLowerCase()) ||
                                finalDestination.toLowerCase().includes(lastStationWithDataName.toLowerCase());
      
      if (isFinalDestination) {
        // If the train has reached the final destination, set the next station to be the final destination
        console.log(`Train has reached the final destination: ${finalDestination}`);
        nextStationCode = lastStationWithDataCode;
        nextStationName = lastStationWithDataName;
        scheduledArrivalTime = lastStationScheduledTime;
        departed = true; // Mark as departed since this is the final destination
        
        console.log(`Using final destination as next station: ${nextStationName} (${nextStationCode}), Scheduled time: ${scheduledArrivalTime}, departed=${departed}`);
      } else {
        // Find the next station in the route after the last visited station
        const nextStationInRoute = findNextStationInRoute(trainId, lastStationWithDataName);
        
        if (nextStationInRoute) {
          console.log(`Found next station in route after ${lastStationWithDataName}: ${nextStationInRoute}`);
          
          // If we already found a station without departure time and it matches the next station in route, use it
          if (nextStationName && (
              nextStationName.toLowerCase().includes(nextStationInRoute.toLowerCase()) ||
              nextStationInRoute.toLowerCase().includes(nextStationName.toLowerCase())
          )) {
            console.log(`Using found station without departure time: ${nextStationName} (${nextStationCode})`);
          } else {
            // Otherwise, use the next station in the route
            const originalNextStationName = nextStationName;
            nextStationName = nextStationInRoute;
            
            // Keep the original station code if we're replacing with the route-based station
            if (originalNextStationName && originalNextStationName !== nextStationName) {
              console.log(`Replacing station ${originalNextStationName} with ${nextStationName} from route`);
            }
            
            // If we don't have scheduled arrival time for this station, use a default
            if (!scheduledArrivalTime) {
              scheduledArrivalTime = '12:00P'; // Default to noon
              console.log(`Using default scheduled time for ${nextStationName}: ${scheduledArrivalTime}`);
            }
            
            console.log(`Using next station in route: ${nextStationName}, Scheduled time: ${scheduledArrivalTime}`);
          }
        } else {
          // If there's no next station in the route, use the last station with data
          console.log(`No next station found in route after ${lastStationWithDataName}`);
          
          // If we already have a next station without departure time, keep using that
          if (nextStationName) {
            console.log(`Keeping found station without departure time: ${nextStationName} (${nextStationCode})`);
          } else {
            // Otherwise use the last station with data
            nextStationCode = lastStationWithDataCode;
            nextStationName = lastStationWithDataName;
            scheduledArrivalTime = lastStationScheduledTime;
            departed = true; // Mark as departed since this is the last station with data
            
            console.log(`Using last station with data: ${nextStationName} (${nextStationCode}), Scheduled time: ${scheduledArrivalTime}, departed=${departed}`);
          }
        }
      }
    } else if (foundStationWithoutDeparture) {
      // If we didn't find any station with departure data but found a station without departure time,
      // use that as the next station (this handles the case where the train just started)
      console.log(`No station with departure data found, using first station without departure time: ${nextStationName}`);
    }
    
    // If we didn't find any station, return null
    if (!nextStationCode) {
      console.error(`No next station found for train #${trainId} on ${date.toISOString().split('T')[0]}`);
      return null;
    }
    
    // Parse the arrival time
    const parsedTime = parseTimeString(scheduledArrivalTime);
    if (!parsedTime) {
      console.error(`Error parsing arrival time: ${scheduledArrivalTime}`);
      return null;
    }
    
    // Get the hour and minute from the parsed time
    const hour24 = parsedTime.getHours();
    const minute = parsedTime.getMinutes();
    
    // Create a date object for the estimated arrival
    const estimatedArrival = new Date(date);
    estimatedArrival.setHours(hour24, minute, 0, 0);
    
    // Adjust for timezone
    const stationOffset = getStationTimeZoneOffset(nextStationName);
    const localOffset = new Date().getTimezoneOffset() / 60 * -1;
    const offsetDiff = localOffset - stationOffset;
    
    // Apply the offset difference
    const adjustedArrival = new Date(estimatedArrival.getTime() + offsetDiff * 60 * 60 * 1000);
    
    // Determine the train direction
    const direction = trainId === '3' ? 'westbound' : 'eastbound';
    
    // Parse delay information if available
    let delayMinutes = 0;
    let status = 'On time';
    
    if (delayText) {
      const hourMinuteDelayMatch = delayText.match(/(\d+)\s+hour(?:s)?,\s+(\d+)\s+minute(?:s)?\s+late/i);
      const minuteDelayMatch = delayText.match(/(\d+)\s+minutes?\s+late/i);
      
      if (hourMinuteDelayMatch) {
        const hours = parseInt(hourMinuteDelayMatch[1], 10);
        const minutes = parseInt(hourMinuteDelayMatch[2], 10);
        delayMinutes = hours * 60 + minutes;
        status = delayText;
      } else if (minuteDelayMatch) {
        delayMinutes = parseInt(minuteDelayMatch[1], 10);
        status = `${delayMinutes} minutes late`;
      }
    }
    
    // Adjust the estimated arrival time based on the delay
    if (delayMinutes > 0) {
      adjustedArrival.setTime(adjustedArrival.getTime() + delayMinutes * 60 * 1000);
    }
    
    // Create the train status object
    const trainStatus: TrainStatus = {
      trainId,
      direction,
      lastUpdated: new Date().toISOString(),
      nextStation: nextStationName,
      estimatedArrival: adjustedArrival.toISOString(),
      status: status,
      delayMinutes: delayMinutes > 0 ? delayMinutes : undefined,
      instanceId: getInstanceIdFromDate(date),
      isNext: false,
      departed,
      currentLocation: lastStationWithDataName || undefined // Set the current location to the last visited station
    };
    
    return trainStatus;
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId} on ${date.toISOString().split('T')[0]}:`, error);
    return null;
  }
}

/**
 * Helper function to parse a time string in the format "1:23P" or "12:34A"
 * @param timeString The time string to parse
 * @returns A Date object representing the time, or null if parsing fails
 */
function parseTimeString(timeString: string): Date | null {
  try {
    // Handle both formats: "225P" and "2:25P"
    let match;
    if (timeString.includes(':')) {
      match = timeString.match(/(\d+):(\d+)([AP])/);
    } else {
      // For format like "225P", we need to extract the hour and minute differently
      match = timeString.match(/(\d+)(\d{2})([AP])/);
    }
    
    if (!match) return null;
    
    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const amPm = match[3];
    
    // Convert to 24-hour format
    if (amPm === 'P' && hour < 12) {
      hour += 12;
    } else if (amPm === 'A' && hour === 12) {
      hour = 0;
    }
    
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    
    return date;
  } catch (error) {
    console.error(`Error parsing time string: ${timeString}`, error);
    return null;
  }
}

/**
 * Generates an instance ID from a date
 * This helps identify different instances of the same train
 * @param date The date of the train instance
 * @returns A numeric instance ID
 */
function getInstanceIdFromDate(date: Date): number {
  // Use the day of the month as the instance ID
  // This assumes there's only one train per day
  return date.getDate();
}

/**
 * Gets all instances of a train by checking multiple dates
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances
 */
export async function getAllTrainInstances(trainId: string): Promise<TrainStatus[]> {
  const trainStatuses: TrainStatus[] = [];
  const today = new Date();
  
  // Check only yesterday and today
  const dates = [
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), // two days ago
    new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1), // yesterday
    new Date(today.getFullYear(), today.getMonth(), today.getDate())      // today
  ];
  
  for (const date of dates) {
    // Format the date as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log(`Checking train #${trainId} for date ${dateStr}`);
    
    const url = generateDixielandUrl(trainId, date);
    console.log(`URL: ${url}`);
    
    const trainStatus = await scrapeTrainFromDixieland(trainId, date);
    if (trainStatus) {
      console.log(`Found train status for train #${trainId} on ${dateStr}: ${trainStatus.nextStation}`);
      trainStatuses.push(trainStatus);
    } else {
      console.log(`No train status found for train #${trainId} on ${dateStr}`);
    }
  }
  
  console.log(`Total train statuses found for train #${trainId}: ${trainStatuses.length}`);
  return trainStatuses;
}

/**
 * Main function to scrape train status data from dixielandsoftware.net
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances
 */
export async function scrapeTrainStatus(trainId: string): Promise<TrainStatus[]> {
  try {
    // Get all instances of this train
    const trainInstances = await getAllTrainInstances(trainId);
    
    // If we found any instances, return them
    if (trainInstances.length > 0) {
      return trainInstances;
    }
    
    // If no instances were found, try to get existing data from train_status.json
    console.error(`No train instances found for train #${trainId}, checking existing data`);
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Path to the train status file
      const trainStatusFile = path.join(process.cwd(), 'data', 'train_status.json');
      
      // Read existing data
      if (fs.existsSync(trainStatusFile)) {
        const data = fs.readFileSync(trainStatusFile, 'utf8');
        const trainData = JSON.parse(data);
        
        if (trainData[trainId] && Array.isArray(trainData[trainId]) && trainData[trainId].length > 0) {
          console.log(`Using existing data for train #${trainId} from train_status.json`);
          // Filter out empty objects
          const filteredData = trainData[trainId].filter((status: any) => status.trainId === trainId);
          if (filteredData.length > 0) {
            return filteredData;
          }
        }
      }
    } catch (fileError) {
      console.error(`Error reading existing train data for train #${trainId}:`, fileError);
    }
    
    // If we still don't have any data, just return an empty array
    console.error(`No existing data found for train #${trainId}`);
    
    return [];
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    return [];
  }
}

/**
 * Alias for scrapeTrainStatus to maintain compatibility with tests
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances
 */
export async function scrapeAmtrakTrainStatus(trainId: string): Promise<TrainStatus[]> {
  return scrapeTrainStatus(trainId);
}
