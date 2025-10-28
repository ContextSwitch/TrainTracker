import { TrainStatus } from '../types';
import { scrapeTransitDocsTrainStatus } from './transitdocs-scraper';
import { logger } from './logger';

/**
 * Scrapes train status data using the TransitDocs API
 * @param url The URL parameter is kept for backward compatibility but is not used
 * @param trainId The train ID ('3' or '4')
 * @returns Promise with an array of train status data for all instances of this train
 */
export async function scrapeTrainStatus(url: string, trainId: string): Promise<TrainStatus[]> {
  try {
    logger.scrapeStart(trainId, 'TransitDocs API');
    const result = await scrapeTransitDocsTrainStatus(trainId);
    logger.scrapeSuccess(trainId, result.length);
    return result;
  } catch (error) {
    logger.scrapeError(trainId, error);
    return [];
  }
}
