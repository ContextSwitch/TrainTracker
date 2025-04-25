import fs from 'fs';
import path from 'path';
import { TrainStatus, CurrentStatus, TrainApproaching } from '../types';
import { checkTrainApproaching } from './predictions';

// Path to the data directory
const DATA_DIR = path.join(process.cwd(), 'data');

// Path to the train status file
const TRAIN_STATUS_FILE = path.join(DATA_DIR, 'train_status.json');

// Path to the current status file
const CURRENT_STATUS_FILE = path.join(DATA_DIR, 'current_status.json');

/**
 * Ensures the data directory exists
 */
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Saves train status data to the file system
 * @param trainStatus The train status to save
 */
export function saveTrainStatus(trainStatus: TrainStatus): void {
  ensureDataDir();
  
  // Read existing data
  let trainData: Record<string, TrainStatus[]> = {};
  if (fs.existsSync(TRAIN_STATUS_FILE)) {
    try {
      const data = fs.readFileSync(TRAIN_STATUS_FILE, 'utf8');
      trainData = JSON.parse(data);
    } catch (error) {
      console.error('Error reading train status file:', error);
    }
  }
  
  // For this demo, we'll use fixed train instances instead of adding new ones
  // This ensures we have the correct number of train instances for each train
  if (trainStatus.trainId === '3') {
    // For Train #3, we'll have 1 instance
    if (!trainData['3']) {
      trainData['3'] = [];
    }
    
    // Check if we already have an instance with this nextStation
    const existingIndex = trainData['3'].findIndex(
      status => status.nextStation === trainStatus.nextStation
    );
    
    if (existingIndex >= 0) {
      // Update the existing instance
      trainData['3'][existingIndex] = trainStatus;
    } else {
      // Add as a new instance if we have less than 1
      if (trainData['3'].length < 1) {
        trainData['3'].push(trainStatus);
      } else {
        // Replace the first instance
        trainData['3'][0] = trainStatus;
      }
    }
  } else if (trainStatus.trainId === '4') {
    // For Train #4, we'll have 2 instances
    if (!trainData['4']) {
      trainData['4'] = [];
    }
    
    // Check if we already have an instance with this nextStation
    const existingIndex = trainData['4'].findIndex(
      status => status.nextStation === trainStatus.nextStation
    );
    
    if (existingIndex >= 0) {
      // Update the existing instance
      trainData['4'][existingIndex] = trainStatus;
    } else {
      // Add as a new instance if we have less than 2
      if (trainData['4'].length < 2) {
        trainData['4'].push(trainStatus);
      } else {
        // If we already have 2 instances, replace the one with the same nextStation or the first one
        const sameStationIndex = trainData['4'].findIndex(
          status => status.nextStation === trainStatus.nextStation
        );
        
        if (sameStationIndex >= 0) {
          trainData['4'][sameStationIndex] = trainStatus;
        } else {
          // Replace the first instance
          trainData['4'][0] = trainStatus;
        }
      }
    }
  }
  
  // Write the data back to the file
  try {
    fs.writeFileSync(TRAIN_STATUS_FILE, JSON.stringify(trainData, null, 2));
  } catch (error) {
    console.error('Error writing train status file:', error);
  }
  
  // Update the current status
  updateCurrentStatus();
}

/**
 * Gets the latest train status for a specific train
 * @param trainId The train ID ('3' or '4')
 * @returns The latest train status or null if not found
 */
export function getLatestTrainStatus(trainId: string): TrainStatus | null {
  if (!fs.existsSync(TRAIN_STATUS_FILE)) {
    return null;
  }
  
  try {
    const data = fs.readFileSync(TRAIN_STATUS_FILE, 'utf8');
    const trainData: Record<string, TrainStatus[]> = JSON.parse(data);
    
    if (trainData[trainId] && trainData[trainId].length > 0) {
      return trainData[trainId][0];
    }
  } catch (error) {
    console.error('Error reading train status file:', error);
  }
  
  return null;
}

/**
 * Updates the current status file based on the latest train status
 */
export function updateCurrentStatus(): void {
  ensureDataDir();
  
  // Read all train statuses
  let trainData: Record<string, TrainStatus[]> = {};
  if (fs.existsSync(TRAIN_STATUS_FILE)) {
    try {
      const data = fs.readFileSync(TRAIN_STATUS_FILE, 'utf8');
      trainData = JSON.parse(data);
    } catch (error) {
      console.error('Error reading train status file:', error);
    }
  }
  
  // Get all train instances
  const train3Statuses = trainData['3'] || [];
  const train4Statuses = trainData['4'] || [];
  
  // Calculate if any train is approaching a railcam
  let train3Approaching: TrainApproaching = { approaching: false };
  let train4Approaching: TrainApproaching = { approaching: false };
  
  // For train #3, check all instances and use the one that will arrive at a railcam first
  if (train3Statuses.length > 0) {
    const approachingTrains = train3Statuses
      .map(status => ({ status, approaching: checkTrainApproaching(status) }))
      .filter(item => item.approaching.approaching);
    
    if (approachingTrains.length > 0) {
      // Sort by minutes away and use the closest one
      approachingTrains.sort((a, b) => 
        (a.approaching.minutesAway || Infinity) - (b.approaching.minutesAway || Infinity)
      );
      train3Approaching = approachingTrains[0].approaching;
    }
  }
  
  // For train #4, check all instances and use the one that will arrive at a railcam first
  if (train4Statuses.length > 0) {
    const approachingTrains = train4Statuses
      .map(status => ({ status, approaching: checkTrainApproaching(status) }))
      .filter(item => item.approaching.approaching);
    
    if (approachingTrains.length > 0) {
      // Sort by minutes away and use the closest one
      approachingTrains.sort((a, b) => 
        (a.approaching.minutesAway || Infinity) - (b.approaching.minutesAway || Infinity)
      );
      train4Approaching = approachingTrains[0].approaching;
    }
  }
  
  // Create the current status object
  const currentStatus: CurrentStatus = {
    train3: train3Approaching,
    train4: train4Approaching,
    lastUpdated: new Date().toISOString()
  };
  
  // Write the current status to the file
  try {
    fs.writeFileSync(CURRENT_STATUS_FILE, JSON.stringify(currentStatus, null, 2));
  } catch (error) {
    console.error('Error writing current status file:', error);
  }
}

/**
 * Gets the current status
 * @returns The current status or a default status if not found
 */
export function getCurrentStatus(): CurrentStatus {
  if (!fs.existsSync(CURRENT_STATUS_FILE)) {
    return {
      train3: { approaching: false },
      train4: { approaching: false },
      lastUpdated: new Date().toISOString()
    };
  }
  
  try {
    const data = fs.readFileSync(CURRENT_STATUS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading current status file:', error);
    return {
      train3: { approaching: false },
      train4: { approaching: false },
      lastUpdated: new Date().toISOString()
    };
  }
}
