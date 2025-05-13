'use client';

import React, { useEffect, useState } from 'react';
import { CurrentStatus, TrainStatus, TrainApproaching } from '../types';
import YouTubePlayer from '../components/YouTubePlayer';
import TrainStatusComponent from '../components/TrainStatus';
import NotificationManager from '../components/NotificationManager';
import ThemeToggle from '../components/ThemeToggle';
import RouteStations from '../components/RouteStations';

export default function Home() {
  // State to store the current status
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus>({
    train3: { approaching: false },
    train4: { approaching: false },
    lastUpdated: new Date().toISOString()
  });
  
  // State to track which train was last selected
  const [lastSelectedTrain, setLastSelectedTrain] = useState<string | null>(null);
  
  // State to store the train status
  const [train3Status, setTrain3Status] = useState<TrainStatus | null>(null);
  const [train3Statuses, setTrain3Statuses] = useState<TrainStatus[]>([]);
  const [train4Statuses, setTrain4Statuses] = useState<TrainStatus[]>([]);
  


  // State to track loading and errors
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the current status
  const fetchCurrentStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('0000 current status')
      // Fetch the current status from the API
      const statusResponse = await fetch('/api/status');
      
      if (!statusResponse.ok) {
        throw new Error(`Error fetching status: ${statusResponse.statusText}`);
      }
      
      const statusData: CurrentStatus = await statusResponse.json();
      setCurrentStatus(statusData);
      
      // Fetch the train status data from the API
      const train3Response = await fetch('/api/stations?trainId=3');
      const train4Response = await fetch('/api/stations?trainId=4');
      
      if (!train3Response.ok || !train4Response.ok) {
        throw new Error('Error fetching train status');
      }
      
      const train3Data = await train3Response.json();
      const train4Data = await train4Response.json();
      
      console.log("Lookup response = ", train3Response, train4Response)

      // Store all train instances
      if (train3Data && train3Data.length > 0) {
        setTrain3Status(train3Data[0]); // Keep the first one as the primary status
        setTrain3Statuses(train3Data); // Store all instances
      }
      
      if (train4Data && train4Data.length > 0) {
        setTrain4Statuses(train4Data);
      }

    } catch (err) {
      console.error('Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to trigger a data update
  const triggerUpdate = async () => {
    try {
      setLoading(true);
      // Call the cron API to trigger an update
      console.log('calling cron');
      const response = await fetch('/api/cron');
      console.log('response = ', response)
      if (!response.ok) {
        throw new Error(`Error triggering update: ${response.statusText}`);
      }
      
      // Fetch the updated status
      await fetchCurrentStatus();
    } catch (err) {
      console.error('Error triggering update:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };
  
  // Function to handle selecting a station for viewing
  const handleSelectStation = async (trainId: string, stationName: string) => {
    try {
      setLoading(true);
      
      // Update the last selected train
      setLastSelectedTrain(trainId);
      
      // Call the select-view API to update the current viewing selection
      const response = await fetch('/api/select-view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainId, stationName }),
      });
      
      if (!response.ok) {
        throw new Error(`Error selecting station: ${response.statusText}`);
      }
      
      // Update the current status with the response, but preserve the message
      const updatedStatus = await response.json();
      console.log('-----updatedStatus', updatedStatus)
      // Update the showVideoFor state based on the selected train
      if (trainId === '3') {
        setShowVideoFor(updatedStatus.train3);
      } else {
        setShowVideoFor(updatedStatus.train4);
      }
      
      // Only update the selected train's information, not the entire status
      setCurrentStatus(prevStatus => {
        if (trainId === '3') {
          return {
            ...prevStatus,
            train3: updatedStatus.train3
          };
        } else {
          return {
            ...prevStatus,
            train4: updatedStatus.train4
          };
        }
      });
    } catch (err) {
      console.error('Error selecting station:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch the current status on mount and set up polling
  useEffect(() => {
    // Fetch the initial status
    fetchCurrentStatus();
    
    // Set up polling every 5 minutes
    const intervalId = setInterval(() => {
      fetchCurrentStatus();
    }, 5 * 60 * 1000);
    
    // Clean up the interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // State to track which train to show video for
  const [showVideoFor, setShowVideoFor] = useState<TrainApproaching | null>(null);
  
  // Initialize showVideoFor based on approaching trains
  useEffect(() => {
    if (!showVideoFor) {
      if (currentStatus.train3.approaching) {
        setShowVideoFor(currentStatus.train3);
      } else if (currentStatus.train4.approaching) {
        setShowVideoFor(currentStatus.train4);
      }
    }
  }, [currentStatus, showVideoFor]);
  

  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-gray-900">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="w-10"></div> {/* Spacer to balance the ThemeToggle */}
          <div className="text-center">
            <h1 className="text-3xl font-bold dark:text-white">Southwest Chief Railcam Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-Time Southwest Chief Journey Viewer
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto">
        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            <p className="font-medium">Error: {error}</p>
            <button
              className="mt-2 px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-800 dark:hover:bg-red-700"
              onClick={fetchCurrentStatus}
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Loading indicator */}
        {loading && !error && (
          <div className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-700 dark:text-blue-400">Loading train status...</p>
          </div>
        )}
        
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar - Chicago → Los Angeles route (Train #3) */}
          <div className="lg:w-64">
            <RouteStations 
              onSelectStation={handleSelectStation} 
              selectedStation={showVideoFor?.station?.name}
              trainId="3"
              direction="westbound"
              trainStatus={train3Status}
              allStatuses={train3Statuses}
            />
          </div>
          
          {/* Main content */}
          <div className="flex-1">
            {/* Video player */}
            {showVideoFor && showVideoFor.youtubeLink ? (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">
                  Live Railcam: {showVideoFor.station?.name}
                </h2>
                <div className="bg-black rounded-lg overflow-hidden">
                  <YouTubePlayer videoUrl={showVideoFor.youtubeLink} />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Train #{showVideoFor === currentStatus.train3 ? '3' : '4'} is approaching this location
                </p>
              </div>
            ) : (
              <div className="mb-8 p-8 border rounded-lg bg-gray-50 dark:bg-gray-950 dark:border-gray-800 text-center">
                <h2 className="text-xl font-semibold mb-2 dark:text-white">No Trains Approaching Railcams</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  When a train is approaching a railcam location, the live video will appear here.
                </p>
              </div>
            )}
            
            {/* Train status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <TrainStatusComponent
                trainId="3"
                trainStatus={train3Status}
                direction="Los Angeles"
                approaching={currentStatus.train3}
                allTrainStatuses={train3Statuses}
                onSelectStation={handleSelectStation}
                selectedStation={showVideoFor?.station?.name}
              />
              <TrainStatusComponent
                trainId="4"
                trainStatus={train4Statuses.length > 0 ? train4Statuses[0] : null}
                direction="Chicago"
                approaching={currentStatus.train4}
                allTrainStatuses={train4Statuses}
                onSelectStation={handleSelectStation}
                selectedStation={showVideoFor?.station?.name}
              />
            </div>
            
            {/* Notification manager */}
            <NotificationManager
              train3={currentStatus.train3}
              train4={currentStatus.train4}
            />
            
            {/* Update and Clear buttons */}
            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700 flex items-center justify-center"
                  onClick={triggerUpdate}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    'Update Now'
                  )}
                </button>
                
                <button
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all train status data? This will remove all current train information.')) {
                      setLoading(true);
                      try {
                        const response = await fetch('/api/clear-data', {
                          method: 'POST',
                        });
                        
                        if (!response.ok) {
                          throw new Error(`Error clearing data: ${response.statusText}`);
                        }
                        
                        // Fetch the updated status after clearing
                        await fetchCurrentStatus();
                        alert('Train status data cleared successfully');
                      } catch (err) {
                        console.error('Error clearing data:', err);
                        setError(err instanceof Error ? err.message : 'Unknown error');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  disabled={loading}
                >
                  Clear Data
                </button>
              </div>
              
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Last updated: {currentStatus.lastUpdated ? new Date(currentStatus.lastUpdated).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
          
          {/* Right sidebar - Los Angeles → Chicago route (Train #4) */}
          <div className="lg:w-64">
            <RouteStations 
              onSelectStation={handleSelectStation} 
              selectedStation={showVideoFor?.station?.name}
              trainId="4"
              direction="eastbound"
              trainStatus={train4Statuses.length > 0 ? train4Statuses[0] : null}
              allStatuses={train4Statuses}
            />
            
          </div>
        </div>
      </main>
      
      <footer className="mt-12 pt-6 border-t dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>
          Southwest Chief Railcam Tracker &copy; {new Date().getFullYear()}
        </p>
        <p className="mt-1">
          Data sourced from dixielandsoftware.net | Railcam videos from YouTube
        </p>
        <p className="mt-1">
          Times and locations are for entertainment purposes only and are not guaranteed to be correct.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <a href="/about" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            About
          </a>
        </div>
      </footer>
    </div>
  );
}
