'use client';

import React from 'react';
import { RailcamStation } from '../types';
import { getStationByName } from '../config';

interface RouteStationsProps {
  onSelectStation: (trainId: string, stationName: string) => void;
  selectedStation?: string;
  trainId?: string;
  direction?: 'westbound' | 'eastbound';
}

const RouteStations: React.FC<RouteStationsProps> = ({
  onSelectStation,
  selectedStation,
  trainId = '3',
  direction = 'westbound'
}) => {
  // Define the Southwest Chief route with all stations
  const westboundRoute = [
    'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
    'Kansas City - Union Station', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
    'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
    'Winslow', 'Flagstaff - Amtrak Station', 'Kingman', 'Needles', 'Barstow - Harvey House Railroad Depot', 'Victorville', 'San Bernardino', 
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
            
            return (
              <li 
                key={stationName}
                className={`
                  py-1 px-2 rounded-md flex items-center
                  ${hasRailcam ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30' : ''}
                  ${isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''}
                `}
                onClick={() => hasRailcam && onSelectStation(trainId, stationName)}
              >
                <div className="flex-grow">
                  <span className={`
                    ${hasRailcam ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {stationName}
                  </span>
                </div>
                {hasRailcam && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded">
                    Railcam
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RouteStations;
