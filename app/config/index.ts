import { AppConfig, RailcamStation } from '../types';

// Default stations configuration (client-side safe) - All Southwest Chief stops
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
    youtubeLink: 'https://www.youtube.com/watch?v=PfL_zIxDIw0',
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
  
  // Use default stations (dynamic loading happens via API)
  stations: DEFAULT_STATIONS,
  
  // URLs for the Southwest Chief train status pages
  trainUrls: {
    '3': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=3', // East to West
    '4': 'https://dixielandsoftware.net/cgi-bin/gettrain.pl?seltrain=4'  // West to East
  }
};

// Function to update stations configuration (stations are now loaded via API)
export function updateStations(stations: RailcamStation[]): void {
  appConfig.stations = stations;
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
