'use client';

import React, { useState, useEffect } from 'react';
import { TrainStatus, RailcamStation } from '../types';

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
  // State to track if the route list is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if we're on mobile using window width
  const [isMobile, setIsMobile] = useState(false);
  
  // State to store the stations configuration
  const [stations, setStations] = useState<RailcamStation[]>([]);
  
  // Function to get a station by name from the loaded stations
  const getStationByName = (name: string): RailcamStation | null => {
    if (!name) return null;
    
    // Clean up the name by removing state abbreviations and commas
    const cleanName = name.replace(/,\s*[A-Z]{2}$/, '').trim();
    
    // Special case for Kansas City
    if (cleanName === 'Kansas City') {
      const kansasCity = stations.find(station => 
        station.name.startsWith('Kansas City')
      );
      if (kansasCity) {
        return kansasCity;
      }
    }
    
    // First try exact match
    const exactMatch = stations.find(station => 
      station.name.toLowerCase() === cleanName.toLowerCase()
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // If no exact match, try partial match with the city name only
    // This will match "Kansas City, MO" with "Kansas City - Union Station"
    const cityName = cleanName.split(' - ')[0].trim();
    const partialMatch = stations.find(station => {
      const stationCity = station.name.split(' - ')[0].trim().toLowerCase();
      return stationCity === cityName.toLowerCase() || 
             stationCity.includes(cityName.toLowerCase()) || 
             cityName.toLowerCase().includes(stationCity);
    });
    
    if (partialMatch) {
      return partialMatch;
    }
    
    // If still no match, try a more general partial match
    return stations.find(station => 
      station.name.toLowerCase().includes(cleanName.toLowerCase()) ||
      cleanName.toLowerCase().includes(station.name.toLowerCase())
    ) || null;
  };
  
  // Load stations configuration on component mount
  useEffect(() => {
    const loadStations = async () => {
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/stations-config?t=${timestamp}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stations) {
            setStations(data.stations);
          }
        }
      } catch (error) {
        console.error('Error loading stations configuration:', error);
      }
    };
    
    loadStations();
  }, []);
  
  // Effect to check screen size and set mobile state
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px is typical md breakpoint
    };
    
    // Check on initial load
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Ensure trainId is a string
  const actualTrainId = typeof trainId === 'string' ? trainId : 
                       (direction === 'westbound' ? '3' : '4');
  
  // Define the Southwest Chief route with all stations
  const westboundRoute = [
    'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
    'Kansas City', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
    'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
    'Winslow', 'Flagstaff', 'Kingman', 'Needles', 'Barstow', 'Victorville', 'Cajon Pass', 'San Bernardino', 
    'Riverside', 'Fullerton', 'Los Angeles'
  ];
  
  const eastboundRoute = [...westboundRoute].reverse();
  
  // Select the appropriate route based on direction
  const route = direction === 'westbound' ? westboundRoute : eastboundRoute;
  
  // Set initial expanded state based on screen size when component mounts
  useEffect(() => {
    setIsExpanded(!isMobile);
  }, [isMobile]);
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div 
        className={`flex justify-between items-center ${isMobile ? 'cursor-pointer' : ''}`}
        onClick={() => isMobile && setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold dark:text-white">
          {direction === 'westbound' ? '#3 Chicago → Los Angeles' : '#4 Los Angeles → Chicago'}
        </h3>
        {isMobile && (
          <button 
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            aria-label={isExpanded ? "Collapse route" : "Expand route"}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-500 dark:text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100 mt-3' : 'max-h-0 opacity-0 md:max-h-[2000px] md:opacity-100 md:mt-3'
        }`}
      >
        <div className="text-sm">
          <ul className="space-y-2">
          {route.map((stationName) => {
            const station = getStationByName(stationName);
            const hasRailcam = !!station && station.enabled !== false;
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
                      <div className="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-100 text-xs px-1.5 py-0.5 rounded">
                        Next
                      </div>
                    )}
                    {hasRailcam && station?.isScenic && (
                      <div className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 text-xs px-1.5 py-0.5 rounded">
                        Scenic
                      </div>
                    )}
                    {hasRailcam && !station?.isScenic && (
                      <div className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100 text-xs px-1.5 py-0.5 rounded">
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
    </div>
  );
};

export default RouteStations;
