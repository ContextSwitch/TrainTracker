import { AppConfig } from '../types';

// Application configuration
export const appConfig: AppConfig = {
  // Check for updates every hour
  checkIntervalMinutes: 60,
  
  // Consider train approaching when within 30 minutes of arrival
  approachWindowMinutes: 30,
  
  // Continue showing webcam for 30 minutes after arrival
  postArrivalWindowMinutes: 30,
  
  // List of stations with railcams along the Southwest Chief route
  stations: [
    {
      name: 'Fullerton',
      youtubeLink: 'https://railstream.net/live-cameras/item/fullerton-guest'
    },
    {
      name: 'Barstow - Harvey House Railroad Depot',
      youtubeLink: 'https://www.youtube.com/watch?v=_DUQnPjPC_8'
    },
    {
      name: 'Flagstaff - Amtrak Station',
      youtubeLink: 'https://www.youtube.com/watch?v=7xdHH9KMSVk'
    },
    {
      name: 'Winslow',
      youtubeLink: 'https://www.youtube.com/watch?v=NzOG3U9LZMw'
    },
    {
      name: 'Gallup',
      youtubeLink: 'https://www.youtube.com/watch?v=hbmeqWdDLjk'
    },
    {
      name: 'Las Vegas',
      youtubeLink: 'https://www.youtube.com/watch?v=BgmZJ-NUqiY'
    },
    {
      name: 'Kansas City - Union Station',
      youtubeLink: 'https://www.youtube.com/watch?v=u6UbwlQQ3QU'
    },
    {
      name: 'La Plata',
      youtubeLink: 'https://www.youtube.com/watch?v=X-ir2KfXMX0'
    },
    {
      name: 'Fort Madison',
      youtubeLink: 'https://www.youtube.com/watch?v=L6eG4ahJc_Q'
    },
    {
      name: 'Galesburg',
      youtubeLink: 'https://www.youtube.com/watch?v=On1MRt0NqFs'
    }
  ],
  
  // URLs for the Southwest Chief train status pages
  trainUrls: {
    '3': 'https://railrat.net/trains/3', // East to West
    '4': 'https://railrat.net/trains/4'  // West to East
  }
};

// Helper function to get a station by name
export function getStationByName(name: string) {
  // First try exact match
  const exactMatch = appConfig.stations.find(station => 
    station.name.toLowerCase() === name.toLowerCase()
  );
  
  if (exactMatch) {
    return exactMatch;
  }
  
  // If no exact match, try partial match
  return appConfig.stations.find(station => 
    station.name.toLowerCase().includes(name.toLowerCase()) ||
    name.toLowerCase().includes(station.name.toLowerCase())
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
