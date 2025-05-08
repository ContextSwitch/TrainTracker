'use client';

import React from 'react';
import { RailcamStation, TrainStatus } from '../types';
import { getStationByName } from '../config';

interface RouteStationsProps {
  onSelectStation: (trainId: string, stationName: string) => void;
  selectedStation?: string;
  trainId?: string;
  direction?: 'westbound' | 'eastbound';
  trainStatus?: TrainStatus | null;
  allStatuses?: TrainStatus[]
}

const RouteStations: React.FC<RouteStationsProps> = ({
  onSelectStation,
  selectedStation,
  trainId,
  direction = 'westbound',
  trainStatus,
  allStatuses
}) => {
  
  // Ensure trainId is a string
  const actualTrainId = typeof trainId === 'string' ? trainId : 
                       (direction === 'westbound' ? '3' : '4');
  
  // Define the Southwest Chief route with all stations
  const westboundRoute = [
    'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
    'Kansas City', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
    'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
    'Winslow', 'Flagstaff', 'Kingman', 'Needles', 'Barstow', 'Victorville', 'San Bernardino', 
    'Riverside', 'Fullerton', 'Los Angeles'
  ];
  
  const eastboundRoute = [...westboundRoute].reverse();
  
  // Select the appropriate route based on direction
  const route = direction === 'westbound' ? westboundRoute : eastboundRoute;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold mb-3 dark:text-white">
        {direction === 'westbound' ? 'Chicago → Los Angeles' : 'Los Angeles → Chicago'}
      </h3>
      <div className="text-sm">
        <ul className="space-y-2">
          {route.map((stationName) => {
            const station = getStationByName(stationName);
            const hasRailcam = !!station;
            const isSelected = selectedStation === stationName;
            
            // Check if this station is the next stop for any train instance
            const isNextStop = (trainStatus && 
              trainStatus.nextStation && 
              (trainStatus.nextStation.toLowerCase() === stationName.toLowerCase() || 
               stationName.toLowerCase().includes(trainStatus.nextStation.toLowerCase()) ||
               trainStatus.nextStation.toLowerCase().includes(stationName.toLowerCase()))) ||
              // Also check all statuses if available
              (allStatuses && allStatuses.some((status: TrainStatus) => 
                status && status.nextStation && 
                (status.nextStation.toLowerCase() === stationName.toLowerCase() || 
                 stationName.toLowerCase().includes(status.nextStation.toLowerCase()) ||
                 status.nextStation.toLowerCase().includes(stationName.toLowerCase()))
              ));
            
            return (
              <li 
                key={stationName}
                className={`
                  py-1 px-2 rounded-md
                  ${hasRailcam ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'cursor-default'}
                  ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
                  ${isNextStop ? 'border-l-4 border-yellow-400 dark:border-yellow-600 pl-1' : ''}
                `}
                onClick={() => {
                  if (hasRailcam) {
                    onSelectStation(actualTrainId, stationName);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {isNextStop && (
                      <span className="mr-2 text-yellow-600 dark:text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                    <span className={`
                      ${hasRailcam ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-500'}
                      ${isNextStop ? 'font-bold' : ''}
                    `}>
                      {stationName}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isNextStop && (
                      <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-1.5 py-0.5 rounded">
                        Next
                      </div>
                    )}
                    {hasRailcam && (
                      <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-1.5 py-0.5 rounded">
                        Railcam
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RouteStations;
