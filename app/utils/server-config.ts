import fs from 'fs';
import path from 'path';
import { RailcamStation } from '../types';

// Path to the stations config file
const STATIONS_CONFIG_PATH = path.join(process.cwd(), 'data', 'stations-config.json');

// Default stations configuration (fallback) - All Southwest Chief stops
const DEFAULT_STATIONS: RailcamStation[] = [
  // Currently enabled railcam stations
  {
    name: 'Fullerton',
    youtubeLink: 'https://railstream.net/live-cameras/item/fullerton-guest',
    enabled: true
  },
  {
    name: 'Barstow',
    youtubeLink: 'https://www.youtube.com/watch?v=_DUQnPjPC_8',
    enabled: true
  },
  {
    name: 'Kingman',
    youtubeLink: 'https://www.youtube.com/watch?v=h8-J3JGU7g4',
    enabled: true
  },
  {
    name: 'Needles',
    youtubeLink: 'https://www.youtube.com/watch?v=sg3kp4pn9fU',
    enabled: true
  },
  {
    name: 'Flagstaff',
    youtubeLink: 'https://www.youtube.com/watch?v=7xdHH9KMSVk',
    enabled: true
  },
  {
    name: 'Winslow',
    youtubeLink: 'https://www.youtube.com/watch?v=NzOG3U9LZMw',
    enabled: true
  },
  {
    name: 'Gallup',
    youtubeLink: 'https://www.youtube.com/watch?v=hbmeqWdDLjk',
    enabled: true
  },
  {
    name: 'Las Vegas',
    youtubeLink: 'https://www.youtube.com/watch?v=BgmZJ-NUqiY',
    enabled: true
  },
  {
    name: 'Lawrence',
    youtubeLink: 'https://www.youtube.com/watch?v=PAU2JtU4WCo',
    enabled: true
  },
  {
    name: 'Kansas City',
    youtubeLink: 'https://www.youtube.com/watch?v=u6UbwlQQ3QU',
    enabled: true
  },
  {
    name: 'La Plata',
    youtubeLink: 'https://www.youtube.com/watch?v=X-ir2KfXMX0',
    enabled: true
  },
  {
    name: 'Fort Madison',
    youtubeLink: 'https://www.youtube.com/watch?v=L6eG4ahJc_Q',
    enabled: true
  },
  {
    name: 'Galesburg',
    youtubeLink: 'https://www.youtube.com/watch?v=On1MRt0NqFs',
    enabled: true
  },
  {
    name: 'Mendota',
    youtubeLink: 'https://www.youtube.com/watch?v=UE63jwH4XSs',
    enabled: true
  },
  
  // Additional Southwest Chief stops (disabled by default, can be enabled for future railcams)
  {
    name: 'Los Angeles',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Riverside',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'San Bernardino',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Victorville',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Albuquerque',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Lamy',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Raton',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Trinidad',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'La Junta',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Lamar',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Garden City',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Dodge City',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Hutchinson',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Newton',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Topeka',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Princeton',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Naperville',
    youtubeLink: '',
    enabled: false
  },
  {
    name: 'Chicago',
    youtubeLink: '',
    enabled: false
  }
];

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
        return config.stations.map((station: any) => ({
          ...station,
          enabled: station.enabled !== undefined ? station.enabled : true
        }));
      }
    }
  } catch (error) {
    console.error('Error loading stations config:', error);
  }
  
  // Return default stations if file doesn't exist or there's an error
  return DEFAULT_STATIONS;
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
 * Get the default stations (can be used on both client and server)
 */
export function getDefaultStations(): RailcamStation[] {
  return DEFAULT_STATIONS;
}
