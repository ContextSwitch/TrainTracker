'use client';

import React, { useEffect, useState } from 'react';
import YouTubeUrlEditor from '../../components/admin/YouTubeUrlEditor';
import AdminAuthCheck from '../../components/admin/AdminAuthCheck';

interface Station {
  name: string;
  youtubeLink: string;
  enabled?: boolean;
}

export default function YouTubeManagementPage() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch stations when the component mounts
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/stations');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stations configuration');
      }
      
      const data = await response.json();
      if (data.success) {
        setStations(data.stations);
      } else {
        throw new Error(data.error || 'Failed to fetch stations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching stations');
      console.error('Error fetching stations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStations = async (updatedStations: Station[]) => {
    const response = await fetch('/api/admin/stations', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stations: updatedStations }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update stations configuration');
    }
    
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update stations configuration');
    }
    
    // Update the local state with the new stations
    setStations(result.stations);
  };

  return (
    <AdminAuthCheck>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">YouTube URL Management</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update YouTube links for station railcams
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <span className="ml-2 text-gray-700 dark:text-gray-300">Loading...</span>
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/30">
          <div className="flex">
            <div className="text-sm text-red-700 dark:text-red-400">
              {error}
              <button
                onClick={fetchStations}
                className="ml-2 font-medium text-red-700 underline dark:text-red-400"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <YouTubeUrlEditor stations={stations} onSave={handleSaveStations} />
      )}
      </div>
    </AdminAuthCheck>
  );
}
