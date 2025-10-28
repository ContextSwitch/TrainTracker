import { expect } from 'chai';
import sinon from 'sinon';
import { TimeUtils, TrainStatusUtils, TrainUIUtils, ErrorUtils } from '../../app/utils/train-helpers';
import { TrainStatus } from '../../app/types';

describe('Train Helper Utilities', () => {
  let clock: sinon.SinonFakeTimers;
  
  beforeEach(() => {
    // Set up a fixed time for consistent testing
    clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
  });
  
  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  describe('TimeUtils', () => {
    describe('calculateMinutesAway', () => {
      it('should calculate minutes away for future time', () => {
        const futureTime = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
        const result = TimeUtils.calculateMinutesAway(futureTime);
        expect(result).to.equal(30);
      });

      it('should calculate negative minutes for past time', () => {
        const pastTime = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 minutes ago
        const result = TimeUtils.calculateMinutesAway(pastTime);
        expect(result).to.equal(-15);
      });

      it('should handle timestamp numbers', () => {
        const futureTimestamp = Math.floor((Date.now() + 30 * 60 * 1000) / 1000); // 30 minutes from now in seconds
        const result = TimeUtils.calculateMinutesAway(futureTimestamp);
        expect(result).to.equal(30);
      });

      it('should handle undefined input', () => {
        const result = TimeUtils.calculateMinutesAway(undefined);
        expect(result).to.equal(0);
      });

      it('should handle empty string', () => {
        const result = TimeUtils.calculateMinutesAway('');
        expect(result).to.equal(0);
      });
    });

    describe('adjustForDayBoundaries', () => {
      it('should return positive minutes unchanged when under 720', () => {
        const result = TimeUtils.adjustForDayBoundaries(30);
        expect(result).to.equal(30);
      });

      it('should return zero unchanged', () => {
        const result = TimeUtils.adjustForDayBoundaries(0);
        expect(result).to.equal(0);
      });

      it('should adjust large positive values (over 720 minutes)', () => {
        const result = TimeUtils.adjustForDayBoundaries(800); // Over 12 hours
        expect(result).to.be.lessThan(800);
        expect(result).to.equal(800 - 1440); // Should subtract 24 hours
      });

      it('should adjust large negative values (under -900 minutes)', () => {
        const result = TimeUtils.adjustForDayBoundaries(-1000); // Over 15 hours ago
        expect(result).to.be.greaterThan(-1000);
        expect(result).to.equal(-1000 + 1440); // Should add 24 hours
      });

      it('should keep small negative values unchanged', () => {
        const result = TimeUtils.adjustForDayBoundaries(-30);
        expect(result).to.equal(-30);
      });
    });

    describe('formatTimeUntilArrival', () => {
      it('should format minutes only for values under 60', () => {
        const result = TimeUtils.formatTimeUntilArrival(45);
        expect(result).to.equal('45 min');
      });

      it('should format hours and minutes for values over 60', () => {
        const result = TimeUtils.formatTimeUntilArrival(90);
        expect(result).to.equal('1 hr 30 min');
      });

      it('should handle exact hours', () => {
        const result = TimeUtils.formatTimeUntilArrival(120);
        expect(result).to.equal('2 hrs 0 min');
      });

      it('should handle zero minutes', () => {
        const result = TimeUtils.formatTimeUntilArrival(0);
        expect(result).to.equal('0 min');
      });

      it('should handle negative values by using absolute value', () => {
        const result = TimeUtils.formatTimeUntilArrival(-30);
        expect(result).to.equal('30 min');
      });
    });

    describe('formatDisplayTime', () => {
      it('should format timestamp to HH:MM', () => {
        const timestamp = new Date('2025-04-25T14:30:00Z').toISOString();
        const result = TimeUtils.formatDisplayTime(timestamp);
        expect(result).to.match(/\d{1,2}:\d{2}/); // Should match time format
      });

      it('should handle timestamp numbers', () => {
        const timestamp = Math.floor(new Date('2025-04-25T14:30:00Z').getTime() / 1000);
        const result = TimeUtils.formatDisplayTime(timestamp);
        expect(result).to.match(/\d{1,2}:\d{2}/);
      });

      it('should handle undefined input', () => {
        const result = TimeUtils.formatDisplayTime(undefined);
        expect(result).to.equal('--:--');
      });
    });

    describe('hasPassed', () => {
      it('should return true for negative minutes', () => {
        const result = TimeUtils.hasPassed(-10);
        expect(result).to.be.true;
      });

      it('should return true for zero minutes', () => {
        const result = TimeUtils.hasPassed(0);
        expect(result).to.be.true;
      });

      it('should return false for positive minutes', () => {
        const result = TimeUtils.hasPassed(10);
        expect(result).to.be.false;
      });
    });
  });

  describe('TrainStatusUtils', () => {
    const mockTrainStatus: TrainStatus = {
      trainId: '3',
      direction: 'westbound',
      lastUpdated: new Date().toISOString(),
      currentLocation: 'En route',
      nextStation: 'Gallup',
      estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'On time',
      delayMinutes: 0,
      departed: false,
      timezone: 'MDT',
      instanceId: 1,
      isNext: true
    };

    describe('isValidStatus', () => {
      it('should return true for valid train status', () => {
        const result = TrainStatusUtils.isValidStatus(mockTrainStatus);
        expect(result).to.be.true;
      });

      it('should return false for missing nextStation', () => {
        const invalidStatus = { ...mockTrainStatus, nextStation: '' };
        const result = TrainStatusUtils.isValidStatus(invalidStatus);
        expect(result).to.be.false;
      });

      it('should return false for missing estimatedArrival', () => {
        const invalidStatus = { ...mockTrainStatus, estimatedArrival: '' };
        const result = TrainStatusUtils.isValidStatus(invalidStatus);
        expect(result).to.be.false;
      });
    });

    describe('getStatusColorClass', () => {
      it('should return green class for "On Time"', () => {
        const result = TrainStatusUtils.getStatusColorClass('On Time');
        expect(result).to.equal('text-green-500 dark:text-green-400');
      });

      it('should return green class for "Early"', () => {
        const result = TrainStatusUtils.getStatusColorClass('Early');
        expect(result).to.equal('text-green-500 dark:text-green-400');
      });

      it('should return red class for delayed status', () => {
        const result = TrainStatusUtils.getStatusColorClass('Delayed 30 min');
        expect(result).to.equal('text-red-500 dark:text-red-400');
      });

      it('should return red class for unknown status', () => {
        const result = TrainStatusUtils.getStatusColorClass('Unknown');
        expect(result).to.equal('text-red-500 dark:text-red-400');
      });
    });

    describe('filterStaleData', () => {
      it('should return all data when 2 or fewer items', () => {
        const trainStatuses = [mockTrainStatus];
        const result = TrainStatusUtils.filterStaleData(trainStatuses);
        expect(result).to.have.length(1);
        expect(result[0]).to.equal(mockTrainStatus);
      });

      it('should filter out final destinations beyond time window', () => {
        const finalDestinationStatus = {
          ...mockTrainStatus,
          nextStation: 'Chicago, IL',
          estimatedArrival: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
        };
        
        const trainStatuses = [mockTrainStatus, finalDestinationStatus, mockTrainStatus];
        const result = TrainStatusUtils.filterStaleData(trainStatuses);
        
        expect(result).to.have.length(2);
        expect(result).to.not.include(finalDestinationStatus);
      });

      it('should keep final destinations within time window', () => {
        const recentFinalDestination = {
          ...mockTrainStatus,
          nextStation: 'Los Angeles, CA',
          estimatedArrival: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        };
        
        const trainStatuses = [mockTrainStatus, recentFinalDestination, mockTrainStatus];
        const result = TrainStatusUtils.filterStaleData(trainStatuses);
        
        expect(result).to.have.length(3);
        expect(result).to.include(recentFinalDestination);
      });

      it('should handle missing estimatedArrival', () => {
        const invalidStatus = { ...mockTrainStatus, estimatedArrival: '' };
        const trainStatuses = [mockTrainStatus, invalidStatus, mockTrainStatus];
        const result = TrainStatusUtils.filterStaleData(trainStatuses);
        
        expect(result).to.have.length(2);
        expect(result).to.not.include(invalidStatus);
      });
    });

    describe('sortByArrivalTime', () => {
      it('should sort by estimated arrival time (earliest first)', () => {
        const laterStatus = {
          ...mockTrainStatus,
          estimatedArrival: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 60 minutes
        };
        const earlierStatus = {
          ...mockTrainStatus,
          estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        };
        
        const trainStatuses = [laterStatus, earlierStatus];
        const result = TrainStatusUtils.sortByArrivalTime(trainStatuses);
        
        expect(result[0]).to.equal(earlierStatus);
        expect(result[1]).to.equal(laterStatus);
      });

      it('should handle timestamp numbers', () => {
        const laterStatus = {
          ...mockTrainStatus,
          estimatedArrival: Math.floor((Date.now() + 60 * 60 * 1000) / 1000) // 60 minutes in seconds
        };
        const earlierStatus = {
          ...mockTrainStatus,
          estimatedArrival: Math.floor((Date.now() + 30 * 60 * 1000) / 1000) // 30 minutes in seconds
        };
        
        const trainStatuses = [laterStatus, earlierStatus];
        const result = TrainStatusUtils.sortByArrivalTime(trainStatuses);
        
        expect(result[0]).to.equal(earlierStatus);
        expect(result[1]).to.equal(laterStatus);
      });

      it('should handle missing estimatedArrival', () => {
        const validStatus = mockTrainStatus;
        const invalidStatus = { ...mockTrainStatus, estimatedArrival: '' };
        
        const trainStatuses = [invalidStatus, validStatus];
        const result = TrainStatusUtils.sortByArrivalTime(trainStatuses);
        
        expect(result[0]).to.equal(validStatus);
        expect(result[1]).to.equal(invalidStatus);
      });
    });
  });

  describe('TrainUIUtils', () => {
    describe('getBorderColorClass', () => {
      it('should return blue border for selected with railcam', () => {
        const result = TrainUIUtils.getBorderColorClass(true, false, true);
        expect(result).to.equal('border-blue-500 dark:border-blue-900/20');
      });

      it('should return green border for approaching with railcam', () => {
        const result = TrainUIUtils.getBorderColorClass(false, true, true);
        expect(result).to.equal('border-green-500 dark:border-green-400');
      });

      it('should return gray border for default state', () => {
        const result = TrainUIUtils.getBorderColorClass(false, false, false);
        expect(result).to.equal('border-gray-200 dark:border-gray-700');
      });
    });

    describe('getBackgroundColorClass', () => {
      it('should return blue background for selected with railcam', () => {
        const result = TrainUIUtils.getBackgroundColorClass(true, false, true);
        expect(result).to.equal('bg-blue-50 dark:bg-blue-400');
      });

      it('should return green background for approaching with railcam', () => {
        const result = TrainUIUtils.getBackgroundColorClass(false, true, true);
        expect(result).to.equal('bg-green-50 dark:bg-green-900/20');
      });

      it('should return gray background for default state', () => {
        const result = TrainUIUtils.getBackgroundColorClass(false, false, false);
        expect(result).to.equal('dark:bg-gray-900');
      });
    });

    describe('getCursorClass', () => {
      it('should return pointer cursor for stations with railcam', () => {
        const result = TrainUIUtils.getCursorClass(true);
        expect(result).to.equal('cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30');
      });

      it('should return default cursor for stations without railcam', () => {
        const result = TrainUIUtils.getCursorClass(false);
        expect(result).to.equal('cursor-default');
      });
    });

    describe('getTextColorClass', () => {
      it('should return normal text color for stations with railcam', () => {
        const result = TrainUIUtils.getTextColorClass(true);
        expect(result).to.equal('text-gray-800 dark:text-gray-200');
      });

      it('should return muted text color for stations without railcam', () => {
        const result = TrainUIUtils.getTextColorClass(false);
        expect(result).to.equal('text-gray-500 dark:text-gray-500');
      });
    });
  });

  describe('ErrorUtils', () => {
    describe('safeExecute', () => {
      it('should execute function successfully and return result', () => {
        const testFunction = () => 'success';
        const result = ErrorUtils.safeExecute(testFunction, 'fallback', 'TEST');
        
        expect(result).to.equal('success');
      });

      it('should return fallback value when function throws error', () => {
        const testFunction = () => {
          throw new Error('Test error');
        };
        const result = ErrorUtils.safeExecute(testFunction, 'fallback', 'TEST');
        
        expect(result).to.equal('fallback');
      });

      it('should handle functions with parameters', () => {
        const testFunction = () => 2 + 3;
        const result = ErrorUtils.safeExecute(testFunction, 0, 'TEST');
        
        expect(result).to.equal(5);
      });

      it('should log errors in development mode', () => {
        const originalEnv = process.env.NODE_ENV;
        
        // Use Object.defineProperty to modify NODE_ENV
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'development',
          configurable: true
        });
        
        const consoleWarnSpy = sinon.spy(console, 'warn');
        
        const testFunction = () => {
          throw new Error('Test error');
        };
        
        ErrorUtils.safeExecute(testFunction, 'fallback', 'TEST');
        
        expect(consoleWarnSpy.calledOnce).to.be.true;
        expect(consoleWarnSpy.firstCall.args[0]).to.include('Error in TEST:');
        
        consoleWarnSpy.restore();
        
        // Restore original NODE_ENV
        if (originalEnv !== undefined) {
          Object.defineProperty(process.env, 'NODE_ENV', {
            value: originalEnv,
            configurable: true
          });
        }
      });
    });

    describe('validateRequired', () => {
      it('should return true when all required fields are present', () => {
        const obj = { name: 'test', value: 42, flag: true };
        const result = ErrorUtils.validateRequired(obj, ['name', 'value']);
        
        expect(result).to.be.true;
      });

      it('should return false when required field is missing', () => {
        const obj = { name: 'test', value: undefined };
        const result = ErrorUtils.validateRequired(obj, ['name', 'value']);
        
        expect(result).to.be.false;
      });

      it('should return false when required field is null', () => {
        const obj = { name: 'test', value: null };
        const result = ErrorUtils.validateRequired(obj, ['name', 'value']);
        
        expect(result).to.be.false;
      });

      it('should return true for empty required fields array', () => {
        const obj = { name: 'test' };
        const result = ErrorUtils.validateRequired(obj, []);
        
        expect(result).to.be.true;
      });
    });
  });
});
