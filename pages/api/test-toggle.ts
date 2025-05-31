import type { NextApiRequest, NextApiResponse } from 'next';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import { appConfig } from '../../app/config';

/**
 * API endpoint for testing the scraper toggle functionality
 * This is a development/testing endpoint only
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the train ID and scraper type from the query parameters
    const { trainId = '3', scraperType } = req.query;
    
    // Validate train ID
    if (typeof trainId !== 'string' || !['3', '4'].includes(trainId)) {
      return res.status(400).json({ 
        error: 'Invalid train ID. Must be "3" or "4".' 
      });
    }
    
    // Validate scraper type if provided
    if (scraperType !== undefined && 
        typeof scraperType === 'string' && 
        !['dixieland', 'transitdocs'].includes(scraperType)) {
      return res.status(400).json({ 
        error: 'Invalid scraper type. Must be "dixieland" or "transitdocs".' 
      });
    }
    
    // Store the original scraper type
    const originalScraperType = appConfig.scraperType;
    
    // Temporarily set the scraper type if provided
    if (scraperType && typeof scraperType === 'string') {
      // Use type assertion to override the type checking for this test file
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (appConfig as any).scraperType = scraperType;
    }
    
    console.log(`Testing scraper (${appConfig.scraperType}) for train #${trainId}...`);
    
    // Scrape the train status using the configured scraper
    const trainStatus = await scrapeTrainStatus('', trainId);
    
    // Restore the original scraper type
    appConfig.scraperType = originalScraperType;
    
    // Return the results
    return res.status(200).json({
      success: true,
      trainId,
      scraperType: scraperType || originalScraperType,
      timestamp: new Date().toISOString(),
      trainStatus
    });
  } catch (error) {
    console.error('Error testing scraper toggle:', error);
    return res.status(500).json({
      error: 'Error testing scraper toggle',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
