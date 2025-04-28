import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { appConfig } from '../../app/config';
import { RailcamStation, TrainStatus } from '../../app/types';

/**
 * API route to get the list of railcam stations or train status data
 */
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<RailcamStation[] | TrainStatus[]>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  
  // Check if a trainId is provided
  const { trainId } = req.query;
  
  if (trainId) {
    // Return the train status data for the specified train
    try {
      // Path to the train status file
      const trainStatusFile = path.join(process.cwd(), 'data', 'train_status.json');
      
      // Check if the file exists
      if (!fs.existsSync(trainStatusFile)) {
        return res.status(404).json([]);
      }
      
      // Read the file
      const data = fs.readFileSync(trainStatusFile, 'utf8');

      if(data){
        const trainData = JSON.parse(data);
      
        // Return the train status data for the specified train
        if (trainData[trainId as string]) {
          return res.status(200).json(trainData[trainId as string]);
        } else {
          return res.status(404).json([]);
        } 
      }

    } catch (error) {
      console.error('Error reading train status file:', error);
      return res.status(500).json([]);
    }
  } else {
    // Return the list of stations
    return res.status(200).json(appConfig.stations);
  }
}
