import { AppConfig, RailcamStation } from '../types';

// Stations will be loaded dynamically from the API
// This ensures single source of truth from data/stations-config.json
let loadedStations: RailcamStation[] = [];
let stationsLoaded = false;

// Application configuration
export const appConfig: AppConfig = {
  // Check for updates every hour
  checkIntervalMinutes: 60,
  
  // Consider train approaching when within 30 minutes of arrival
  approachWindowMinutes: 30,
  
  // Continue showing webcam for 30 minutes after arrival
  postArrivalWindowMinutes: 30,
  
  // Notifications are disabled by default
  notificationsEnabled: false,
  
  // Using TransitDocs API for train data
  scraperType: 'transitdocs',
  
  // Stations loaded dynamically from API (single source of truth)
  stations: loadedStations,
  
  // URLs for the Southwest Chief train status pages
  trainUrls: {
    '3': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=3', // East to West
    '4': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=4'  // West to East
  }
};

// Function to update stations configuration (stations are now loaded via API)
export function updateStations(stations: RailcamStation[]): void {
  loadedStations = stations;
  appConfig.stations = stations;
  stationsLoaded = true;
}

// Function to load stations from API
export async function loadStationsFromAPI(): Promise<RailcamStation[]> {
  if (stationsLoaded) {
    return loadedStations;
  }
  
  try {
    const response = await fetch('/api/stations-config');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success && data.stations) {
      updateStations(data.stations);
      return data.stations;
    } else {
      throw new Error('Invalid response format');
    }
  } catch (error) {
    console.error('Error loading stations from API:', error);
    // Return empty array as fallback - no hardcoded defaults
    return [];
  }
}

// Function to check if stations are loaded
export function areStationsLoaded(): boolean {
  return stationsLoaded;
}

// Helper function to get a station by name
export function getStationByName(name: string) {
  if (!name) return null;
  
  // Clean up the name by removing state abbreviations and commas
  const cleanName = name.replace(/,\s*[A-Z]{2}$/, '').trim();
  
  // Special case for Kansas City
  if (cleanName === 'Kansas City') {
    const kansasCity = appConfig.stations.find(station => 
      station.name.startsWith('Kansas City')
    );
    if (kansasCity) {
      return kansasCity;
    }
  }
  
  // First try exact match
  const exactMatch = appConfig.stations.find(station => 
    station.name.toLowerCase() === cleanName.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, try partial match with the city name only
  // This will match "Kansas City, MO" with "Kansas City - Union Station"
  const cityName = cleanName.split(' - ')[0].trim();
  const partialMatch = appConfig.stations.find(station => {
    const stationCity = station.name.split(' - ')[0].trim().toLowerCase();
    return stationCity === cityName.toLowerCase() || 
           stationCity.includes(cityName.toLowerCase()) || 
           cityName.toLowerCase().includes(stationCity);
  });
  
  if (partialMatch) {
    return partialMatch;
  }
  
  // If still no match, try a more general partial match
  return appConfig.stations.find(station => 
    station.name.toLowerCase().includes(cleanName.toLowerCase()) ||
    cleanName.toLowerCase().includes(station.name.toLowerCase())
  );
}

// Helper function to get YouTube embed URL from watch URL
export function getYoutubeEmbedUrl(watchUrl: string): string {
  // Handle different YouTube URL formats
  if (watchUrl.includes('youtube.com/watch')) {
    // Extract video ID from watch URL
    const videoId = new URL(watchUrl).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (watchUrl.includes('youtube.com/live')) {
    // Extract video ID from live URL
    const parts = watchUrl.split('/');
    const videoId = parts[parts.length - 1];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else if (watchUrl.includes('railstream.net')) {
    // For railstream.net, we'll need to handle this differently
    // This is a placeholder - we might need to adjust based on how railstream.net embeds work
    return watchUrl;
  }
  
  // Return the original URL if we can't parse it
  return watchUrl;
}
