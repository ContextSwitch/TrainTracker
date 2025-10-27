import { NextApiRequest, NextApiResponse } from 'next';
import { loadStationsFromFile } from '../../app/utils/server-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Load stations from file
    const stations = loadStationsFromFile();
    
    return res.status(200).json({ 
      success: true,
      stations: stations 
    });
  } catch (error) {
    console.error('Error loading stations configuration:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
