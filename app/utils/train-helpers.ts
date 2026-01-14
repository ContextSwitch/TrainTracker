/**
 * Shared utilities for train-related operations
 * Consolidates common logic used across TrainInstance and TrainStatus components
 */

import { TrainStatus } from '../types';

/**
 * Time-related constants for calculations
 */
const TIME_CONSTANTS = {
  MILLISECONDS_PER_MINUTE: 1000 * 60,
  MINUTES_PER_HOUR: 60,
  MINUTES_PER_DAY: 1440,
  MIDNIGHT_WRAPAROUND_THRESHOLD: 720,
  STALE_DATA_CUTOFF_MINUTES: 900,
  POST_ARRIVAL_WINDOW_HOURS: 3,
  PRE_DEPARTURE_WINDOW_HOURS: 3
} as const;

/**
 * Time formatting and calculation utilities
 */
export class TimeUtils {
  /**
   * Calculates minutes between current time and a given timestamp
   */
  static calculateMinutesAway(estimatedArrival: string | number | undefined): number {
    if (!estimatedArrival) return 0;
    
    const currentTime = new Date();
    const estimatedArrivalTime = typeof estimatedArrival === 'number' 
      ? new Date(estimatedArrival * 1000) 
      : new Date(estimatedArrival);
    
    return Math.floor((estimatedArrivalTime.getTime() - currentTime.getTime()) / TIME_CONSTANTS.MILLISECONDS_PER_MINUTE);
  }

  /**
   * Adjusts minutes for day boundaries (handles midnight wraparound)
   */
  static adjustForDayBoundaries(minutesUntilArrival: number): number {
    let adjustedMinutes = minutesUntilArrival;
    
    // Adjust for day boundaries (e.g., if the time wraps around midnight)
    while (adjustedMinutes > TIME_CONSTANTS.MIDNIGHT_WRAPAROUND_THRESHOLD && adjustedMinutes > 0) {
      adjustedMinutes -= TIME_CONSTANTS.MINUTES_PER_DAY; // Subtract 24 hours
    }
    
    while (adjustedMinutes < -TIME_CONSTANTS.STALE_DATA_CUTOFF_MINUTES && adjustedMinutes < 0) {
      adjustedMinutes += TIME_CONSTANTS.MINUTES_PER_DAY; // Add 24 hours
    }
    
    return adjustedMinutes;
  }

  /**
   * Formats minutes into a human-readable time string
   */
  static formatTimeUntilArrival(minutesUntilArrival: number): string {
    const absoluteMinutes = Math.abs(minutesUntilArrival);
    
    if (absoluteMinutes > TIME_CONSTANTS.MINUTES_PER_HOUR) {
      const hours = Math.floor(absoluteMinutes / TIME_CONSTANTS.MINUTES_PER_HOUR);
      const remainingMinutes = absoluteMinutes % TIME_CONSTANTS.MINUTES_PER_HOUR;
      return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
    }
    
    return `${absoluteMinutes} min`;
  }

  /**
   * Formats a timestamp to display time (HH:MM format)
   */
  static formatDisplayTime(estimatedArrival: string | number | undefined): string {
    if (!estimatedArrival) return '--:--';
    
    const estimatedArrivalTime = typeof estimatedArrival === 'number'
      ? new Date(estimatedArrival * 1000)
      : new Date(estimatedArrival);
    
    return estimatedArrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Determines if a train has already passed a station
   */
  static hasPassed(minutesUntilArrival: number): boolean {
    return minutesUntilArrival <= 0;
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

    const timeWindowMinutes = TIME_CONSTANTS.POST_ARRIVAL_WINDOW_HOURS * TIME_CONSTANTS.MINUTES_PER_HOUR;

    return trainStatuses.filter(trainStatus => {
      if (!trainStatus.estimatedArrival) return false;
      
      const estimatedArrivalTimestamp = typeof trainStatus.estimatedArrival === 'number' 
        ? trainStatus.estimatedArrival 
        : Math.floor(new Date(trainStatus.estimatedArrival).getTime() / 1000);
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const minutesDifference = (currentTimestamp - estimatedArrivalTimestamp) / TIME_CONSTANTS.MINUTES_PER_HOUR;
      
      // Keep if not at final destination OR within 3 hours of arrival/departure
      const isNotAtFinalDestination = trainStatus.nextStation !== 'Chicago, IL' && trainStatus.nextStation !== 'Los Angeles, CA';
      const isWithinTimeWindow = (minutesDifference < timeWindowMinutes && minutesDifference > 0) || 
                                (minutesDifference > -timeWindowMinutes && minutesDifference < 0);
      
      return isNotAtFinalDestination || isWithinTimeWindow;
    });
  }

  /**
   * Sorts train statuses by estimated arrival time
   */
  static sortByArrivalTime(trainStatuses: TrainStatus[]): TrainStatus[] {
    return [...trainStatuses].sort((firstTrain, secondTrain) => {
      if (!firstTrain.estimatedArrival) return 1;
      if (!secondTrain.estimatedArrival) return -1;
      
      const firstTrainTimestamp = typeof firstTrain.estimatedArrival === 'number' 
        ? firstTrain.estimatedArrival 
        : new Date(firstTrain.estimatedArrival).getTime() / 1000;
      const secondTrainTimestamp = typeof secondTrain.estimatedArrival === 'number' 
        ? secondTrain.estimatedArrival 
        : new Date(secondTrain.estimatedArrival).getTime() / 1000;
      
      return firstTrainTimestamp - secondTrainTimestamp;
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
  static safeExecute<T>(operation: () => T, fallbackValue: T, contextDescription?: string): T {
    try {
      return operation();
    } catch (error) {
      if (contextDescription && process.env.NODE_ENV === 'development') {
        console.warn(`Error in ${contextDescription}:`, error);
      }
      return fallbackValue;
    }
  }

  /**
   * Validates required properties on an object
   */
  static validateRequired<T extends Record<string, unknown>>(
    targetObject: T, 
    requiredFields: (keyof T)[]
  ): boolean {
    return requiredFields.every(fieldName => targetObject[fieldName] != null);
  }
}
