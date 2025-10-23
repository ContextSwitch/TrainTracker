import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../app/utils/auth-server';
import { scrapeTransitDocsTrainStatus } from '../../app/utils/transitdocs-scraper';
import { TrainStatus } from '../../app/types';

type TestScraperResponse = {
  success: boolean;
  data?: {
    train3: TrainStatus[];
    train4: TrainStatus[];
  };
  scraperType?: string;
  error?: string;
};

/**
 * API endpoint for testing the scraper with a specific scraper type
 * POST: Tests the scraper with the specified scraper type
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestScraperResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  // Check if the user is authenticated as an admin
  try {
    // Check for auth header (set by client-side code when using localStorage)
    const authHeader = req.headers['x-admin-auth'];
    if (authHeader !== 'true') {
      // Get the admin user from the request cookies
      const token = req.cookies.admin_token;
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - No token found'
        });
      }
      
      const user = verifyToken(token);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized - Invalid token'
        });
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Authentication error'
    });
  }

  // Get the scraper type from the request body
  const { scraperType } = req.body;

  // Check if the scraper type is provided
  if (!scraperType) {
    return res.status(400).json({
      success: false,
      error: 'Missing scraper type'
    });
  }

  // Check if the scraper type is valid
  if (scraperType !== 'transitdocs') {
    return res.status(400).json({
      success: false,
      error: 'Invalid scraper type. Must be "transitdocs".'
    });
  }

  try {
    // Test the scraper with the specified scraper type
    const data: {
      train3: TrainStatus[];
      train4: TrainStatus[];
    } = {
      train3: [],
      train4: []
    };

    // Test the TransitDocs scraper
    console.log('Testing TransitDocs scraper...');
    data.train3 = await scrapeTransitDocsTrainStatus('3');
    data.train4 = await scrapeTransitDocsTrainStatus('4');

    // Return the results
    return res.status(200).json({
      success: true,
      data,
      scraperType
    });
  } catch (error) {
    console.error(`Error testing ${scraperType} scraper:`, error);
    return res.status(500).json({
      success: false,
      error: `Error testing scraper: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}
