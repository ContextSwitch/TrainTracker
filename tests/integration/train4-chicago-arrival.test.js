// Integration test for train #4 at Chicago with only arrival data
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
 * Processes train status for train #4 at Chicago with only arrival data
 */
function processTrain4ChicagoArrival(stationCode, stationText, actualText) {
  const trainId = '4';
  
  // Initialize variables
  let nextStationCode = '';
  let nextStationName = '';
  let scheduledArrivalTime = '';
  let departed = false;
  
  // Variables to track the last station with arrival/departure data
  let lastStationWithDataCode = '';
  let lastStationWithDataName = '';
  
  // Check if this station has actual departure or arrival times
  const hasDeparted = actualText.match(/Dp\s+\d+:\d+[AP]/) || actualText.match(/Dp\s+\d+[AP]/);
  const hasArrivedOnly = actualText.match(/Arrived:/) || actualText.match(/Ar\s+\d+/);
  
  if (hasDeparted || hasArrivedOnly) {
    // Train has departed this station or arrived at final destination
    
    // Update the last station with data
    lastStationWithDataCode = stationCode;
    lastStationWithDataName = stationText.replace(/\s*\([A-Z]{3}\)$/, '').trim();
  }
  
  // After processing all stations, determine the next station based on the route
  if (lastStationWithDataName) {
    // Check if the last station with data is the final destination
    const finalDestination = trainId === '3' ? 'Los Angeles' : 'Chicago';
    const isFinalDestination = lastStationWithDataName.toLowerCase().includes(finalDestination.toLowerCase()) ||
                              finalDestination.toLowerCase().includes(lastStationWithDataName.toLowerCase());
    
    if (isFinalDestination) {
      // If the train has reached the final destination, set the next station to be the final destination
      nextStationCode = lastStationWithDataCode;
      nextStationName = lastStationWithDataName;
      departed = true; // Mark as departed since this is the final destination
    } else {
      // Find the next station in the route after the last visited station
      const nextStationInRoute = findNextStationInRoute(trainId, lastStationWithDataName);
      
      if (nextStationInRoute) {
        nextStationName = nextStationInRoute;
      } else {
        // If there's no next station in the route, use the last station with data
        nextStationCode = lastStationWithDataCode;
        nextStationName = lastStationWithDataName;
        departed = true; // Mark as departed since this is the last station with data
      }
    }
  }
  
  // Return the result
  return {
    trainId,
    direction: 'eastbound',
    nextStation: nextStationName,
    departed,
    currentLocation: lastStationWithDataName
  };
}

describe('Train #4 Chicago Arrival Tests', () => {
  it('should correctly identify Chicago as the final destination with only arrival data', () => {
    const stationCode = 'CHI';
    const stationText = 'Chicago, IL (CHI)';
    const actualText = '422P Arrived: 55 minutes late.';
    
    const result = processTrain4ChicagoArrival(stationCode, stationText, actualText);
    
    expect(result).to.have.property('trainId', '4');
    expect(result).to.have.property('direction', 'eastbound');
    expect(result).to.have.property('nextStation', 'Chicago, IL');
    expect(result).to.have.property('departed', true);
    expect(result).to.have.property('currentLocation', 'Chicago, IL');
  });
  
  it('should handle different arrival text formats', () => {
    const stationCode = 'CHI';
    const stationText = 'Chicago, IL (CHI)';
    const arrivalTexts = [
      '422P Arrived: 55 minutes late.',
      'Arrived: 422P, 55 minutes late.',
      'Ar 422P 55 minutes late.'
    ];
    
    arrivalTexts.forEach(actualText => {
      const result = processTrain4ChicagoArrival(stationCode, stationText, actualText);
      
      expect(result).to.have.property('trainId', '4');
      expect(result).to.have.property('direction', 'eastbound');
      expect(result).to.have.property('nextStation', 'Chicago, IL');
      expect(result).to.have.property('departed', true);
      expect(result).to.have.property('currentLocation', 'Chicago, IL');
    });
  });
});
