import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set cache control headers to prevent caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the path to the JSON file
    const filePath = path.join(process.cwd(), 'data', 'train_status.json');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Train status data not found' });
    }
    
    // Read the file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the JSON to validate it
    const jsonData = JSON.parse(fileContent);
    
    // Set the content type header
    res.setHeader('Content-Type', 'application/json');
    
    // Return the JSON data
    return res.status(200).json(jsonData);
  } catch (error) {
    console.error('Error reading train status data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
