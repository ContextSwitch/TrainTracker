import { TrainApproaching } from '../types';

/**
 * Checks if browser notifications are supported and enabled
 * @returns True if notifications are supported and permission is granted
 */
export function areNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 
         'Notification' in window;
}

/**
 * Requests permission to show notifications
 * @returns Promise that resolves with the permission status
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!areNotificationsSupported()) {
    return 'denied';
  }
  
  try {
    return await Notification.requestPermission();
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Shows a notification when a train is approaching a railcam
 * @param trainId The train ID ('3' or '4')
 * @param approaching Information about the approaching train
 * @returns True if the notification was shown
 */
export function showTrainApproachingNotification(
  trainId: string,
  approaching: TrainApproaching
): boolean {
  // Check if notifications are supported and permission is granted
  if (!areNotificationsSupported() || Notification.permission !== 'granted') {
    return false;
  }
  
  // Check if the train is actually approaching a railcam
  if (!approaching.approaching || !approaching.station || approaching.minutesAway === undefined) {
    return false;
  }
  
  // Create the notification
  const title = `Train #${trainId} Approaching ${approaching.station.name}`;
  const options = {
    body: `Arriving in approximately ${approaching.minutesAway} minutes`,
    icon: '/train-icon.png', // We'll need to add this icon to the public folder
    tag: `train-${trainId}-${approaching.station.name}`, // Prevent duplicate notifications
    requireInteraction: true // Keep the notification visible until dismissed
  };
  
  // Show the notification
  try {
    const notification = new Notification(title, options);
    
    // Add click handler to open the app when the notification is clicked
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
}

/**
 * Checks if a notification should be shown for a train approaching a railcam
 * @param trainId The train ID ('3' or '4')
 * @param approaching Information about the approaching train
 * @param lastNotified Map of last notification times by train and station
 * @returns True if a notification should be shown
 */
export function shouldShowNotification(
  trainId: string,
  approaching: TrainApproaching,
  lastNotified: Map<string, Date>
): boolean {
  // Check if the train is actually approaching a railcam
  if (!approaching.approaching || !approaching.station) {
    return false;
  }
  
  // Create a key for this train and station
  const key = `train-${trainId}-${approaching.station.name}`;
  
  // Check if we've already notified for this train and station
  if (lastNotified.has(key)) {
    const lastTime = lastNotified.get(key)!;
    const now = new Date();
    
    // Only notify again if it's been at least 30 minutes since the last notification
    if ((now.getTime() - lastTime.getTime()) < 30 * 60 * 1000) {
      return false;
    }
  }
  
  // Update the last notified time
  lastNotified.set(key, new Date());
  
  return true;
}
