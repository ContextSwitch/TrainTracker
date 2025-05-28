import type { NextApiRequest, NextApiResponse } from 'next';
import { scrapeTransitDocsTrainStatus } from '../../app/utils/transitdocs-scraper';

/**
 * API endpoint for testing the TransitDocs API scraper
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
    // Get the train ID from the query parameters
    const { trainId = '3' } = req.query;
    
    // Validate train ID
    if (typeof trainId !== 'string' || !['3', '4'].includes(trainId)) {
      return res.status(400).json({ 
        error: 'Invalid train ID. Must be "3" or "4".' 
      });
    }
    
    console.log(`Testing TransitDocs API scraper for train #${trainId}...`);
    
    // Scrape the train status using the TransitDocs API
    const trainStatus = await scrapeTransitDocsTrainStatus(trainId);
    
    // Return the results
    return res.status(200).json({
      success: true,
      trainId,
      timestamp: new Date().toISOString(),
      trainStatus
    });
  } catch (error) {
    console.error('Error testing TransitDocs API scraper:', error);
    return res.status(500).json({
      error: 'Error testing TransitDocs API scraper',
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
