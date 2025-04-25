# Southwest Chief Railcam Tracker

A Next.js application that tracks the Amtrak Southwest Chief train and displays relevant railcam YouTube videos when the train is approaching a railcam location.

## Features

- **Real-time Train Tracking**: Monitors the status of Southwest Chief trains #3 (westbound) and #4 (eastbound)
- **Automatic Video Display**: Embeds and plays the YouTube video for the relevant railcam when a train is approaching
- **Desktop Notifications**: Alerts you when a train is approaching a railcam location
- **Mobile-Friendly Interface**: Responsive design that works well on all devices

## How It Works

1. The application scrapes train status data from railrat.net
2. It matches the train's current location with a database of railcam locations
3. When a train is approaching a railcam location, the application displays the relevant YouTube video
4. Desktop notifications alert you when a train is approaching a railcam location

## Railcam Locations

The application tracks the following railcam locations along the Southwest Chief route:

- Fullerton
- Barstow
- Flagstaff
- Winslow
- Gallup
- Las Vegas
- Santa Fe Junction/Kansas City
- La Plata
- Fort Madison
- Galesburg

## Technical Details

- **Frontend**: Next.js with React, TypeScript, and TailwindCSS
- **Data Fetching**: Server-side API routes for fetching and processing train data
- **Web Scraping**: Cheerio for HTML parsing
- **Video Embedding**: YouTube iframe API
- **Notifications**: Web Notifications API

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/southwest-chief-tracker.git
   cd southwest-chief-tracker
   ```

2. Install dependencies
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be deployed to Vercel or any other Next.js-compatible hosting service.

```
npm run build
npm run start
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Data sourced from [railrat.net](https://railrat.net)
- Railcam videos from YouTube
- Train icon from [Twemoji](https://github.com/twitter/twemoji)
