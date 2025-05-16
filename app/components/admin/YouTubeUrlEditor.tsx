'use client';

import React, { useState } from 'react';
import YouTubePlayer from '../YouTubePlayer';

interface Station {
  name: string;
  youtubeLink: string;
}

interface YouTubeUrlEditorProps {
  stations: Station[];
  onSave: (stations: Station[]) => Promise<void>;
}

const YouTubeUrlEditor: React.FC<YouTubeUrlEditorProps> = ({ stations, onSave }) => {
  const [editedStations, setEditedStations] = useState<Station[]>(stations);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUrlChange = (index: number, newUrl: string) => {
    const newStations = [...editedStations];
    newStations[index] = { ...newStations[index], youtubeLink: newUrl };
    setEditedStations(newStations);
  };

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      await onSave(editedStations);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:space-x-6">
        <div className="w-full lg:w-1/2">
          <div className="overflow-hidden rounded-lg border border-gray-200 shadow dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Station
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    YouTube URL
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:clr-surface-a0">
                {editedStations.map((station, index) => (
                  <tr key={station.name}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {station.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      <input
                        type="text"
                        value={station.youtubeLink}
                        onChange={(e) => handleUrlChange(index, e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => handlePreview(station.youtubeLink)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/30">
              <div className="flex">
                <div className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-md bg-green-50 p-4 dark:bg-green-900/30">
              <div className="flex">
                <div className="text-sm text-green-700 dark:text-green-400">
                  YouTube URLs updated successfully!
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 w-full lg:mt-0 lg:w-1/2">
          <div className="rounded-lg border border-gray-200 p-4 shadow dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              YouTube Preview
            </h3>
            {previewUrl ? (
              <div className="aspect-video w-full">
                <YouTubePlayer videoUrl={previewUrl} />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                <p className="text-gray-500 dark:text-gray-400">
                  Select a station to preview its YouTube stream
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeUrlEditor;
