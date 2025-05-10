import { DynamoDB } from 'aws-sdk';
import { TrainStatus, CurrentStatus } from '../types';

// Initialize DynamoDB client
const dynamoDB = new DynamoDB.DocumentClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

// Table names from environment variables
const TRAIN_STATUS_TABLE = process.env.TRAIN_STATUS_TABLE || 'TrainTracker-TrainStatus-dev';
const CURRENT_STATUS_TABLE = process.env.CURRENT_STATUS_TABLE || 'TrainTracker-CurrentStatus-dev';

/**
 * Save train status data to DynamoDB
 */
export async function saveTrainStatus(trainStatus: TrainStatus): Promise<void> {
  const params = {
    TableName: TRAIN_STATUS_TABLE,
    Item: {
      trainId: trainStatus.trainId,
      instanceId: Date.now(), // Use timestamp as instance ID for sorting
      status: trainStatus.status,
      direction: trainStatus.direction,
      currentLocation: trainStatus.currentLocation,
      nextStation: trainStatus.nextStation,
      estimatedArrival: trainStatus.estimatedArrival,
      delayMinutes: trainStatus.delayMinutes,
      departed: trainStatus.departed,
      timezone: trainStatus.timezone,
      isNext: trainStatus.isNext,
      timestamp: new Date().toISOString()
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log(`Saved train status for train ${trainStatus.trainId}`);
  } catch (error) {
    console.error('Error saving train status:', error);
    throw error;
  }
}

/**
 * Get train status history from DynamoDB
 */
export async function getTrainStatusHistory(trainId: string, limit: number = 50): Promise<TrainStatus[]> {
  const params = {
    TableName: TRAIN_STATUS_TABLE,
    KeyConditionExpression: 'trainId = :trainId',
    ExpressionAttributeValues: {
      ':trainId': trainId
    },
    ScanIndexForward: false, // Sort in descending order (newest first)
    Limit: limit
  };

  try {
    const result = await dynamoDB.query(params).promise();
    return (result.Items || []) as TrainStatus[];
  } catch (error) {
    console.error(`Error getting train status history for train ${trainId}:`, error);
    throw error;
  }
}

/**
 * Save current status data to DynamoDB
 */
export async function saveCurrentStatus(currentStatus: CurrentStatus): Promise<void> {
  const params = {
    TableName: CURRENT_STATUS_TABLE,
    Item: {
      id: 'current', // Use a fixed ID for the current status
      train3: currentStatus.train3,
      train4: currentStatus.train4,
      lastUpdated: new Date().toISOString()
    }
  };

  try {
    await dynamoDB.put(params).promise();
    console.log('Saved current status');
  } catch (error) {
    console.error('Error saving current status:', error);
    throw error;
  }
}

/**
 * Get current status from DynamoDB
 */
export async function getCurrentStatus(): Promise<CurrentStatus | null> {
  const params = {
    TableName: CURRENT_STATUS_TABLE,
    Key: {
      id: 'current'
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item as CurrentStatus || null;
  } catch (error) {
    console.error('Error getting current status:', error);
    throw error;
  }
}

/**
 * Fallback to local JSON files if DynamoDB is not available
 * This is useful for local development or if there are issues with DynamoDB
 */
export async function fallbackToLocalFiles(): Promise<boolean> {
  return !process.env.TRAIN_STATUS_TABLE || !process.env.CURRENT_STATUS_TABLE;
}
