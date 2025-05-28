import type { NextApiRequest, NextApiResponse } from 'next';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import { appConfig } from '../../app/config';

// Set the scraper type to transitdocs for testing
appConfig.scraperType = 'transitdocs';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  
  try {
    // Use the scraper to get train data for train #3
    console.log('Scraping data for train #3 using TransitDocs API...');
    const train3Statuses = await scrapeTrainStatus(appConfig.trainUrls['3'], '3');
    console.log(`Found ${train3Statuses.length} statuses for train #3`);
    
    // Return the train status data
    res.status(200).json({
      success: true,
      message: 'Successfully scraped train data using TransitDocs API',
      scraperType: appConfig.scraperType,
      data: train3Statuses
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: `Error scraping train data: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
