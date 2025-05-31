/**
 * TransitDocs API Scraper
 * This module provides functions to scrape train status data from the TransitDocs API
 */
import { TrainStatus } from '../types';

// Mapping of station codes to full station names
const stationCodeMap: Record<string, string> = {
  'CHI': 'Chicago, IL',
  'NPV': 'Naperville, IL',
  'MDT': 'Mendota, IL',
  'PCT': 'Princeton, IL',
  'GBB': 'Galesburg, IL',
  'FMD': 'Fort Madison, IA',
  'LAP': 'La Plata, MO',
  'KCY': 'Kansas City, MO',
  'LRC': 'Lawrence, KS',
  'TOP': 'Topeka, KS',
  'NEW': 'Newton, KS',
  'HUT': 'Hutchinson, KS',
  'DDG': 'Dodge City, KS',
  'GCK': 'Garden City, KS',
  'LMR': 'Lamar, CO',
  'LAJ': 'La Junta, CO',
  'TRI': 'Trinidad, CO',
  'RAT': 'Raton, NM',
  'LSV': 'Las Vegas, NM',
  'LMY': 'Lamy, NM',
  'ABQ': 'Albuquerque, NM',
  'GLP': 'Gallup, NM',
  'WLO': 'Winslow, AZ',
  'FLG': 'Flagstaff, AZ',
  'KNG': 'Kingman, AZ',
  'NDL': 'Needles, CA',
  'BAR': 'Barstow, CA',
  'VRV': 'Victorville, CA',
  'SNB': 'San Bernardino, CA',
  'RIV': 'Riverside, CA',
  'FUL': 'Fullerton, CA',
  'LAX': 'Los Angeles, CA'
};

/**
 * Converts a station code to a full station name
 * @param code The station code to convert
 * @returns The full station name or the original code if not found
 */
function getStationNameFromCode(code: string): string {
  return stationCodeMap[code] || code;
}

// Define an interface for the TransitDocs API response
interface TransitDocsStop {
  code: string;
  miles: number;
  sched_arrive?: number;
  sched_depart?: number;
  arrive?: {
    variance: number;
    times_compared: string;
    type: 'ACTUAL' | 'ESTIMATED';
  };
  depart?: {
    variance: number;
    times_compared: string;
    type: 'ACTUAL' | 'ESTIMATED';
  };
  canceled: boolean;
}

interface TransitDocsPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  heading?: number;
  speed?: number;
}

interface TransitDocsResponse {
  train_id: string;
  railroad: string;
  origin_date: string;
  number: number;
  all_numbers: number[];
  name: string;
  origin: string;
  destination: string;
  partial_train: boolean;
  last_updated: number;
  current_timezone: string;
  threshold: number;
  disruption: boolean;
  total_miles: number;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
  };
  stops: TransitDocsStop[];
  points: TransitDocsPoint[];
}

/**
 * Generates an array of dates for today and the previous two days
 * @returns Array of date strings in YYYY/MM/DD format
 */
function generateDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  
  // Add today and the previous two days
  for (let i = 0; i < 3; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    dates.push(`${year}/${month}/${day}`);
  }
  
  console.log('dates = ', dates)

  return dates;
}

/**
 * Scrapes train status data for a specific date from the TransitDocs API
 * @param trainNumber The train number to scrape (3 or 4)
 * @param dateStr The date string in YYYY/MM/DD format
 * @returns A TrainStatus object or null if data couldn't be fetched
 */
async function scrapeTrainStatusForDate(trainNumber: string, dateStr: string): Promise<TrainStatus | null> {
  try {
    console.log(`Fetching data for train #${trainNumber} on ${dateStr}...`);
    
    // Construct the API URL
    const url = `https://asm-backend.transitdocs.com/train/${dateStr}/AMTRAK/${trainNumber}?points=true`;
    
    // Fetch the data from the API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`TransitDocs API returned status ${response.status} for ${dateStr}: ${response.statusText}`);
      return null;
    }
    
    const data = await response.json() as TransitDocsResponse;
    
    // Check if we have valid data
    if (!data || !data.stops || !Array.isArray(data.stops) || data.stops.length === 0) {
      console.warn(`Incomplete data found in TransitDocs API response for ${dateStr}`);
      return null;
    }
    
    // Find the current location and next station
    const currentStop = findLastActualStop(data.stops);
    const nextStop = findNextStopAfterLastActual(data.stops);
    
    if (!currentStop || !nextStop) {
      console.warn(`Could not determine current or next station from TransitDocs API data for ${dateStr}`);
      return null;
    }
    
    // Get the station codes and convert to full names
    const currentStationCode = currentStop.code;
    const nextStationCode = nextStop.code;
    const currentLocation = getStationNameFromCode(currentStationCode);
    const nextStation = getStationNameFromCode(nextStationCode);
    
    // Get the scheduled arrival/departure time
    const scheduledTime = nextStop.sched_arrive || nextStop.sched_depart;
    
    // Calculate the estimated arrival time
    let estimatedArrival: number | undefined;
    if (scheduledTime) {
      // Check if variance is defined (including zero), not just truthy
      const variance = nextStop.arrive?.variance !== undefined ? nextStop.arrive.variance : 0;
      estimatedArrival = scheduledTime - variance;
    }
    
    // Determine the delay in minutes
    let delayMinutes = 0;
    if (nextStop.arrive?.variance) {
      // Convert variance (in seconds) to minutes
      delayMinutes = Math.abs(Math.floor(nextStop.arrive.variance / 60));
    }
    
    // Determine the train status
    let status = 'On Time';
    if (nextStop.arrive?.variance) {
      if (nextStop.arrive.variance > 600) { // More than 10 minutes late
        status = 'Delayed';
      } else if (nextStop.arrive.variance < -600) { // More than 10 minutes early
        status = 'Early';
      }
    }
    
    // Create a unique instance ID based on the date and train number
    const dateParts = dateStr.split('/');
    const instanceId = parseInt(`${dateParts[0]}${dateParts[1]}${dateParts[2]}${trainNumber}`);
    
    // Create a TrainStatus object
    const trainStatus: TrainStatus = {
      trainId: trainNumber,
      instanceId: instanceId,
      currentLocation: currentLocation,
      nextStation: nextStation,
      status: status,
      lastUpdated: new Date(data.last_updated * 1000).toISOString(),
      estimatedArrival: estimatedArrival,
      scheduledTime: scheduledTime, // Add the scheduled time
      delayMinutes: delayMinutes,
      timezone: data.current_timezone,
      direction: trainNumber === '3' ? 'westbound' : 'eastbound',
      isNext: true, // Will be determined later based on all trains
      date: dateStr.replace(/\//g, '-') // Add date information for display
    };
    
    console.log(`Successfully fetched data for train #${trainNumber} on ${dateStr}`);
    return trainStatus;
  } catch (error) {
    console.error(`Error fetching data for train #${trainNumber} on ${dateStr}:`, error);
    return null;
  }
}

/**
 * Scrapes train status data from the TransitDocs API for multiple dates
 * @param trainNumber The train number to scrape (3 or 4)
 * @returns An array of TrainStatus objects
 */
export async function scrapeTransitDocsTrainStatus(trainNumber: string): Promise<TrainStatus[]> {
  try {
    console.log(`Scraping TransitDocs API for train #${trainNumber}...`);
    
    // Generate dates for today and the previous two days
    const dates = generateDates();
    
    // Fetch data for all dates in parallel
    const promises = dates.map(dateStr => scrapeTrainStatusForDate(trainNumber, dateStr));
    const results = await Promise.all(promises);
    
    console.log('results = ', results)

    // Filter out null results and sort by date (most recent first)
    const trainStatuses = results.filter(result => result !== null) as TrainStatus[];
    
    // Process all train instances
    if (trainStatuses.length > 0) {
      // Sort by instanceId (which includes the date) in descending order
      trainStatuses.sort((a, b) => b.instanceId - a.instanceId);
      
      // Mark all trains as valid instances, with the most recent one as primary
      trainStatuses.forEach((status, index) => {
        status.isNext = index === 0; // Only the most recent is marked as primary
      });
    }
    
    console.log(`Successfully scraped TransitDocs API for train #${trainNumber}, found ${trainStatuses.length} instances`);
    return trainStatuses;
  } catch (error) {
    console.error(`Error scraping TransitDocs API for train #${trainNumber}:`, error);
    throw error;
  }
}

/**
 * Finds the last stop with ACTUAL type in either arrive or depart
 * @param stops The stops array from the TransitDocs API response
 * @returns The last stop with ACTUAL type or undefined if not found
 */
function findLastActualStop(stops: TransitDocsStop[]): TransitDocsStop | undefined {
  if (!stops || !Array.isArray(stops) || stops.length === 0) {
    return undefined;
  }
  
  // Find the last stop that has ACTUAL type in either arrive or depart
  for (let i = stops.length - 1; i >= 0; i--) {
    const stop = stops[i];
    if ((stop.arrive && stop.arrive.type === 'ACTUAL') || 
        (stop.depart && stop.depart.type === 'ACTUAL')) {
      return stop;
    }
  }
  
  // If no stop with ACTUAL type is found, return the first stop
  return stops[0];
}

/**
 * Finds the next stop after the last stop with ACTUAL status
 * @param stops The stops array from the TransitDocs API response
 * @returns The next stop after the last ACTUAL stop or undefined if not found
 */
function findNextStopAfterLastActual(stops: TransitDocsStop[]): TransitDocsStop | undefined {
  if (!stops || !Array.isArray(stops) || stops.length === 0) {
    return undefined;
  }
  
  // Find the last stop with ACTUAL type first
  const lastActualStopIndex = findLastActualStopIndex(stops);
  
  if (lastActualStopIndex === -1) {
    // If no ACTUAL stop found, return the first stop
    return stops[0];
  }
  
  // The next stop is the one after the last actual stop
  if (lastActualStopIndex < stops.length - 1) {
    return stops[lastActualStopIndex + 1];
  }
  
  // If we're at the last stop, return it
  return stops[stops.length - 1];
}

/**
 * Finds the index of the last stop with ACTUAL type in either arrive or depart
 * @param stops The stops array from the TransitDocs API response
 * @returns The index of the last stop with ACTUAL type or -1 if not found
 */
function findLastActualStopIndex(stops: TransitDocsStop[]): number {
  if (!stops || !Array.isArray(stops) || stops.length === 0) {
    return -1;
  }
  
  // Find the last stop that has ACTUAL type in either arrive or depart
  for (let i = stops.length - 1; i >= 0; i--) {
    const stop = stops[i];
    if ((stop.arrive && stop.arrive.type === 'ACTUAL') || 
        (stop.depart && stop.depart.type === 'ACTUAL')) {
      return i;
    }
  }
  
  return -1;
}

/**
 * Finds the next stop based on the current location
 * @param stops The stops array from the TransitDocs API response
 * @param currentLocation The current location of the train
 * @returns The next stop or undefined if not found
 */
export function findNextStop(stops: TransitDocsStop[], currentLocation: { latitude: number, longitude: number }): TransitDocsStop | undefined {
  if (!stops || !Array.isArray(stops) || stops.length === 0 || !currentLocation) {
    return undefined;
  }
  
  // Find the last stop with ACTUAL type first
  const lastActualStopIndex = findLastActualStopIndex(stops);
  
  if (lastActualStopIndex === -1) {
    // If no ACTUAL stop found, return the first stop
    return stops[0];
  }
  
  // The next stop is the one after the last actual stop
  if (lastActualStopIndex < stops.length - 1) {
    return stops[lastActualStopIndex + 1];
  }
  
  // If we're at the last stop, return it
  return stops[stops.length - 1];
}
