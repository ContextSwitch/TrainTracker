import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurrentStatus } from '../../app/types';

/**
 * API route to get the current train status
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<CurrentStatus>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  
  try {
    // Path to the current status file
    const dataPath = path.join(process.cwd(), 'data', 'current_status.json');
    
    // Check if the file exists
    if (!fs.existsSync(dataPath)) {
      // Return a default status if the file doesn't exist
      return res.status(200).json({
        train3: { approaching: false },
        train4: { approaching: false },
        lastUpdated: new Date().toISOString()
      });
    }
    
    // Read the file
    const data = fs.readFileSync(dataPath, 'utf8');
    
    // Parse the JSON
    const currentStatus: CurrentStatus = JSON.parse(data);
    
    // Return the current status
    res.status(200).json(currentStatus);
  } catch (error) {
    console.error('Error reading current status file:', error);
    
    // Return a default status in case of error
    res.status(200).json({
      train3: { approaching: false },
      train4: { approaching: false },
      lastUpdated: new Date().toISOString()
    });
  }
}
