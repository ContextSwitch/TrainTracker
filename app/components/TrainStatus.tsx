import React from 'react';
import { TrainStatus as TrainStatusType, TrainApproaching } from '../types';
import { generateStatusMessage, findNextRailcamStation } from '../utils/predictions';
import TrainInstance from './TrainInstance';

interface TrainStatusProps {
  trainId: string;
  direction: string;
  trainStatus: TrainStatusType | null;
  approaching: TrainApproaching;
  allTrainStatuses?: TrainStatusType[];
  onSelectStation?: (trainId: string, stationName: string) => void;
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
  onSelectStation = () => {}
}) => {
  if (!trainStatus) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
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

  // Generate a human-readable status message with real-time minutes
  const updatedApproaching = {
    ...approaching,
    minutesAway: realTimeMinutesAway
  };
  const statusMessage = generateStatusMessage(trainStatus, updatedApproaching);

  // Determine status color based on approaching status
  const statusColor = approaching.approaching
    ? 'bg-green-100 border-green-300 dark:bg-green-900/50 dark:border-green-800'
    : 'bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800';

  // Check if there are multiple train instances
  const hasMultipleInstances = allTrainStatuses && allTrainStatuses.length > 1;
  
  // Find the currently selected station name (if any)
  const selectedStationName = approaching.approaching && approaching.station 
    ? approaching.station.name 
    : null;

  return (
    <div className={`p-4 border rounded-lg ${statusColor}`}>
      <h3 className="text-lg font-semibold dark:text-white">
        SWC #{trainId} - {direction}
      </h3>
      
      <div className="mt-2">
        <p className="text-gray-700 dark:text-gray-300">{statusMessage}</p>
        
        {trainStatus.status && (
          <p className="mt-1 text-sm dark:text-gray-300">
            <span className="font-medium">Status:</span> {trainStatus.status}
          </p>
        )}
        
        {trainStatus.delayMinutes !== undefined && trainStatus.delayMinutes > 0 && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            <span className="font-medium">Delay:</span> {trainStatus.delayMinutes} minutes
          </p>
        )}
        
        {approaching.approaching && approaching.station && (
          <p className="mt-2 text-green-600 dark:text-green-400 font-medium">
            {realTimeMinutesAway >= 0 ? (
              `Arriving at ${approaching.station.name} in ${realTimeMinutesAway} minutes`
            ) : (
              `Arrived at ${approaching.station.name} ${Math.abs(realTimeMinutesAway)} minutes ago`
            )}
          </p>
        )}
        
        {/* Next Railcam Viewing Section */}
        <div className="mt-3">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
            {hasMultipleInstances ? 'Next Railcam Viewings' : 'Next Railcam Viewing'}
          </h4>
          
          {/* If there are multiple instances, show each one */}
          {hasMultipleInstances ? (
            <div>
              {allTrainStatuses
                // Filter out departed stations
                .filter(status => !status.departed)
                .map((status, index) => {
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
                      isSelected={selectedStationName === findNextRailcamStation(status)?.station.name}
                      onSelectStation={onSelectStation}
                      instanceId={index}
                    />
                  );
                })}
            </div>
          ) : (
            // If there's only one instance, show it
            trainStatus && (
              <TrainInstance
                trainStatus={approaching.approaching && approaching.eta ? {
                  ...trainStatus,
                  estimatedArrival: approaching.eta
                } : trainStatus}
                isSelected={!!selectedStationName}
                onSelectStation={onSelectStation}
                instanceId={0}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainStatus;
