import { expect } from 'chai';
import sinon from 'sinon';
import { 
  checkTrainApproaching, 
  findNextRailcamStation, 
  generateStatusMessage 
} from '../../app/utils/predictions';
import { appConfig } from '../../app/config';
import { 
  MOCK_DATE, 
  mockTrainStatus3, 
  mockTrainStatus4Fort, 
  mockTrainStatus4Las,
  mockDelayedTrainStatus,
  mockTrainApproaching,
  mockTrainNotApproaching
} from '../mocks/mockData';

describe('Predictions Utility Functions', () => {
  let clock: sinon.SinonFakeTimers;
  
  beforeEach(() => {
    // Fix the date to a known value for consistent testing
    clock = sinon.useFakeTimers(MOCK_DATE);
  });
  
  afterEach(() => {
    // Restore the clock after each test
    clock.restore();
    sinon.restore();
  });
  
  describe('checkTrainApproaching', () => {
    it('should return not approaching when train has no next station', () => {
      // @ts-ignore - Intentionally setting nextStation to undefined for test
      const trainStatus = { ...mockTrainStatus3, nextStation: undefined };
      const result = checkTrainApproaching(trainStatus);
      expect(result.approaching).to.be.false;
    });
    
    it('should return not approaching when train has no estimated arrival', () => {
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: undefined };
      const result = checkTrainApproaching(trainStatus);
      expect(result.approaching).to.be.false;
    });
    
    it('should return not approaching when next station has no railcam', () => {
      const trainStatus = { ...mockTrainStatus3, nextStation: 'Chicago' };
      const result = checkTrainApproaching(trainStatus);
      expect(result.approaching).to.be.false;
    });
    
    it('should return approaching when train is within approach window', () => {
      // Set ETA to 15 minutes from now
      const eta = new Date(MOCK_DATE.getTime() + 15 * 60 * 1000).toISOString();
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: eta };
      
      const result = checkTrainApproaching(trainStatus);
      
      expect(result.approaching).to.be.true;
      expect(result.station?.name).to.equal('Gallup');
      expect(result.minutesAway).to.be.approximately(15, 1);
      expect(result.youtubeLink).to.include('youtube.com/embed/');
    });
    
    it('should return approaching when train has just passed within post-arrival window', () => {
      // Set ETA to 15 minutes ago
      const eta = new Date(MOCK_DATE.getTime() - 15 * 60 * 1000).toISOString();
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: eta };
      
      const result = checkTrainApproaching(trainStatus);
      
      expect(result.approaching).to.be.true;
      expect(result.station?.name).to.equal('Gallup');
      expect(result.minutesAway).to.be.approximately(-15, 1);
      expect(result.youtubeLink).to.include('youtube.com/embed/');
    });
    
    it('should return not approaching when train is outside approach window', () => {
      // Set ETA to 60 minutes from now (outside the default 30 minute window)
      const eta = new Date(MOCK_DATE.getTime() + 60 * 60 * 1000).toISOString();
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: eta };
      
      const result = checkTrainApproaching(trainStatus);
      
      expect(result.approaching).to.be.false;
    });
    
    it('should return not approaching when train passed outside post-arrival window', () => {
      // Set ETA to 60 minutes ago (outside the default 30 minute window)
      const eta = new Date(MOCK_DATE.getTime() - 60 * 60 * 1000).toISOString();
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: eta };
      
      const result = checkTrainApproaching(trainStatus);
      
      expect(result.approaching).to.be.false;
    });
    
    it('should return not approaching when train passed more than an hour ago', () => {
      // Set ETA to 61 minutes ago (just over the 60 minute cutoff)
      const eta = new Date(MOCK_DATE.getTime() - 61 * 60 * 1000).toISOString();
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: eta };
      
      const result = checkTrainApproaching(trainStatus);
      
      expect(result.approaching).to.be.false;
    });
  });
  
  describe('findNextRailcamStation', () => {
    it('should return null when train has no next station', () => {
      // @ts-ignore - Intentionally setting nextStation to undefined for test
      const trainStatus = { ...mockTrainStatus3, nextStation: undefined };
      const result = findNextRailcamStation(trainStatus);
      expect(result).to.be.null;
    });
    
    it('should return null when train has no estimated arrival', () => {
      const trainStatus = { ...mockTrainStatus3, estimatedArrival: undefined };
      const result = findNextRailcamStation(trainStatus);
      expect(result).to.be.null;
    });
    
    it('should return station info when next station has a railcam', () => {
      const result = findNextRailcamStation(mockTrainStatus3);
      
      expect(result).to.not.be.null;
      expect(result?.station.name).to.equal('Gallup');
      expect(result?.minutesAway).to.be.approximately(240, 1);
    });
    
    it('should handle an array of train statuses and return the closest one', () => {
      const trainStatuses = [mockTrainStatus3, mockTrainStatus4Fort, mockTrainStatus4Las];
      const result = findNextRailcamStation(trainStatuses);
      
      expect(result).to.not.be.null;
      expect(result?.station.name).to.equal('Galesburg');
      expect(result?.minutesAway).to.be.approximately(60, 1);
      expect(result?.trainId).to.equal('4');
    });
    
    it('should return null when no trains in array have valid next stations', () => {
      // @ts-ignore - Intentionally setting nextStation to undefined for test
      const trainStatuses = [
        { ...mockTrainStatus3, nextStation: undefined },
        { ...mockTrainStatus4Fort, nextStation: undefined }
      ];
      const result = findNextRailcamStation(trainStatuses);
      
      expect(result).to.be.null;
    });
    
    it('should estimate arrival for future stations when no ETA is provided', () => {
      // Create a train status with a next station but no ETA
      const trainStatus = { 
        ...mockTrainStatus3, 
        nextStation: 'Flagstaff', 
        estimatedArrival: undefined 
      };
      
      const result = findNextRailcamStation(trainStatus);
      
      expect(result).to.not.be.null;
      expect(result?.station.name).to.equal('Flagstaff');
      expect(result?.minutesAway).to.be.a('number');
    });
  });
  
  describe('generateStatusMessage', () => {
    it('should generate message for approaching train', () => {
      const message = generateStatusMessage(mockTrainStatus3, mockTrainApproaching);
      
      expect(message).to.include('Train #3 is approaching Gallup');
      expect(message).to.include('15 minutes');
    });
    
    it('should generate message for train that has arrived', () => {
      const arrivedApproaching = { 
        ...mockTrainApproaching, 
        eta: new Date(MOCK_DATE.getTime() - 10 * 60 * 1000).toISOString(),
        minutesAway: -10
      };
      
      const message = generateStatusMessage(mockTrainStatus3, arrivedApproaching);
      
      expect(message).to.include('Train #3 expected at Gallup');
      expect(message).to.include('10 minutes ago');
    });
    
    it('should generate message for train not approaching a railcam', () => {
      const message = generateStatusMessage(mockTrainStatus3, mockTrainNotApproaching);
      
      expect(message).to.include('Train #3 is currently at');
      expect(message).to.include('heading to Gallup');
    });
    
    it('should generate generic status message when minimal info is available', () => {
      // @ts-ignore - Intentionally creating a partial TrainStatus for test
      const trainStatus = { 
        trainId: '3', 
        direction: 'westbound' as 'westbound', 
        status: 'On time',
        lastUpdated: MOCK_DATE.toISOString()
      };
      
      const message = generateStatusMessage(trainStatus, mockTrainNotApproaching);
      
      expect(message).to.include('Train #3 status: On time');
    });
    
    it('should handle delayed trains correctly', () => {
      const message = generateStatusMessage(mockDelayedTrainStatus, mockTrainNotApproaching);
      
      expect(message).to.include('Train #3 is currently at');
      expect(message).to.include('heading to Gallup');
    });
  });
});
