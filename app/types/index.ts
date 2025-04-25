// Types for the Southwest Chief Railcam Tracker

// Train data from railrat.net
export interface TrainStatus {
  trainId: string;          // '3' or '4'
  direction: 'eastbound' | 'westbound';
  lastUpdated: string;      // ISO date string
  currentLocation?: string; // Current location name if available
  nextStation?: string;     // Next station name
  estimatedArrival?: string; // ISO date string for estimated arrival at next station
  status: string;           // Status message (on time, delayed, etc.)
  delayMinutes?: number;    // Delay in minutes if available
}

// Station with railcam information
export interface RailcamStation {
  name: string;             // Station name
  youtubeLink: string;      // YouTube embed link
  coordinates?: {           // Optional coordinates for mapping
    lat: number;
    lng: number;
  };
}

// Current status for the frontend
export interface CurrentStatus {
  train3: TrainApproaching; // Westbound (East to West)
  train4: TrainApproaching; // Eastbound (West to East)
  lastUpdated: string;      // ISO date string
}

// Information about a train approaching a railcam
export interface TrainApproaching {
  approaching: boolean;     // Is the train approaching a railcam station?
  station?: RailcamStation; // The station being approached
  eta?: string;             // ISO date string for estimated arrival
  minutesAway?: number;     // Minutes until arrival
  youtubeLink?: string;     // YouTube link for the railcam
}

// Configuration for the application
export interface AppConfig {
  checkIntervalMinutes: number;
  approachWindowMinutes: number;
  postArrivalWindowMinutes: number;
  stations: RailcamStation[];
  trainUrls: {
    '3': string;
    '4': string;
  };
}
