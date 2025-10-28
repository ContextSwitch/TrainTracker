import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../app/utils/auth-server';
import { loadStationsFromFile, saveStationsToFile } from '../../../app/utils/server-config';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check authentication
  try {
    const authHeader = req.headers['x-admin-auth'];
    if (authHeader !== 'true') {
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

  // Only allow GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GET: Return the current stations configuration
    if (req.method === 'GET') {
      const stations = loadStationsFromFile();
      
      return res.status(200).json({ 
        success: true,
        stations: stations 
      });
    }
    
    // PUT: Update the stations configuration
    if (req.method === 'PUT') {
      const { stations } = req.body;
      
      if (!stations || !Array.isArray(stations)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid stations data - must be an array' 
        });
      }

      // Validate each station
      for (const station of stations) {
        if (!station.name || typeof station.name !== 'string') {
          return res.status(400).json({ 
            success: false,
            error: 'Each station must have a valid name' 
          });
        }
        if (!station.youtubeLink || typeof station.youtubeLink !== 'string') {
          return res.status(400).json({ 
            success: false,
            error: 'Each station must have a valid youtubeLink' 
          });
        }
        // Set default enabled value if not provided
        if (station.enabled === undefined) {
          station.enabled = true;
        }
      }

      // Save the stations using the server-side function
      saveStationsToFile(stations);
      
      return res.status(200).json({ 
        success: true,
        message: 'Stations configuration updated successfully',
        stations: stations
      });
    }
  } catch (error) {
    console.error('Error handling stations configuration:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
}
