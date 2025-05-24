import React from 'react';
import { TrainStatus as TrainStatusType } from '../types';
import { getStationByName } from '../config';

interface TrainInstanceProps {
  trainStatus: TrainStatusType;
  isSelected: boolean;
  isApproaching?: boolean;
  onSelectStation: (trainId: string, stationName: string) => void;
  instanceId: number;
}

/**
 * Component to display a single train instance
 */
const TrainInstance: React.FC<TrainInstanceProps> = ({
  trainStatus,
  isSelected,
  isApproaching,
  onSelectStation,
  instanceId
}) => {
  // Check if we have next station information
  if (!trainStatus.nextStation || !trainStatus.estimatedArrival) {
    return null;
  }
  
  // Check if there is a railcam at the next station
  const hasRailcam = !!getStationByName(trainStatus.nextStation);
  
  
  // Get the current time and the estimated arrival time
  const now = new Date();
  const eta = new Date(trainStatus.estimatedArrival);
  
  // Calculate the actual minutes away based on the current time and ETA
  let actualMinutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
  
  while(actualMinutesAway > 720 && actualMinutesAway > 0){
    actualMinutesAway -=1440;
  }

  while(actualMinutesAway < -900 && actualMinutesAway < 0){
    actualMinutesAway +=1440;
  }

  if(actualMinutesAway < 0){
   // trainStatus.status -= actualMinutesAway
  }

  // Format the time until arrival
  let timeUntilArrival;
  if (actualMinutesAway > 60) {
    const hours = Math.floor(actualMinutesAway / 60);
    const minutes = actualMinutesAway % 60;
    timeUntilArrival = `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min`;
  } else {
    timeUntilArrival = `${actualMinutesAway} min`;
  }


  // Determine if the train has already passed the station
  const hasPassed = actualMinutesAway <= 0;
  
  // Determine the border color based on selection and approaching status
  let borderColor = 'border-gray-200 dark:border-gray-700';
  if (isSelected && hasRailcam) {
    borderColor = 'border-blue-500 dark:border-blue-400';
  } else if (isApproaching && hasRailcam) {
    borderColor = 'border-green-500 dark:border-green-400';
  }
  
  // Determine the background color based on selection and approaching status
  let bgColor = 'dark:bg-gray-900';
  if (isSelected && hasRailcam) {
    bgColor = 'bg-blue-50 dark:bg-blue-900/20';
  } else if (isApproaching && hasRailcam) {
    bgColor = 'bg-green-50 dark:bg-green-900/20';
  }
  
  return (
    <div 
      className={`p-3 mb-3 rounded-md border ${borderColor} ${bgColor} ${hasRailcam ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'cursor-default'} transition-colors`}
      onClick={() => {
        if (hasRailcam) {
          onSelectStation(trainStatus.trainId, trainStatus.nextStation || '');
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200">
          Train #{trainStatus.trainId} - Train {instanceId + 1}
        </span>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${hasRailcam ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500'}`}>
              {trainStatus.nextStation}
            </p>
            {hasRailcam && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">
                Railcam
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasPassed 
              ? `Expected ${Math.abs(actualMinutesAway)} min ago` 
              : `Estimated in ${timeUntilArrival}`
            }
          </p>
        </div>
        <div className="flex items-center">
          {isSelected && hasRailcam && (
            <div className="flex items-center mr-2">
              <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Watching</span>
            </div>
          )}
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-100">
            {new Date(trainStatus.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      

      
      {trainStatus.status && trainStatus.status !== 'On time' && (
        <p className="mt-1 text-xs text-red-500 dark:text-red-400">
          Status: {trainStatus.status}
        </p>
      )}
    </div>
  );
};

export default TrainInstance;
