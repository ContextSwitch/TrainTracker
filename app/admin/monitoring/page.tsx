'use client';

import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  source: string;
}

export default function MonitoringPage() {
  // Mock log data - in a real implementation, this would be fetched from the server
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Application started successfully',
      source: 'system',
    },
    {
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      level: 'info',
      message: 'Scraping completed successfully',
      source: 'scraper',
    },
    {
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      level: 'warning',
      message: 'Slow response from Amtrak API',
      source: 'scraper',
    },
    {
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      level: 'error',
      message: 'Failed to parse station data',
      source: 'parser',
    },
    {
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      level: 'info',
      message: 'Database backup completed',
      source: 'database',
    },
  ]);

  const [filter, setFilter] = useState({
    level: 'all',
    source: 'all',
  });

  const filteredLogs = logs.filter((log) => {
    if (filter.level !== 'all' && log.level !== filter.level) return false;
    if (filter.source !== 'all' && log.source !== filter.source) return false;
    return true;
  });

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilter({
      ...filter,
      [name]: value,
    });
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View system status and logs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Status</h2>
          <div className="mt-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Web Server</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Online</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Database</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connected</p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Scraper</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Running</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Resource Usage</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">CPU</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">25%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Memory</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">40%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: '40%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Disk</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">15%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Statistics</h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Users</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">127</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">API Requests (24h)</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">5,842</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Scraping Jobs (24h)</h3>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">24</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col justify-between space-y-4 sm:flex-row sm:items-center sm:space-y-0">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Logs</h2>
          <div className="flex space-x-4">
            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Level
              </label>
              <select
                id="level"
                name="level"
                value={filter.level}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Source
              </label>
              <select
                id="source"
                name="source"
                value={filter.source}
                onChange={handleFilterChange}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Sources</option>
                <option value="system">System</option>
                <option value="scraper">Scraper</option>
                <option value="parser">Parser</option>
                <option value="database">Database</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Level
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Source
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Message
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {filteredLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getLevelBadgeClass(log.level)}`}>
                        {log.level.charAt(0).toUpperCase() + log.level.slice(1)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.source.charAt(0).toUpperCase() + log.source.slice(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
