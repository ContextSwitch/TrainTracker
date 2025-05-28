import type { NextApiRequest, NextApiResponse } from 'next';
import { scrapeAmtrakTrainStatus } from '../../app/utils/amtrak-scraper';

type ResponseData = {
  success: boolean;
  message: string;
  scraperType: string;
  data?: any;
  error?: string;
};

/**
 * API endpoint to test the Dixieland scraper with a flag
 * GET: Scrapes train data from the Dixieland website
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed',
      scraperType: 'dixieland',
      error: 'Only GET requests are allowed'
    });
  }
  
  try {
    // Get the train ID from the query parameters, default to '3'
    const trainId = req.query.trainId as string || '3';
    
    console.log(`Scraping data for train #${trainId} using Dixieland scraper...`);
    
    // Scrape the train status data
    const trainStatusData = await scrapeAmtrakTrainStatus(trainId);
    
    // Check if we got any data
    if (!trainStatusData || trainStatusData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No train data found',
        scraperType: 'dixieland',
        error: 'Could not retrieve train data from Dixieland website'
      });
    }
    
    // Return the data
    return res.status(200).json({
      success: true,
      message: 'Successfully scraped train data using Dixieland scraper',
      scraperType: 'dixieland',
      data: trainStatusData
    });
  } catch (error) {
    console.error('Error in test-dixieland-flag API:', error);
    return res.status(500).json({
      success: false,
      message: 'Error scraping train data',
      scraperType: 'dixieland',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
