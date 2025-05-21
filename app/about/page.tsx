'use client';

import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';

export default function About() {
  return (
    <div className="min-h-screen p-4 md:p-8 dark:bg-gray-900">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="w-10"></div> {/* Spacer to balance the ThemeToggle */}
          <div className="text-center">
            <h1 className="text-3xl font-bold dark:text-white">About Southwest Chief Railcam Tracker</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Learn more about this project and how it works
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">What is the Southwest Chief Railcam Tracker?</h2>
          <p className="mb-4 dark:text-gray-300">
            The Southwest Chief Railcam Tracker is a web application that helps train enthusiasts track the Amtrak Southwest Chief 
            as it travels between Chicago and Los Angeles. The app shows the current location and status of the train, and provides 
            live railcam feeds when the train is approaching one of the many railcams along the route.
          </p>
          <p className="mb-4 dark:text-gray-300">
            The Southwest Chief is one of Amtrak&apos;s iconic long-distance routes, covering 2,265 miles through Illinois, Iowa, Missouri, 
            Kansas, Colorado, New Mexico, Arizona, and California. The journey takes approximately 43 hours to complete.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">How It Works</h2>
          <p className="mb-4 dark:text-gray-300">
            The tracker uses data from dixielandsoftware.net to determine the current location and status of the Southwest Chief. 
            It checks for updates every hour and displays the next station the train will arrive at, along with estimated arrival times.
          </p>
          <p className="mb-4 dark:text-gray-300">
            When the train is approaching a station that has a railcam, the app will display the live feed from that railcam. 
            This allows you to watch the train pass by in real-time.
          </p>
          <p className="dark:text-gray-300">
            The app tracks both Train #3 (westbound from Chicago to Los Angeles) and Train #4 (eastbound from Los Angeles to Chicago).
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Features</h2>
          <ul className="list-disc pl-6 dark:text-gray-300">
            <li className="mb-2">Real-time tracking of the Southwest Chief&apos;s location and status</li>
            <li className="mb-2">Live railcam feeds from stations along the route</li>
            <li className="mb-2">Delay information showing if the train is running late</li>
            <li className="mb-2">Dark mode support for comfortable viewing at night</li>
            <li className="mb-2">Optional browser notifications when a train is approaching a railcam</li>
            <li>Manual update button to refresh the data on demand</li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4 dark:text-white">Data Sources</h2>
          <p className="mb-4 dark:text-gray-300">
            Train status data is sourced from dixielandsoftware.net, which provides information about Amtrak trains including 
            their current location, next station, and whether they are running on time or delayed.
          </p>
          <p className="dark:text-gray-300">
            Railcam feeds are embedded from YouTube channels that provide live streams of railroad locations along the Southwest Chief route.
          </p>
        </div>
        
        {/* Removed the "Return to Tracker" button since we now have navigation in the footer */}
      </main>
      
      <footer className="mt-12 pt-6 border-t dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>
          Southwest Chief Railcam Tracker &copy; {new Date().getFullYear()}
        </p>
        <p className="mt-1">
          Data sourced from dixielandsoftware.net | Railcam videos from YouTube
        </p>
        <p className="mt-1">
          Times and Locations are for entertainment purposes only and are not guaranteed to be correct.
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <Link href="/" className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
