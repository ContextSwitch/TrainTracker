import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API route to clear train status data
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    // Path to the train status file
    const trainStatusFile = path.join(process.cwd(), 'data', 'train_status.json');
    
    // Create an empty train status object
    const emptyTrainStatus = {
      "3": [],
      "4": []
    };
    
    // Write the empty train status to the file
    fs.writeFileSync(trainStatusFile, JSON.stringify(emptyTrainStatus, null, 2));
    
    // Also clear the current_status.json file
    const currentStatusFile = path.join(process.cwd(), 'data', 'current_status.json');
    const emptyCurrentStatus = {
      train3: { approaching: false },
      train4: { approaching: false },
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(currentStatusFile, JSON.stringify(emptyCurrentStatus, null, 2));
    
    // Return success
    res.status(200).json({ 
      success: true, 
      message: 'Train status data cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing train status data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
