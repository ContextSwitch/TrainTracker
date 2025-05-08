import React from 'react';
import { TrainStatus as TrainStatusType, RailcamStation } from '../types';

interface TrainInstanceProps {
  trainStatus: TrainStatusType;
  isSelected: boolean;
  onSelectStation: (trainId: string, stationName: string) => void;
  instanceId: number;
}

/**
 * Component to display a single train instance
 */
const TrainInstance: React.FC<TrainInstanceProps> = ({
  trainStatus,
  isSelected,
  onSelectStation,
  instanceId
}) => {
  // Check if we have next station information
  if (!trainStatus.nextStation || !trainStatus.estimatedArrival) {
    return null;
  }
  
  // Get the current time and the estimated arrival time
  const now = new Date();
  const eta = new Date(trainStatus.estimatedArrival);
  
  // Calculate the actual minutes away based on the current time and ETA
  let actualMinutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
  
  if(actualMinutesAway < -60){
    actualMinutesAway += 24*60;
  }

  // Format the time until arrival
  const timeUntilArrival = actualMinutesAway > 60
    ? `${Math.floor(actualMinutesAway / 60)} hr ${actualMinutesAway % 60} min`
    : `${actualMinutesAway} min`;
  
  // Determine if the train has already passed the station
  const hasPassed = actualMinutesAway <= 0;
  
  // Determine the border color based on selection status
  const borderColor = isSelected
    ? 'border-blue-500 dark:border-blue-400'
    : 'border-gray-200 dark:border-gray-700';
  
  // Determine the background color based on selection status
  const bgColor = isSelected
    ? 'bg-blue-50 dark:bg-blue-900/20'
    : 'bg-white dark:bg-gray-800';
  
  return (
    <div 
      className={`p-3 mb-3 rounded-md border ${borderColor} ${bgColor} cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors`}
      onClick={() => onSelectStation(trainStatus.trainId, trainStatus.nextStation || '')}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-300">
          Train #{trainStatus.trainId} - Train {instanceId}
        </span>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-gray-800 dark:text-gray-200">
            {trainStatus.nextStation}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasPassed 
              ? `Expected ${Math.abs(actualMinutesAway)} min ago` 
              : `Scheduled to arrive in ${timeUntilArrival}`
            }
          </p>
        </div>
        <div className="flex items-center">
          {isSelected && (
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          )}
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
            {new Date(trainStatus.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {trainStatus.currentLocation && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Current location: {trainStatus.currentLocation}
        </p>
      )}
      
      {trainStatus.status && trainStatus.status !== 'On time' && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
          Previous Stop: {trainStatus.status}
        </p>
      )}
    </div>
  );
};

export default TrainInstance;
