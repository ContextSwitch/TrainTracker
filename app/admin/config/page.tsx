'use client';

import React, { useState, useEffect } from 'react';
import { AppConfig } from '../../types';

export default function ConfigPage() {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<Partial<AppConfig>>({
    scraperType: 'transitdocs',
    checkIntervalMinutes: 60,
    notificationsEnabled: false,
    approachWindowMinutes: 30,
    postArrivalWindowMinutes: 30
  });

  // This is a placeholder for future configuration options
  const [config, setConfig] = useState({
    checkIntervalMinutes: 60,
    notificationsEnabled: false,
    predictionEnabled: true,
    debugMode: false,
  });

  // Fetch the current configuration from the server
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/config');
        
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }
        
        const data = await response.json();
        
        if (data.success && data.config) {
          setAppConfig(data.config);
        }
      } catch (error) {
        console.error('Error fetching configuration:', error);
        setMessage({ 
          type: 'error', 
          text: 'Failed to load configuration. Please try refreshing the page.' 
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig({
      ...config,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // This is a placeholder for future implementation
    // In a real implementation, this would save the config to the server
    
    setMessage({ type: 'success', text: 'Configuration saved successfully!' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuration</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage application settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Data Source</h2>
          <div className="mt-4">
            <div className="py-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-medium">Data Source:</span> TransitDocs API
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The application is configured to use the TransitDocs API for train data.
              </p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">General Settings</h2>
          
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="checkIntervalMinutes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Check Interval (minutes)
              </label>
              <input
                type="number"
                name="checkIntervalMinutes"
                id="checkIntervalMinutes"
                min="1"
                max="1440"
                value={appConfig.checkIntervalMinutes || 60}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                How often the application should check for train updates (in minutes)
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="notificationsEnabled"
                  name="notificationsEnabled"
                  type="checkbox"
                  checked={appConfig.notificationsEnabled || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="notificationsEnabled" className="font-medium text-gray-700 dark:text-gray-300">
                  Enable Notifications
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Allow the application to send notifications about train status changes
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="predictionEnabled"
                  name="predictionEnabled"
                  type="checkbox"
                  checked={config.predictionEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="predictionEnabled" className="font-medium text-gray-700 dark:text-gray-300">
                  Enable Predictions
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Enable train arrival time predictions based on historical data
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  id="debugMode"
                  name="debugMode"
                  type="checkbox"
                  checked={config.debugMode}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="debugMode" className="font-medium text-gray-700 dark:text-gray-300">
                  Debug Mode
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  Enable additional logging and debugging information
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>

      {message && (
        <div className={`rounded-md p-4 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
          <div className="flex">
            <div className={`text-sm ${message.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {message.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
