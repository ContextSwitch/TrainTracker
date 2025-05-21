import { TrainStatus } from '../types';
import { scrapeAmtrakTrainStatus } from './amtrak-scraper';
// Import removed as it's not used

// List of stations with railcams (used for reference)
// const railcamStations = ['Mendota', 'Galesburg', 'Fort Madison', 'La Plata', 'Kansas City', 'Lawrence', 'Las Vegas', 'Gallup','Winslow','Flagstaff', 'Kingman', 'Needles', 'Barstow', 'Fullerton'];

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
 * Mocks train status data for development/testing
 * @param trainId The train ID ('3' or '4')
 * @returns Mocked train status data
 */
export function mockTrainStatus(trainId: string): TrainStatus[] {
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
