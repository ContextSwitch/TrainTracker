import { TrainStatus } from '../types';
import { scrapeTransitDocsTrainStatus } from './transitdocs-scraper';

/**
 * Scrapes train status data using the TransitDocs API
 * @param url The URL parameter is kept for backward compatibility but is not used
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances of this train
 */
export async function scrapeTrainStatus(url: string, trainId: string): Promise<TrainStatus[]> {
  try {
    console.log(`Scraping train status for train #${trainId} from TransitDocs API`);
    return await scrapeTransitDocsTrainStatus(trainId);
  } catch (error) {
    console.error(`Error scraping train status for train #${trainId}:`, error);
    return [];
  }
}
