import { TrainStatus, RailcamStation, TrainApproaching, CurrentStatus } from '../../app/types/index.js';

// Mock date for consistent testing
export const MOCK_DATE = new Date('2025-04-25T12:00:00Z');

// Mock train statuses
export const mockTrainStatus3: TrainStatus = {
  trainId: '3',
  direction: 'westbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route',
  nextStation: 'Gallup',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'MDT',
  instanceId: 1,
  isNext: true
};

export const mockTrainStatus3Flagstaff: TrainStatus = {
  trainId: '3',
  direction: 'westbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route',
  nextStation: 'Flagstaff',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'MDT',
  instanceId: 2,
  isNext: true

};

export const mockTrainStatus4Fort: TrainStatus = {
  trainId: '4',
  direction: 'eastbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route to Galesburg',
  nextStation: 'Galesburg',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'CDT',
  instanceId: 1,
  isNext: true

};

export const mockTrainStatus4Las: TrainStatus = {
  trainId: '4',
  direction: 'eastbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route to Las Vegas',
  nextStation: 'Las Vegas',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'MDT',
  instanceId: 2,
  isNext: true

};

export const mockDelayedTrainStatus: TrainStatus = {
  trainId: '3',
  direction: 'westbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route',
  nextStation: 'Gallup',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  status: 'Delayed 1 hr 30 min',
  delayMinutes: 90,
  departed: false,
  timezone: 'MDT',
  instanceId: 1,
  isNext: true

};

export const mockDepartedTrainStatus: TrainStatus = {
  trainId: '3',
  direction: 'westbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'Departed from Gallup',
  nextStation: 'Flagstaff',
  estimatedArrival: new Date(MOCK_DATE.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  status: 'On time',
  delayMinutes: 0,
  departed: true,
  timezone: 'MDT',
  instanceId: 1,
  isNext: true

};

// Mock railcam stations
export const mockStations: RailcamStation[] = [
  {
    name: 'Gallup',
    youtubeLink: 'https://www.youtube.com/watch?v=hbmeqWdDLjk'
  },
  {
    name: 'Las Vegas',
    youtubeLink: 'https://www.youtube.com/watch?v=BgmZJ-NUqiY'
  },
  {
    name: 'Fort Madison',
    youtubeLink: 'https://www.youtube.com/watch?v=L6eG4ahJc_Q'
  },
  {
    name: 'Galesburg',
    youtubeLink: 'https://www.youtube.com/watch?v=On1MRt0NqFs'
  },
  {
    name: 'Kansas City - Union Station',
    youtubeLink: 'https://www.youtube.com/watch?v=u6UbwlQQ3QU'
  }
];

// Mock train approaching data
export const mockTrainApproaching: TrainApproaching = {
  approaching: true,
  station: mockStations[0], // Gallup
  eta: new Date(MOCK_DATE.getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
  minutesAway: 15,
  youtubeLink: 'https://www.youtube.com/embed/hbmeqWdDLjk?autoplay=1'
};

export const mockTrainNotApproaching: TrainApproaching = {
  approaching: false
};

// Mock current status
export const mockCurrentStatus: CurrentStatus = {
  train3: mockTrainApproaching,
  train4: mockTrainNotApproaching,
  lastUpdated: MOCK_DATE.toISOString()
};

// Mock HTML responses
export const mockHtmlTrain3 = `
<!DOCTYPE html>
<html>
<head>
  <title>Amtrak Southwest Chief Train 3 Status</title>
</head>
<body>
  <h1>Amtrak Southwest Chief Train 3 Status</h1>
  <p>Latest status for Amtrak Southwest Chief Train 3, updated 14:30 on 04/25</p>
  
  <div>
    <h2>Station Arrivals</h2>
    <ul>
      <li>GLP, est. arrival 16:45, 0 hr. 0 min. late, est. departure 16:47, 0 hr. 0 min. late (Gallup).</li>
      <li>FLG, est. arrival 18:30, 0 hr. 0 min. late, est. departure 18:35, 0 hr. 0 min. late (Flagstaff).</li>
    </ul>
  </div>
  
  <div>Position Updates</div>
  <ul>
    <li>14:25 - 50 mi E of Gallup [GLP], 79 mph</li>
  </ul>
</body>
</html>
`;

export const mockHtmlTrain4 = `
<!DOCTYPE html>
<html>
<head>
  <title>Amtrak Southwest Chief Train 4 Status</title>
</head>
<body>
  <h1>Amtrak Southwest Chief Train 4 Status</h1>
  <p>Latest status for Amtrak Southwest Chief Train 4, updated 14:30 on 04/25</p>
  
  <div>
    <h2>Station Arrivals</h2>
    <ul>
      <li>GBB, est. arrival 13:00, 0 hr. 0 min. late, est. departure 13:05, 0 hr. 0 min. late (Galesburg).</li>
      <li>LVS, est. arrival 14:00, 0 hr. 0 min. late, est. departure 14:05, 0 hr. 0 min. late (Las Vegas).</li>
    </ul>
  </div>
  
  <div>Position Updates</div>
  <ul>
    <li>14:25 - 30 mi W of Galesburg [GBB], 79 mph</li>
  </ul>
</body>
</html>
`;
