'use client';

import React, { useState, useEffect } from 'react';
import { appConfig } from '../../config';

interface ScraperToggleProps {
  initialValue?: 'dixieland' | 'transitdocs';
  onToggle?: (value: 'dixieland' | 'transitdocs') => void;
}

/**
 * Component for toggling between different scraper types in the admin interface
 */
export default function ScraperToggle({ initialValue, onToggle }: ScraperToggleProps) {
  const [scraperType, setScraperType] = useState<'dixieland' | 'transitdocs'>(
    initialValue || appConfig.scraperType || 'dixieland'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch the current config when the component mounts
    fetchCurrentConfig();
  }, []);

  /**
   * Fetches the current configuration from the API
   */
  const fetchCurrentConfig = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/config');
      const data = await response.json();

      if (data.success && data.config) {
        setScraperType(data.config.scraperType || 'dixieland');
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage('Error fetching configuration');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles the change of the scraper type
   */
  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value as 'dixieland' | 'transitdocs';
    setScraperType(newValue);

    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(newValue);
    }

    // Update the configuration via API
    try {
      setIsLoading(true);
      setMessage('');

      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperType: newValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Scraper type updated to ${newValue}`);
      } else {
        setMessage(`Error: ${data.error || 'Unknown error'}`);
        // Revert to the previous value if there was an error
        setScraperType(scraperType);
      }
    } catch (error) {
      console.error('Error updating config:', error);
      setMessage('Error updating configuration');
      // Revert to the previous value if there was an error
      setScraperType(scraperType);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tests the selected scraper type
   */
  const testScraper = async () => {
    try {
      setIsLoading(true);
      setMessage('Testing scraper...');

      const response = await fetch('/api/test-scraper-flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scraperType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Successfully tested ${scraperType} scraper`);
      } else {
        setMessage(`Error testing scraper: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error testing scraper:', error);
      setMessage('Error testing scraper');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Scraper Configuration</h2>
      
      <div className="mb-4">
        <label htmlFor="scraperType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Scraper Type
        </label>
        <select
          id="scraperType"
          value={scraperType}
          onChange={handleChange}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="dixieland">Dixieland Software</option>
          <option value="transitdocs">TransitDocs API</option>
        </select>
      </div>
      
      <div className="flex justify-between items-center">
        <button
          onClick={testScraper}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Scraper'}
        </button>
        
        {message && (
          <p className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
