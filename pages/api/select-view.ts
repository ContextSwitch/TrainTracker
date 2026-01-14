import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurrentStatus, TrainStatus } from '../../app/types';
import { getYoutubeEmbedUrl } from '../../app/config';
import { loadStationsFromFile } from '../../app/utils/server-config';

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
    
    // Load stations from file and find the station by name
    const stations = loadStationsFromFile();
    const station = stations.find(s => {
      if (!stationName) return false;
      
      // Clean up the name by removing state abbreviations and commas
      const cleanName = stationName.replace(/,\s*[A-Z]{2}$/, '').trim();
      
      // Special case for Kansas City
      if (cleanName === 'Kansas City') {
        return s.name.startsWith('Kansas City');
      }
      
      // First try exact match
      if (s.name.toLowerCase() === cleanName.toLowerCase()) {
        return true;
      }
      
      // If no exact match, try partial match with the city name only
      const cityName = cleanName.split(' - ')[0].trim();
      const stationCity = s.name.split(' - ')[0].trim().toLowerCase();
      if (stationCity === cityName.toLowerCase() || 
          stationCity.includes(cityName.toLowerCase()) || 
          cityName.toLowerCase().includes(stationCity)) {
        return true;
      }
      
      // If still no match, try a more general partial match
      return s.name.toLowerCase().includes(cleanName.toLowerCase()) ||
             cleanName.toLowerCase().includes(s.name.toLowerCase());
    });
    
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
        westboundTrain: { approaching: false },
        eastboundTrain: { approaching: false },
        lastUpdated: new Date().toISOString()
      };
    }
    
    // Try to get the train status data to preserve accurate ETA and minutesAway
    let estimatedArrivalTime = new Date().toISOString();
    let minutesUntilArrival = 0;
    
    try {
      // Get the train status data
      const trainStatusPath = path.join(process.cwd(), 'data', 'train_status.json');
      
      if (fs.existsSync(trainStatusPath)) {
        const data = fs.readFileSync(trainStatusPath, 'utf8');
        const trainStatusData = JSON.parse(data);
        
        // Get the train statuses for the selected train
        const relevantTrainStatuses = trainStatusData[trainId] || [];
        
        // Find the train status for the selected station
        const selectedTrainStatus = relevantTrainStatuses.find((status: TrainStatus) => 
          status?.nextStation && 
          (status.nextStation.toLowerCase() === stationName.toLowerCase() ||
           stationName.toLowerCase().includes(status.nextStation.toLowerCase()) ||
           status.nextStation.toLowerCase().includes(stationName.toLowerCase()))
        );
        
        // Calculate accurate ETA and minutesAway
        if (selectedTrainStatus && selectedTrainStatus.estimatedArrival) {
          estimatedArrivalTime = selectedTrainStatus.estimatedArrival;
          const currentTime = new Date();
          const arrivalDate = new Date(estimatedArrivalTime);
          minutesUntilArrival = Math.floor((arrivalDate.getTime() - currentTime.getTime()) / (1000 * 60));
          if(minutesUntilArrival < -900){
            minutesUntilArrival += 1440;
          }

        } else {
          console.log('No matching train status found, using current time as ETA');
        }
      }
    } catch (err) {
      console.error('Error reading train status data:', err);
      // Continue with default values if there's an error
    }
    
    // Update the current status based on the train ID
    if (trainId === '3') {
      currentStatus.westboundTrain = {
        approaching: true,
        station,
        eta: estimatedArrivalTime,
        minutesAway: minutesUntilArrival,
        youtubeLink: getYoutubeEmbedUrl(station.youtubeLink)
      };
      
      // If we're selecting train 3, make sure train 4 is not selected
      if (currentStatus.eastboundTrain?.approaching && currentStatus.eastboundTrain?.station?.name === stationName) {
        currentStatus.eastboundTrain.approaching = false;
      }
    } else if (trainId === '4') {
      currentStatus.eastboundTrain = {
        approaching: true,
        station,
        eta: estimatedArrivalTime,
        minutesAway: minutesUntilArrival,
        youtubeLink: getYoutubeEmbedUrl(station.youtubeLink)
      };
      
      // If we're selecting train 4, make sure train 3 is not selected
      if (currentStatus.westboundTrain?.approaching && currentStatus.westboundTrain?.station?.name === stationName) {
        currentStatus.westboundTrain.approaching = false;
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
