// Integration test for finding the next station in a train route
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

describe('Last Station Tests', () => {
  describe('Train #3 (westbound)', () => {
    it('should find the next station after Chicago (first station)', () => {
      const nextStation = findNextStationInRoute('3', 'Chicago');
      expect(nextStation).to.equal('Naperville');
    });
    
    it('should find the next station after Needles (middle station)', () => {
      const nextStation = findNextStationInRoute('3', 'Needles');
      expect(nextStation).to.equal('Barstow');
    });
    
    it('should return Los Angeles when last visited station is Los Angeles (last station)', () => {
      const nextStation = findNextStationInRoute('3', 'Los Angeles');
      expect(nextStation).to.equal('Los Angeles');
    });
  });
  
  describe('Train #4 (eastbound)', () => {
    it('should find the next station after Los Angeles (first station)', () => {
      const nextStation = findNextStationInRoute('4', 'Los Angeles');
      expect(nextStation).to.equal('Fullerton');
    });
    
    it('should find the next station after Needles (middle station)', () => {
      const nextStation = findNextStationInRoute('4', 'Needles');
      expect(nextStation).to.equal('Kingman');
    });
    
    it('should return Chicago when last visited station is Chicago (last station)', () => {
      const nextStation = findNextStationInRoute('4', 'Chicago');
      expect(nextStation).to.equal('Chicago');
    });
  });
  
  describe('Edge cases', () => {
    it('should handle station names with additional information', () => {
      expect(findNextStationInRoute('3', 'Gallup, NM')).to.equal('Winslow');
      expect(findNextStationInRoute('4', 'Flagstaff, AZ')).to.equal('Winslow');
    });
    
    it('should return null for unknown stations', () => {
      expect(findNextStationInRoute('3', 'Unknown Station')).to.be.null;
      expect(findNextStationInRoute('4', 'Not a Real Station')).to.be.null;
    });
  });
});
