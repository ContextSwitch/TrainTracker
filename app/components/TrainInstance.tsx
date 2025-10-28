import React from 'react';
import { TrainStatus as TrainStatusType } from '../types';
import { getStationByName } from '../config';
import { TimeUtils, TrainStatusUtils, TrainUIUtils, ErrorUtils } from '../utils/train-helpers';

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
  // Check if we have valid train status information
  if (!TrainStatusUtils.isValidStatus(trainStatus)) {
    return null;
  }
  
  // Check if there is a railcam at the next station
  const hasRailcam = !!getStationByName(trainStatus.nextStation);
  
  // Calculate time-related values using shared utilities
  const actualMinutesAway = ErrorUtils.safeExecute(
    () => TimeUtils.calculateMinutesAway(trainStatus.estimatedArrival),
    0,
    'TrainInstance.calculateMinutesAway'
  );
  
  const timeUntilArrival = TimeUtils.formatTimeUntilArrival(actualMinutesAway);
  const hasPassed = TimeUtils.hasPassed(actualMinutesAway);
  const displayTime = TimeUtils.formatDisplayTime(trainStatus.estimatedArrival);
  
  // Get styling classes using shared utilities
  const borderColor = TrainUIUtils.getBorderColorClass(isSelected, isApproaching || false, hasRailcam);
  const bgColor = TrainUIUtils.getBackgroundColorClass(isSelected, isApproaching || false, hasRailcam);
  const cursorClass = TrainUIUtils.getCursorClass(hasRailcam);
  const textColorClass = TrainUIUtils.getTextColorClass(hasRailcam);
  
  return (
    <div 
      className={`p-3 mb-3 rounded-md border ${borderColor} ${bgColor} ${cursorClass} transition-colors`}
      onClick={() => {
        if (hasRailcam) {
          onSelectStation(trainStatus.trainId, trainStatus.nextStation || '');
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-700 dark:text-gray-200">
          Train #{trainStatus.trainId} - {trainStatus.date || `Train ${instanceId + 1}`}
        </span>
      </div>
      {isSelected && hasRailcam && (
        <div className="flex items-center mb-2">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-1"></span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Watching</span>
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${textColorClass}`}>
              {getStationByName(trainStatus.nextStation)?.name || trainStatus.nextStation}
            </p>
            {hasRailcam && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded-full">
                Railcam
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {hasPassed 
              ? `Expected ${timeUntilArrival} ago` 
              : `Estimated in ${timeUntilArrival}`
            }
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-100">
            {displayTime}
          </span>
        </div>
      </div>
      

      
      {trainStatus.status && (
        <p className={`mt-1 text-xs ${TrainStatusUtils.getStatusColorClass(trainStatus.status)}`}>
          Status: {trainStatus.status}
        </p>
      )}
    </div>
  );
};

export default TrainInstance;
