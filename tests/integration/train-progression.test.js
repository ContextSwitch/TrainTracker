// Integration test for train station progression logic
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

describe('Train Station Progression Logic', () => {
  describe('findNextStationInRoute', () => {
    it('should find the next station for train #3 (westbound)', () => {
      expect(findNextStationInRoute('3', 'Gallup')).to.equal('Winslow');
      expect(findNextStationInRoute('3', 'Needles')).to.equal('Barstow');
      expect(findNextStationInRoute('3', 'Albuquerque')).to.equal('Gallup');
    });
    
    it('should find the next station for train #4 (eastbound)', () => {
      expect(findNextStationInRoute('4', 'Flagstaff')).to.equal('Winslow');
      expect(findNextStationInRoute('4', 'Barstow')).to.equal('Needles');
      expect(findNextStationInRoute('4', 'Gallup')).to.equal('Albuquerque');
    });
    
    it('should handle station names with additional information', () => {
      expect(findNextStationInRoute('3', 'Gallup, NM')).to.equal('Winslow');
      expect(findNextStationInRoute('4', 'Flagstaff, AZ')).to.equal('Winslow');
    });
    
    it('should return the final station when at the last station', () => {
      expect(findNextStationInRoute('3', 'Los Angeles')).to.equal('Los Angeles');
      expect(findNextStationInRoute('4', 'Chicago')).to.equal('Chicago');
    });
    
    it('should return null for unknown stations', () => {
      expect(findNextStationInRoute('3', 'Unknown Station')).to.be.null;
      expect(findNextStationInRoute('4', 'Not a Real Station')).to.be.null;
    });
  });
  
  describe('Train past station scenario', () => {
    it('should correctly identify the next station when train has passed a station', () => {
      // Simulate the case where train #3 has passed Needles but site indicates heading to Kingman
      const lastStationWithData = 'Needles';
      const nextStationFromSite = 'Kingman';
      
      // Find the next station in the route after Needles
      const nextStationInRoute = findNextStationInRoute('3', lastStationWithData);
      
      // Verify that the next station in the route is Barstow, not Kingman
      expect(nextStationInRoute).to.equal('Barstow');
      expect(nextStationInRoute).to.not.equal(nextStationFromSite);
      
      // Verify that Kingman is before Needles in the route
      const needlesIndex = train3Stations.findIndex(s => s === 'Needles');
      const kingmanIndex = train3Stations.findIndex(s => s === 'Kingman');
      expect(kingmanIndex).to.be.lessThan(needlesIndex);
    });
    
    it('should correctly identify the next station when train has arrived at Chicago', () => {
      // Simulate the case where train #4 has arrived at Chicago
      const lastStationWithData = 'Chicago';
      
      // Find the next station in the route after Chicago
      const nextStationInRoute = findNextStationInRoute('4', lastStationWithData);
      
      // Verify that the next station is still Chicago (final destination)
      expect(nextStationInRoute).to.equal('Chicago');
    });
  });
});
