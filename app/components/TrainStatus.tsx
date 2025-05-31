import React from 'react';
import { TrainStatus as TrainStatusType, TrainApproaching } from '../types';
import { generateStatusMessage } from '../utils/predictions';
import { getStationByName } from '../config';
import TrainInstance from './TrainInstance';

interface TrainStatusProps {
  trainId: string;
  direction: string;
  trainStatus: TrainStatusType | null;
  approaching: TrainApproaching;
  allTrainStatuses?: TrainStatusType[];
  onSelectStation?: (trainId: string, stationName: string) => void;
  selectedStation?: string;
}

/**
 * Component to display the status of a train
 */
const TrainStatus: React.FC<TrainStatusProps> = ({
  trainId,
  trainStatus,
  direction,
  approaching,
  allTrainStatuses = [],
  onSelectStation = () => {},
  selectedStation
}) => {
  // Check if there are multiple train instances
  const hasMultipleInstances = allTrainStatuses && allTrainStatuses.length > 1;
  
  // Get the selected station name from props
  const selectedStationName = selectedStation;
    

  if (!trainStatus) {
    return (
      <div className="p-4 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-lg font-semibold dark:text-white">Train #{trainId}</h3>
        <p className="text-gray-500 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  // Calculate real-time minutes away for approaching train
  let realTimeMinutesAway = approaching.minutesAway || 0;

  if (approaching.approaching && approaching.eta) {
    const now = new Date();
    const eta = new Date(approaching.eta);
    realTimeMinutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
  }

  // Adjust for day boundaries (e.g., if the time wraps around midnight)
  while(realTimeMinutesAway > 720 && realTimeMinutesAway > 0){
    realTimeMinutesAway -=1440;
  }

  while(realTimeMinutesAway < -900 && realTimeMinutesAway < 0){
    realTimeMinutesAway +=1440;
  }

  // Generate a human-readable status message with real-time minutes
  const updatedApproaching = {
    ...approaching,
    minutesAway: realTimeMinutesAway
  };
  const statusMessage = generateStatusMessage(trainStatus, updatedApproaching);

  // Use neutral background color regardless of approaching status
  const statusColor = 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800';

  return (
    <div className={`p-4 border rounded-lg ${statusColor}`}>
      <h3 className="text-lg font-semibold dark:text-white">
        SWC #{trainId} - {direction}
      </h3>
      
      <div className="mt-2">
        <p className="text-gray-700 dark:text-gray-300">{statusMessage}</p>
        
        {trainStatus.status && (
          <p className="mt-1 text-sm dark:text-gray-300" hidden>
            <span className="font-medium">Status:</span> {trainStatus.status}
          </p>
        )}
        
        {trainStatus.delayMinutes !== undefined && trainStatus.delayMinutes > 0 && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" hidden>
            <span className="font-medium" >Delay:</span> {
              trainStatus.delayMinutes >= 60 
                ? `${Math.floor(trainStatus.delayMinutes / 60)} hour${Math.floor(trainStatus.delayMinutes / 60) !== 1 ? 's' : ''}, ${trainStatus.delayMinutes % 60} minute${trainStatus.delayMinutes % 60 !== 1 ? 's' : ''}`
                : `${trainStatus.delayMinutes} minute${trainStatus.delayMinutes !== 1 ? 's' : ''}`
            }
          </p>
        )}
        
        {/* Only show the approaching message if it's not the next station for this train */}

        
        {/* Next Railcam Viewing Section */}
        <div className="mt-3">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            {hasMultipleInstances ? 'Next Stops' : 'Next Stop'}
          </h4>
          
          {/* Always show all train instances */}
          <div>
            {allTrainStatuses.length > 0 ? (
              allTrainStatuses.map((status, index) => {
                // Check if this status matches the approaching station
                const isApproaching = approaching.approaching && 
                  approaching.station && 
                  status.nextStation === approaching.station.name;
                
                // If this is the approaching station, update its ETA
                const updatedStatus = isApproaching ? {
                  ...status,
                  estimatedArrival: approaching.eta || status.estimatedArrival
                } : status;
                
                return (
                  <TrainInstance
                    key={`${status.trainId}-${index}-${status.nextStation || 'unknown'}`}
                    trainStatus={updatedStatus}
                    isSelected={
                      getStationByName(selectedStationName)?.name === 
                      getStationByName(status.nextStation)?.name
                    }
                    isApproaching={isApproaching}
                    onSelectStation={onSelectStation}
                    instanceId={index}
                  />
                );
              })
            ) : (
              // If there are no instances in the array but we have a trainStatus, show it
              trainStatus && (
                <TrainInstance
                  trainStatus={approaching.approaching && approaching.eta ? {
                    ...trainStatus,
                    estimatedArrival: approaching.eta
                  } : trainStatus}
                  isSelected={
                    getStationByName(selectedStationName)?.name === 
                    getStationByName(trainStatus.nextStation)?.name
                  }
                  isApproaching={approaching.approaching && 
                    approaching.station && 
                    getStationByName(trainStatus.nextStation)?.name === 
                    getStationByName(approaching.station.name)?.name}
                  onSelectStation={onSelectStation}
                  instanceId={0}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainStatus;
