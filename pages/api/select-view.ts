import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurrentStatus, RailcamStation } from '../../app/types';
import { appConfig, getStationByName, getYoutubeEmbedUrl } from '../../app/config';

/**
 * API route to update the current viewing selection
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  
  try {
    // Get the train ID and station name from the request body
    const { trainId, stationName } = req.body;
    
    if (!trainId || !stationName) {
      return res.status(400).json({ error: 'Train ID and station name are required' });
    }
    
    // Find the station by name
    const station = getStationByName(stationName);
    
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    
    // Path to the current status file
    const dataPath = path.join(process.cwd(), 'data', 'current_status.json');
    
    // Read the current status file
    let currentStatus: CurrentStatus;
    
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      currentStatus = JSON.parse(data);
    } else {
      currentStatus = {
        train3: { approaching: false },
        train4: { approaching: false },
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Update the current status based on the train ID
    if (trainId === '3') {
      currentStatus.train3 = {
        approaching: true,
        station,
        eta: new Date().toISOString(), // This would normally be the actual ETA
        minutesAway: 0, // This would normally be calculated based on the ETA
        youtubeLink: getYoutubeEmbedUrl(station.youtubeLink)
      };
      
      // If we're selecting train 3, make sure train 4 is not selected
      if (currentStatus.train4.approaching && currentStatus.train4.station?.name === stationName) {
        currentStatus.train4.approaching = false;
      }
    } else if (trainId === '4') {
      currentStatus.train4 = {
        approaching: true,
        station,
        eta: new Date().toISOString(), // This would normally be the actual ETA
        minutesAway: 0, // This would normally be calculated based on the ETA
        youtubeLink: getYoutubeEmbedUrl(station.youtubeLink)
      };
      
      // If we're selecting train 4, make sure train 3 is not selected
      if (currentStatus.train3.approaching && currentStatus.train3.station?.name === stationName) {
        currentStatus.train3.approaching = false;
      }
    } else {
      return res.status(400).json({ error: 'Invalid train ID' });
    }
    
    // Update the last updated timestamp
    currentStatus.lastUpdated = new Date().toISOString();
    
    // Write the updated status back to the file
    fs.writeFileSync(dataPath, JSON.stringify(currentStatus, null, 2));
    
    // Return the updated status
    res.status(200).json(currentStatus);
  } catch (error) {
    console.error('Error updating current status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
