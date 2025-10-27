import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { appConfig, updateStations } from '../../app/config';
import { scrapeTrainStatus } from '../../app/utils/scraper';
import { TrainStatus, CurrentStatus, TrainApproaching } from '../../app/types/index';
import { checkTrainApproaching } from '../../app/utils/predictions';
import { loadStationsFromFile } from '../../app/utils/server-config';


type CronResponse = {
  success: boolean;
  message: string;
  lastRun?: string;
};

// Initialize logging
const initLog = () => {
  console.log('Cron API initialized');
};
initLog();

// Track the last time the cron job was run
let lastRun: Date | null = null;

/**
 * API route for a cron job to update train data
 * This can be called by an external cron service (e.g., cron-job.org)
 * or by the frontend at regular intervals
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CronResponse>
) {
  console.log('in cron')
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).end();
    return;
  }
  
  // Check if it's been at least 15 minutes since the last run
  // This prevents excessive scraping if the cron job is called too frequently
  // Skip this check if the request has a 'force=true' query parameter
  const now = new Date();
  const forceUpdate = req.query.force === 'true';
  
  if (!forceUpdate && lastRun && (now.getTime() - lastRun.getTime()) < 15 * 60 * 1000) {
    console.log('skipping due to recent update')
    return res.status(200).json({
      success: true,
      message: 'Skipped update - last update was less than 15 minutes ago',
      lastRun: lastRun.toISOString()
    });
  }
  
  try {
    // Update the last run time
    lastRun = now;
    
    // Load the latest stations configuration from JSON file
    console.log('Loading stations configuration from JSON file...');
    const latestStations = loadStationsFromFile();
    updateStations(latestStations);
    console.log(`Loaded ${latestStations.length} stations from configuration`);
    
    // Use the scraper to get real data
    let train3Statuses: TrainStatus[] = [];
    let train4Statuses: TrainStatus[] = [];

    console.log(`Scraping data using ${appConfig.scraperType} scraper...`);

    // Use the scrapeTrainStatus function which will use the appropriate scraper based on config
    console.log('Scraping data for train #3...');
    const scraped3 = await scrapeTrainStatus('', '3');
    train3Statuses = scraped3;
    console.log(`Found ${scraped3.length} statuses for train #3`);

    console.log('Scraping data for train #4...');
    const scraped4 = await scrapeTrainStatus('', '4');
    train4Statuses = scraped4;
    console.log(`Found ${scraped4.length} statuses for train #4`);

    console.log('Scraping completed successfully');

    // Save the train status data
    saveTrains(train3Statuses);
    saveTrains(train4Statuses);
    
    // Update the current status
    updateCurrentStatus(train3Statuses[0], train4Statuses[0]);
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Successfully updated train data',
      lastRun: now.toISOString()
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    res.status(500).json({
      success: false,
      message: `Error updating train data: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

function saveTrains(trainStatus: TrainStatus[]){
  // Save each train status
  for(const status of trainStatus){
    saveTrainStatus(status);
  }
}

/**
 * Saves train status data to the file system
 * @param trainStatus The train status to save
 */
function saveTrainStatus(trainStatus: TrainStatus): void {
  // Ensure the data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Path to the train status file
  const trainStatusFile = path.join(dataDir, 'train_status.json');
  


  // Read existing data
  let trainData: Record<string, TrainStatus[]> = {};
  if (fs.existsSync(trainStatusFile)) {
    try {
      const data = fs.readFileSync(trainStatusFile, 'utf8');
      trainData = JSON.parse(data);
    } catch (error) {
      console.error('Error reading train status file:', error);
    }
  }
  
  // Update or add the train status to the data
  if (!trainData[trainStatus.trainId]) {
    trainData[trainStatus.trainId] = [];
  }
  
  // Check if this is a new instance or an update to an existing one
  const existingIndex = trainData[trainStatus.trainId].findIndex(
    status => status.instanceId === trainStatus.instanceId
  );
  
  if (existingIndex >= 0) {
    // Update existing instance
    trainData[trainStatus.trainId][existingIndex] = trainStatus;
  } else {
    // Add new instance
    trainData[trainStatus.trainId].push(trainStatus);
  }
  
  trainData = removeStaleData(trainData);

  // Write the data back to the file
  try {
    fs.writeFileSync(trainStatusFile, JSON.stringify(trainData, null, 2));
  } catch (error) {
    console.error('Error writing train status file:', error);
  }
}

function removeStaleData(trainData: Record<string, TrainStatus[]>): Record<string, TrainStatus[]> {


  trainData[3] = trainData[3].filter(train => train.trainId && train.nextStation != 'Los Angeles, CA');
  trainData[4] = trainData[4].filter(train => train.trainId && train.nextStation != 'Chicago, IL');

  return trainData;
}

/**
 * Updates the current status file based on the latest train status
 */
function updateCurrentStatus(train3Status: TrainStatus, train4Status: TrainStatus): void {
  // Ensure the data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  // Path to the current status file
  const currentStatusFile = path.join(dataDir, 'current_status.json');
  
  // Path to the train status file to get all train instances
  const trainStatusFile = path.join(dataDir, 'train_status.json');
  let allTrain4Statuses: TrainStatus[] = [];
  
  // Read existing train data to get all train #4 instances
  if (fs.existsSync(trainStatusFile)) {
    try {
      const data = fs.readFileSync(trainStatusFile, 'utf8');
      if(data){
        const trainData = JSON.parse(data);
        if (trainData['4'] && Array.isArray(trainData['4'])) {
          allTrain4Statuses = trainData['4'];
        }
      }

    } catch (error) {
      console.error('Error reading train status file:', error);
    }
  }
  
  // Calculate if either train is approaching a railcam
  const train3Approaching: TrainApproaching = checkTrainApproaching(train3Status);
  
  // For train #4, check all instances and use the one that will arrive at a railcam first
  let train4Approaching: TrainApproaching = checkTrainApproaching(train4Status);
  
  if (allTrain4Statuses.length > 1) {
    // Check each train #4 instance
    const approachingTrains = allTrain4Statuses
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
    fs.writeFileSync(currentStatusFile, JSON.stringify(currentStatus, null, 2));
  } catch (error) {
    console.error('Error writing current status file:', error);
  }
}
