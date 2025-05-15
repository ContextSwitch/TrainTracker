// Integration test for train #4 at final destination (Chicago)
import { expect } from 'chai';

// Define the ordered list of stations for each train route
// Train #3 (Southwest Chief) - Chicago to Los Angeles (westbound)
const train3Stations = [
  'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
  'Kansas City', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
  'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
  'Winslow', 'Flagstaff', 'Kingman', 'Needles', 'Barstow', 'Victorville', 'San Bernardino', 
  'Riverside', 'Fullerton', 'Los Angeles'
];

// Train #4 (Southwest Chief) - Los Angeles to Chicago (eastbound)
const train4Stations = [...train3Stations].reverse();

/**
 * Finds the next station in the route after the last visited station
 * @param trainId The train ID ('3' or '4')
 * @param lastVisitedStation The last station that was visited
 * @returns The next station in the route
 */
function findNextStationInRoute(trainId, lastVisitedStation) {
  const stations = trainId === '3' ? train3Stations : train4Stations;
  
  // Find the index of the last visited station
  // Use a more flexible matching approach to handle variations in station names
  const lastVisitedIndex = stations.findIndex(station => {
    const stationLower = station.toLowerCase();
    const visitedLower = lastVisitedStation.toLowerCase();
    
    // Check if either name contains the other or if they share significant parts
    return stationLower.includes(visitedLower) || 
           visitedLower.includes(stationLower) ||
           // Handle cases like "Las Vegas, NM" vs "Las Vegas"
           (visitedLower.split(',')[0].trim() === stationLower.split(',')[0].trim());
  });
  
  // If the station wasn't found, return null
  if (lastVisitedIndex === -1) {
    return null;
  }
  
  // If it's the last station in the route, return that station again
  if (lastVisitedIndex === stations.length - 1) {
    return stations[lastVisitedIndex];
  }
  
  // Otherwise, return the next station in the route
  return stations[lastVisitedIndex + 1];
}

/**
 * Simulates the train status processing for train #4 at Chicago (final destination)
 */
function processTrain4AtChicago(lastStationWithDataName, lastStationWithDataCode) {
  const trainId = '4';
  
  // Check if the last station with data is the final destination
  const finalDestination = trainId === '3' ? 'Los Angeles' : 'Chicago';
  const isFinalDestination = lastStationWithDataName.toLowerCase().includes(finalDestination.toLowerCase()) ||
                            finalDestination.toLowerCase().includes(lastStationWithDataName.toLowerCase());
  
  if (isFinalDestination) {
    // If the train has reached the final destination, set the next station to be the final destination
    const nextStationCode = lastStationWithDataCode;
    const nextStationName = lastStationWithDataName;
    const scheduledArrivalTime = '12:00P'; // Default
    const departed = true; // Mark as departed since this is the final destination
    
    return {
      nextStationName,
      nextStationCode,
      scheduledArrivalTime,
      departed
    };
  } else {
    // Find the next station in the route after the last visited station
    const nextStationInRoute = findNextStationInRoute(trainId, lastStationWithDataName);
    
    if (nextStationInRoute) {
      return {
        nextStationName: nextStationInRoute,
        nextStationCode: 'XXX', // Placeholder
        scheduledArrivalTime: '12:00P', // Default
        departed: false
      };
    } else {
      return {
        nextStationName: lastStationWithDataName,
        nextStationCode: lastStationWithDataCode,
        scheduledArrivalTime: '12:00P', // Default
        departed: true
      };
    }
  }
}

describe('Train #4 Final Destination Tests', () => {
  it('should correctly identify Chicago as the final destination for train #4', () => {
    const lastStationWithDataName = 'Chicago, IL';
    const lastStationWithDataCode = 'CHI';
    
    const result = processTrain4AtChicago(lastStationWithDataName, lastStationWithDataCode);
    
    expect(result).to.have.property('nextStationName', lastStationWithDataName);
    expect(result).to.have.property('nextStationCode', lastStationWithDataCode);
    expect(result).to.have.property('departed', true);
  });
  
  it('should handle variations of the Chicago station name', () => {
    const variations = [
      { name: 'Chicago', code: 'CHI' },
      { name: 'Chicago, Illinois', code: 'CHI' },
      { name: 'Chicago (CHI)', code: 'CHI' }
    ];
    
    variations.forEach(station => {
      const result = processTrain4AtChicago(station.name, station.code);
      
      expect(result).to.have.property('nextStationName', station.name);
      expect(result).to.have.property('nextStationCode', station.code);
      expect(result).to.have.property('departed', true);
    });
  });
  
  it('should handle a non-final station correctly', () => {
    const lastStationWithDataName = 'Naperville, IL';
    const lastStationWithDataCode = 'NPV';
    
    const result = processTrain4AtChicago(lastStationWithDataName, lastStationWithDataCode);
    
    expect(result).to.have.property('nextStationName', 'Chicago');
    expect(result).to.have.property('nextStationCode', 'XXX');
    expect(result).to.have.property('departed', false);
  });
});
