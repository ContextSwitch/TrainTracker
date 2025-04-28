'use client';

import React, { useEffect, useState } from 'react';
import { TrainApproaching } from '../types';
import { 
  areNotificationsSupported, 
  requestNotificationPermission,
  showTrainApproachingNotification,
  shouldShowNotification
} from '../utils/notifications';

interface NotificationManagerProps {
  train3: TrainApproaching;
  train4: TrainApproaching;
}

/**
 * Component to manage browser notifications
 */
const NotificationManager: React.FC<NotificationManagerProps> = ({
  train3,
  train4
}) => {
  // State to track notification permission
  const [permission, setPermission] = useState<NotificationPermission>('default');
  
  // State to track last notification times
  const [lastNotified] = useState<Map<string, Date>>(new Map());

  // State to track if notifications are supported (client-side only)
  const [notificationsSupported, setNotificationsSupported] = useState<boolean>(false);

  // Check if notifications are supported (client-side only)
  useEffect(() => {
    setNotificationsSupported(typeof window !== 'undefined' && 'Notification' in window);
  }, []);

  // Request notification permission on mount (client-side only)
  useEffect(() => {
    const checkPermission = async () => {
      if (notificationsSupported) {
        const currentPermission = await requestNotificationPermission();
        setPermission(currentPermission);
      }
    };
    
    checkPermission();
  }, [notificationsSupported]);

  // Show notifications when trains are approaching (client-side only)
  useEffect(() => {
    if (!notificationsSupported || permission !== 'granted') return;
    
    // Check if we should show a notification for train 3
    if (train3.approaching && shouldShowNotification('3', train3, lastNotified)) {
      showTrainApproachingNotification('3', train3);
    }
    
    // Check if we should show a notification for train 4
    if (train4.approaching && shouldShowNotification('4', train4, lastNotified)) {
      showTrainApproachingNotification('4', train4);
    }
  }, [train3, train4, permission, lastNotified, notificationsSupported]);

  // If we're server-side rendering or notifications aren't supported, render a simpler version
  if (typeof window === 'undefined' || !notificationsSupported) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
        <h3 className="text-lg font-semibold dark:text-white">Notifications</h3>
        <p className="dark:text-gray-300">
          Notifications are available in supported browsers.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-950 dark:border-gray-800">
      <h3 className="text-lg font-semibold dark:text-white">Notifications</h3>
      
      {permission === 'granted' ? (
        <p className="text-green-600 dark:text-green-400">
          Notifications are enabled. You will be notified when a train is approaching a railcam.
        </p>
      ) : permission === 'denied' ? (
        <p className="text-red-600 dark:text-red-400">
          Notifications are blocked. Please enable notifications in your browser settings.
        </p>
      ) : (
        <div>
          <p className="mb-2 dark:text-gray-300">
            Enable notifications to be alerted when a train is approaching a railcam.
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={async () => {
              const newPermission = await requestNotificationPermission();
              setPermission(newPermission);
            }}
          >
            Enable Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationManager;
