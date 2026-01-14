import fs from 'fs';
import path from 'path';
import { RailcamStation } from '../types';

// Path to the stations config file
const STATIONS_CONFIG_PATH = path.join(process.cwd(), 'data', 'stations-config.json');

// Minimal fallback stations - only used if JSON file is completely unavailable
// This prevents the application from breaking but encourages proper configuration
const FALLBACK_STATIONS: RailcamStation[] = [];

/**
 * Server-side function to load stations from JSON file
 * This should only be called from server-side code (API routes, etc.)
 */
export function loadStationsFromFile(): RailcamStation[] {
  try {
    // Check if the config file exists
    if (fs.existsSync(STATIONS_CONFIG_PATH)) {
      const configContent = fs.readFileSync(STATIONS_CONFIG_PATH, 'utf8');
      const config = JSON.parse(configContent);
      
      if (config.stations && Array.isArray(config.stations)) {
        // Ensure all stations have the enabled property
        return config.stations.map((station: unknown) => ({
          ...(station as RailcamStation),
          enabled: (station as RailcamStation).enabled !== undefined ? (station as RailcamStation).enabled : true
        }));
      }
    }
  } catch (error) {
    console.error('Error loading stations config:', error);
  }
  
  // Return minimal fallback if file doesn't exist or there's an error
  // This encourages proper configuration via the JSON file
  console.warn('Using fallback stations - please ensure data/stations-config.json exists and is valid');
  return FALLBACK_STATIONS;
}

/**
 * Server-side function to save stations to JSON file
 * This should only be called from server-side code (API routes, etc.)
 */
export function saveStationsToFile(stations: RailcamStation[]): void {
  try {
    // Ensure the data directory exists
    const dataDir = path.dirname(STATIONS_CONFIG_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create the config object
    const config = {
      stations: stations
    };

    // Write the config to the file
    fs.writeFileSync(STATIONS_CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving stations config:', error);
    throw error;
  }
}

/**
 * Get the fallback stations (minimal set used only when JSON file is unavailable)
 */
export function getFallbackStations(): RailcamStation[] {
  return FALLBACK_STATIONS;
}
