/**
 * Shared utilities for train-related operations
 * Consolidates common logic used across TrainInstance and TrainStatus components
 */

import { TrainStatus } from '../types';

/**
 * Time formatting and calculation utilities
 */
export class TimeUtils {
  /**
   * Calculates minutes between current time and a given timestamp
   */
  static calculateMinutesAway(estimatedArrival: string | number | undefined): number {
    if (!estimatedArrival) return 0;
    
    const now = new Date();
    const eta = typeof estimatedArrival === 'number' 
      ? new Date(estimatedArrival * 1000) 
      : new Date(estimatedArrival);
    
    return Math.floor((eta.getTime() - now.getTime()) / (1000 * 60));
  }

  /**
   * Adjusts minutes for day boundaries (handles midnight wraparound)
   */
  static adjustForDayBoundaries(minutes: number): number {
    let adjustedMinutes = minutes;
    
    // Adjust for day boundaries (e.g., if the time wraps around midnight)
    while (adjustedMinutes > 720 && adjustedMinutes > 0) {
      adjustedMinutes -= 1440; // Subtract 24 hours
    }
    
    while (adjustedMinutes < -900 && adjustedMinutes < 0) {
      adjustedMinutes += 1440; // Add 24 hours
    }
    
    return adjustedMinutes;
  }

  /**
   * Formats minutes into a human-readable time string
   */
  static formatTimeUntilArrival(minutes: number): string {
    const absMinutes = Math.abs(minutes);
    
    if (absMinutes > 60) {
      const hours = Math.floor(absMinutes / 60);
      const remainingMinutes = absMinutes % 60;
      return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
    }
    
    return `${absMinutes} min`;
  }

  /**
   * Formats a timestamp to display time (HH:MM format)
   */
  static formatDisplayTime(estimatedArrival: string | number | undefined): string {
    if (!estimatedArrival) return '--:--';
    
    const eta = typeof estimatedArrival === 'number'
      ? new Date(estimatedArrival * 1000)
      : new Date(estimatedArrival);
    
    return eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Determines if a train has already passed a station
   */
  static hasPassed(minutes: number): boolean {
    return minutes <= 0;
  }
}

/**
 * Train status utilities
 */
export class TrainStatusUtils {
  /**
   * Determines if a train status is valid for display
   */
  static isValidStatus(trainStatus: TrainStatus): boolean {
    return !!(trainStatus.nextStation && trainStatus.estimatedArrival);
  }

  /**
   * Gets status color class based on train status
   */
  static getStatusColorClass(status: string): string {
    switch (status) {
      case 'Early':
      case 'On Time':
        return 'text-green-500 dark:text-green-400';
      default:
        return 'text-red-500 dark:text-red-400';
    }
  }

  /**
   * Filters out stale train data based on business rules
   */
  static filterStaleData(trainStatuses: TrainStatus[]): TrainStatus[] {
    if (trainStatuses.length <= 2) {
      return trainStatuses;
    }

    return trainStatuses.filter(status => {
      if (!status.estimatedArrival) return false;
      
      const estimatedArrivalTime = typeof status.estimatedArrival === 'number' 
        ? status.estimatedArrival 
        : Math.floor(new Date(status.estimatedArrival).getTime() / 1000);
      
      const currentTime = Math.floor(Date.now() / 1000);
      const minutesDiff = (currentTime - estimatedArrivalTime) / 60;
      
      // Keep if not at final destination OR within 3 hours of arrival/departure
      const isNotFinalDestination = status.nextStation !== 'Chicago, IL' && status.nextStation !== 'Los Angeles, CA';
      const isWithinTimeWindow = (minutesDiff < 180 && minutesDiff > 0) || (minutesDiff > -180 && minutesDiff < 0);
      
      return isNotFinalDestination || isWithinTimeWindow;
    });
  }

  /**
   * Sorts train statuses by estimated arrival time
   */
  static sortByArrivalTime(trainStatuses: TrainStatus[]): TrainStatus[] {
    return [...trainStatuses].sort((a, b) => {
      if (!a.estimatedArrival) return 1;
      if (!b.estimatedArrival) return -1;
      
      const timeA = typeof a.estimatedArrival === 'number' ? a.estimatedArrival : new Date(a.estimatedArrival).getTime() / 1000;
      const timeB = typeof b.estimatedArrival === 'number' ? b.estimatedArrival : new Date(b.estimatedArrival).getTime() / 1000;
      return timeA - timeB;
    });
  }
}

/**
 * UI styling utilities for train components
 */
export class TrainUIUtils {
  /**
   * Gets border color class based on selection and approaching status
   */
  static getBorderColorClass(isSelected: boolean, isApproaching: boolean, hasRailcam: boolean): string {
    if (isSelected && hasRailcam) {
      return 'border-blue-500 dark:border-blue-900/20';
    }
    if (isApproaching && hasRailcam) {
      return 'border-green-500 dark:border-green-400';
    }
    return 'border-gray-200 dark:border-gray-700';
  }

  /**
   * Gets background color class based on selection and approaching status
   */
  static getBackgroundColorClass(isSelected: boolean, isApproaching: boolean, hasRailcam: boolean): string {
    if (isSelected && hasRailcam) {
      return 'bg-blue-50 dark:bg-blue-400';
    }
    if (isApproaching && hasRailcam) {
      return 'bg-green-50 dark:bg-green-900/20';
    }
    return 'dark:bg-gray-900';
  }

  /**
   * Gets cursor class based on railcam availability
   */
  static getCursorClass(hasRailcam: boolean): string {
    return hasRailcam ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'cursor-default';
  }

  /**
   * Gets text color class based on railcam availability
   */
  static getTextColorClass(hasRailcam: boolean): string {
    return hasRailcam ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-500';
  }
}

/**
 * Error handling utilities
 */
export class ErrorUtils {
  /**
   * Safely handles errors with fallback values
   */
  static safeExecute<T>(fn: () => T, fallback: T, context?: string): T {
    try {
      return fn();
    } catch (error) {
      if (context && process.env.NODE_ENV === 'development') {
        console.warn(`Error in ${context}:`, error);
      }
      return fallback;
    }
  }

  /**
   * Validates required properties on an object
   */
  static validateRequired<T extends Record<string, unknown>>(
    obj: T, 
    requiredFields: (keyof T)[]
  ): boolean {
    return requiredFields.every(field => obj[field] != null);
  }
}
