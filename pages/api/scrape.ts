import type { NextApiRequest, NextApiResponse } from 'next';
import { appConfig } from '../../app/config';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import { saveTrainStatus } from '../../app/utils/storage';

type ScrapeResponse = {
  success: boolean;
  message: string;
  trainIds?: string[];
};

/**
 * API route to trigger a scrape of the train data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapeResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  
  // Check for API key if this were a production app
  // const apiKey = req.headers['x-api-key'];
  // if (!apiKey || apiKey !== process.env.API_KEY) {
  //   res.status(401).json({ success: false, message: 'Unauthorized' });
  //   return;
  // }
  
  try {
    // Get the train IDs to scrape (default to both)
    const trainIds = req.body.trainIds || ['3', '4'];
    
    // Use mock data for development/testing if specified
    const useMockData = req.body.useMockData === true;
    
    // Scrape data for each train
    for (const trainId of trainIds) {
      let trainStatus;
      

        // Scrape real data
        const url = appConfig.trainUrls[trainId as '3' | '4'];
        trainStatus = await scrapeTrainStatus(url, trainId);
      
      
      // Save the train statuses if we got data
      if (trainStatus && trainStatus.length > 0) {
        for (const status of trainStatus) {
          saveTrainStatus(status);
        }
      }
    }
    
    // Return success
    res.status(200).json({
      success: true,
      message: `Successfully scraped data for train(s): ${trainIds.join(', ')}`,
      trainIds
    });
  } catch (error) {
    console.error('Error scraping train data:', error);
    res.status(500).json({
      success: false,
      message: `Error scraping train data: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
