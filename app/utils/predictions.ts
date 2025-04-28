import { TrainStatus, RailcamStation, TrainApproaching } from '../types';
import { appConfig, getStationByName, getYoutubeEmbedUrl } from '../config';

/**
 * Gets the time zone offset for a station
 * @param stationName The name of the station
 * @returns The time zone offset in hours
 */
export function getStationTimeZoneOffset(stationName: string): number {
  // Pacific Time Zone stations (UTC-8 standard, UTC-7 daylight)
  const pacificStations = [
    'Los Angeles', 'Fullerton', 'Riverside', 'San Bernardino', 
    'Victorville', 'Barstow - Harvey House Railroad Depot', 'Needles', 'Flagstaff - Amtrak Station','Winslow'
  ];
  
  // Mountain Time Zone stations (UTC-7 standard, UTC-6 daylight)
  const mountainStations = [
    'Kingman', 'Gallup', 'Albuquerque',
    'Lamy', 'Las Vegas', 'Raton', 'Trinidad', 'La Junta'
  ];
  
  // Central Time Zone stations (UTC-6 standard, UTC-5 daylight)
  const centralStations = [
    'Garden City', 'Dodge City', 'Hutchinson', 'Newton', 'Topeka',
    'Lawrence', 'Kansas City - Union Station', 'La Plata', 'Fort Madison', 'Galesburg'
  ];
  
  // Eastern Time Zone stations (UTC-5 standard, UTC-4 daylight)
  const easternStations = [
    'Princeton', 'Mendota', 'Naperville', 'Chicago'
  ];
  
  // Determine the time zone based on the station name
  if (pacificStations.some(station => stationName.includes(station))) {
    return -7; // PDT (daylight saving time)
  } else if (mountainStations.some(station => stationName.includes(station))) {
    return -6; // MDT (daylight saving time)
  } else if (centralStations.some(station => stationName.includes(station))) {
    return -5; // CDT (daylight saving time)
  } else if (easternStations.some(station => stationName.includes(station))) {
    return -4; // EDT (daylight saving time)
  }
  
  // Default to Mountain Time if we can't determine the time zone
  return -6;
}

/**
 * Determines if a train is approaching a railcam station
 * @param trainStatus The current train status
 * @returns Information about the approaching train and station
 */
export function checkTrainApproaching(trainStatus: TrainStatus): TrainApproaching {
  // Default response when not approaching any station
  const notApproaching: TrainApproaching = {
    approaching: false
  };
  
  // If we don't have next station or ETA information, we can't determine if approaching
  if (!trainStatus?.nextStation || !trainStatus?.estimatedArrival) {
    return notApproaching;
  }
  
  // Check if the next station has a railcam
  const station = getStationByName(trainStatus.nextStation);
  if (!station) {
    return notApproaching;
  }
  
  // Calculate minutes until arrival
  const now = new Date();
  const eta = new Date(trainStatus.estimatedArrival);
  
  // Log for debugging
  console.log(`checkTrainApproaching for ${trainStatus.trainId} to ${trainStatus.nextStation}:`);
  console.log(`ETA from data: ${eta.toISOString()}, Now: ${now.toISOString()}`);
  
  const minutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
  console.log(`Minutes away: ${minutesAway}`);
  
  // Check if the train is within the approach window or post-arrival window
  // Show the webcam if the train is expected to arrive within X minutes
  // or has arrived within the last Y minutes
  if (minutesAway <= appConfig.approachWindowMinutes && minutesAway >= -appConfig.postArrivalWindowMinutes) {
    return {
      approaching: true,
      station,
      eta: trainStatus.estimatedArrival,
      minutesAway,
      youtubeLink: getYoutubeEmbedUrl(station.youtubeLink)
    };
  }
  
  return notApproaching;
}

/**
 * Finds the next railcam station along the route
 * @param trainStatus The current train status or an array of train statuses
 * @returns The next railcam station, estimated arrival time, and minutes away
 */
export function findNextRailcamStation(trainStatus: TrainStatus | TrainStatus[]): {
  station: RailcamStation;
  estimatedArrival: string;
  minutesAway: number;
  trainId?: string;
  trainIndex?: number;
} | null {
  // If we have an array of train statuses, find the one that will arrive at a railcam location first
  if (Array.isArray(trainStatus)) {
    // Filter out trains without next station or estimated arrival
    const validTrains = trainStatus.filter(train => 
      train.nextStation && train.estimatedArrival
    );
    
    if (validTrains.length === 0) {
      return null;
    }
    
    // Check each train for the next railcam station
    const railcamStations = validTrains.map((train, index) => {
      const result = findNextRailcamStation(train);
      if (result) {
        return {
          ...result,
          trainId: train.trainId,
          trainIndex: index
        };
      }
      return null;
    }).filter(Boolean);
    
    if (railcamStations.length === 0) {
      return null;
    }
    
    // Sort by minutes away and return the closest one
    return railcamStations.sort((a, b) => a!.minutesAway - b!.minutesAway)[0];
  }
  
  // Single train status processing
  if (trainStatus.nextStation && trainStatus.estimatedArrival) {
    const station = getStationByName(trainStatus.nextStation);
    if (station) {
      // Calculate minutes until arrival
      const now = new Date();
      const eta = new Date(trainStatus.estimatedArrival);
      
      // Log for debugging
      console.log(`findNextRailcamStation for ${trainStatus.trainId} to ${trainStatus.nextStation}:`);
      console.log(`ETA from data: ${eta.toISOString()}, Now: ${now.toISOString()}`);
      
      const minutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
      console.log(`Minutes away: ${minutesAway}`);
      
      return {
        station,
        estimatedArrival: trainStatus.estimatedArrival,
        minutesAway: minutesAway
      };
    }
  }
  
  // Define the Southwest Chief route with all stations
  // The order is based on the train's direction
  const westboundRoute = [
    'Chicago', 'Naperville', 'Mendota', 'Princeton', 'Galesburg', 'Fort Madison', 'La Plata', 
    'Kansas City - Union Station', 'Lawrence', 'Topeka', 'Newton', 'Hutchinson', 'Dodge City', 'Garden City', 
    'Lamar', 'La Junta', 'Trinidad', 'Raton', 'Las Vegas', 'Lamy', 'Albuquerque', 'Gallup', 
    'Winslow', 'Flagstaff - Amtrak Station', 'Kingman', 'Needles', 'Barstow - Harvey House Railroad Depot', 'Victorville', 'San Bernardino', 
    'Riverside', 'Fullerton', 'Los Angeles'
  ];
  
  const eastboundRoute = [...westboundRoute].reverse();
  
  // Select the appropriate route based on train direction
  const route = trainStatus.direction === 'westbound' ? westboundRoute : eastboundRoute;
  
  // Find the current position in the route
  let currentIndex = -1;
  if (trainStatus.nextStation) {
    currentIndex = route.findIndex(station => 
      station.toLowerCase() === trainStatus.nextStation?.toLowerCase()
    );
  }
  
  // If we couldn't find the current position, we can't determine the next railcam
  if (currentIndex === -1) {
    return null;
  }
  
  // Look for the next station with a railcam
  for (let i = currentIndex; i < route.length; i++) {
    const station = getStationByName(route[i]);
    if (station) {
      // Get the time zone offset for the station
      const timeZoneOffset = getStationTimeZoneOffset(route[i]);
      
      // For now, we'll estimate that each station is about 2-3 hours apart
      // This is a rough estimate and should be replaced with actual timetable data
      const now = new Date();
      
      // Adjust hours to add based on distance between stations and time zone differences
      // West coast stations are further apart and in different time zones
      let hoursToAdd = (i - currentIndex) * 2;
      
      // Adjust for stations that are further apart
      if (route[i] === 'Barstow' || route[i] === 'Needles' || route[i] === 'Kingman') {
        hoursToAdd = (i - currentIndex) * 3;
      }
      
      let estimatedArrival: Date;
      
      if (trainStatus.estimatedArrival && i === currentIndex) {
        // Use the actual estimated arrival for the current next station
        estimatedArrival = new Date(trainStatus.estimatedArrival);
      } else {
        // Calculate a rough estimate for future stations
        estimatedArrival = new Date();
        if (trainStatus.estimatedArrival && i === currentIndex) {
          estimatedArrival = new Date(trainStatus.estimatedArrival);
        } else {
          estimatedArrival.setHours(estimatedArrival.getHours() + hoursToAdd);
        }
      }
      
      const minutesAway = Math.floor((estimatedArrival.getTime() - now.getTime()) / (1000 * 60));
      
      return {
        station,
        estimatedArrival: estimatedArrival.toISOString(),
        minutesAway: minutesAway >= 0 ? minutesAway : 0
      };
    }
  }
  
  // If no railcam station found along the route
  return null;
}

/**
 * Generates a human-readable status message
 * @param trainStatus The current train status
 * @param approaching Information about approaching a railcam
 * @returns A human-readable status message
 */
export function generateStatusMessage(
  trainStatus: TrainStatus,
  approaching: TrainApproaching
): string {
  if (approaching.approaching && approaching.station && approaching.minutesAway !== undefined) {
    // Get the current time and the estimated arrival time
    const now = new Date();
    const eta = approaching.eta ? new Date(approaching.eta) : null;
    
    // Calculate the actual minutes away based on the current time and ETA
    let actualMinutesAway = approaching.minutesAway;
    if (eta) {
      actualMinutesAway = Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
    }
    
    // Log for debugging
    console.log(`----Train #${trainStatus.trainId} to ${approaching.station.name}:`, trainStatus,approaching);
    console.log(`ETA: ${eta ? eta.toISOString() : 'unknown'}, Now: ${now.toISOString()}`);
    console.log(`Minutes away from API: ${approaching.minutesAway}, Calculated: ${actualMinutesAway}`);
    
    // Include instance ID if available
    const instanceInfo = trainStatus.instanceId ? ` (Instance ${trainStatus.instanceId})` : '';
    
    // Include timezone if available
    const timezoneInfo = trainStatus.timezone ? ` ${trainStatus.timezone}` : '';
    
    // Only show "arrived" message if the train has actually arrived (ETA is in the past)
    if (eta && now > eta && actualMinutesAway < -2) {
      // Train has already arrived, but we're still showing the webcam
      const minutesPast = Math.abs(actualMinutesAway);
      return `Train #${trainStatus.trainId}${instanceInfo} arrived at ${approaching.station.name} approximately ${minutesPast} minutes ago${timezoneInfo}.`;
    } else {
      // Train is still approaching or just arrived
      return `Train #${trainStatus.trainId}${instanceInfo} is approaching ${approaching.station.name} and will arrive in approximately ${Math.max(0, actualMinutesAway)} minutes${timezoneInfo}.`;
    }
  } else if (trainStatus.currentLocation && trainStatus.nextStation) {
    // Include instance ID if available
    const instanceInfo = trainStatus.instanceId ? ` (Instance ${trainStatus.instanceId})` : '';
    
    // Include timezone if available
    const timezoneInfo = trainStatus.timezone ? ` ${trainStatus.timezone}` : '';
    
    // Include departed status if available
    const departedInfo = trainStatus.departed ? ' (Departed)' : '';
    
    return `Train #${trainStatus.trainId}${instanceInfo} is currently at ${trainStatus.currentLocation} and heading to ${trainStatus.nextStation}${departedInfo}${timezoneInfo}.`;
  } else {
    // Include instance ID if available
    const instanceInfo = trainStatus.instanceId ? ` (Instance ${trainStatus.instanceId})` : '';
    
    return `Train #${trainStatus.trainId}${instanceInfo} status: ${trainStatus.status}`;
  }
}
