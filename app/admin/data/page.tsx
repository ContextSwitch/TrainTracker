'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DataManagementPage() {
  const [clearingData, setClearingData] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'train' | 'current'>('train');
  const [trainStatusData, setTrainStatusData] = useState<any>(null);
  const [currentStatusData, setCurrentStatusData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Fetch train status data
  const fetchTrainStatusData = async () => {
    try {
      setLoadingData(true);
      setDataError(null);
      
      const response = await fetch('/api/admin/data/train-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch train status data');
      }
      
      const data = await response.json();
      setTrainStatusData(data);
    } catch (err) {
      console.error('Error fetching train status data:', err);
      setDataError('Failed to load train status data');
    } finally {
      setLoadingData(false);
    }
  };
  
  // Fetch current status data
  const fetchCurrentStatusData = async () => {
    try {
      setLoadingData(true);
      setDataError(null);
      
      const response = await fetch('/api/admin/data/current-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch current status data');
      }
      
      const data = await response.json();
      setCurrentStatusData(data);
    } catch (err) {
      console.error('Error fetching current status data:', err);
      setDataError('Failed to load current status data');
    } finally {
      setLoadingData(false);
    }
  };
  
  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'train' && !trainStatusData) {
      fetchTrainStatusData();
    } else if (activeTab === 'current' && !currentStatusData) {
      fetchCurrentStatusData();
    }
  }, [activeTab, trainStatusData, currentStatusData]);
  
  // Refresh data
  const handleRefreshData = () => {
    if (activeTab === 'train') {
      fetchTrainStatusData();
    } else {
      fetchCurrentStatusData();
    }
  };

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all train data? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingData(true);
      setError(null);
      setClearSuccess(false);

      const response = await fetch('/api/clear-data', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clear data');
      }

      setClearSuccess(true);
      setTimeout(() => setClearSuccess(false), 3000);
      
      // Refresh data after clearing
      setTrainStatusData(null);
      setCurrentStatusData(null);
      handleRefreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while clearing data');
      console.error('Error clearing data:', err);
    } finally {
      setClearingData(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Data Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View and manage train status data
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Train Status Data</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View and manage the current train status data
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('train')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  activeTab === 'train'
                    ? 'bg-blue-600 text-white dark:bg-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Train Status
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ${
                  activeTab === 'current'
                    ? 'bg-blue-600 text-white dark:bg-blue-700'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                Current Status
              </button>
              <button
                onClick={handleRefreshData}
                disabled={loadingData}
                className="inline-flex items-center rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Data Management</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Clear train data or trigger a manual data refresh
          </p>
          <div className="mt-4 space-y-4">
            <button
              onClick={handleClearData}
              disabled={clearingData}
              className="inline-flex items-center rounded-md bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {clearingData ? 'Clearing Data...' : 'Clear All Train Data'}
            </button>
            <Link
              href="/admin/scraping"
              className="inline-flex items-center rounded-md bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Go to Scraping Controls
            </Link>
          </div>
        </div>
      </div>

      {/* JSON Data Display */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {activeTab === 'train' ? 'Train Status JSON' : 'Current Status JSON'}
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {loadingData ? 'Loading...' : ''}
          </div>
        </div>
        
        {dataError && (
          <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
            <div className="text-sm text-red-700 dark:text-red-400">
              {dataError}
            </div>
          </div>
        )}
        
        <div className="mt-4">
          {loadingData ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-auto rounded-md bg-gray-50 p-4 dark:clr-surface-a0">
              <pre className="text-sm text-gray-800 dark:text-gray-200">
                {activeTab === 'train' 
                  ? trainStatusData ? JSON.stringify(trainStatusData, null, 2) : 'No data available'
                  : currentStatusData ? JSON.stringify(currentStatusData, null, 2) : 'No data available'
                }
              </pre>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          </div>
        </div>
      )}

      {clearSuccess && (
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/30">
          <div className="flex">
            <div className="text-sm text-green-700 dark:text-green-400">
              Train data cleared successfully!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
