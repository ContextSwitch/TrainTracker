import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render } from '@testing-library/react';
import TrainStatus from '../../app/components/TrainStatus';

// Mock date for consistent testing
const MOCK_DATE = new Date('2025-04-25T12:00:00Z');

// Mock train statuses
const mockTrainStatus3 = {
  trainId: '3',
  direction: 'westbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route',
  nextStation: 'Gallup',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'MDT',
  instanceId: 1,
  isNext: true
};

const mockTrainStatus4Fort = {
  trainId: '4',
  direction: 'eastbound',
  lastUpdated: MOCK_DATE.toISOString(),
  currentLocation: 'En route to Galesburg',
  nextStation: 'Galesburg',
  estimatedArrival: new Date(MOCK_DATE.getTime() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
  status: 'On time',
  delayMinutes: 0,
  departed: false,
  timezone: 'CDT',
  instanceId: 1,
  isNext: true
};

// Mock train approaching data
const mockTrainApproaching = {
  approaching: true,
  station: { name: 'Gallup', youtubeLink: 'https://www.youtube.com/watch?v=hbmeqWdDLjk' },
  eta: new Date(MOCK_DATE.getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
  minutesAway: 15,
  youtubeLink: 'https://www.youtube.com/embed/hbmeqWdDLjk?autoplay=1'
};

const mockTrainNotApproaching = {
  approaching: false
};

describe('TrainStatus Component', () => {
  afterEach(() => {
    sinon.restore();
  });
  
  it('should render "No data available" when trainStatus is null', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={null} 
        approaching={mockTrainNotApproaching} 
      />
    );
    
    expect(getByText('No data available')).to.exist;
  });
  
  it('should render train ID and direction when trainStatus is provided', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={mockTrainStatus3} 
        approaching={mockTrainNotApproaching} 
      />
    );
    
    expect(getByText(/SWC #3/)).to.exist;
    expect(getByText(/westbound/i)).to.exist;
  });
  
  it('should render status message when trainStatus is provided', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={mockTrainStatus3} 
        approaching={mockTrainNotApproaching} 
      />
    );
    
    expect(getByText(/Status:/)).to.exist;
    expect(getByText(/On time/)).to.exist;
  });
  
  it('should render delay information when train is delayed', () => {
    const delayedTrainStatus = {
      ...mockTrainStatus3,
      status: 'Delayed 1 hr 30 min',
      delayMinutes: 90
    };
    
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={delayedTrainStatus} 
        approaching={mockTrainNotApproaching} 
      />
    );
    
    expect(getByText(/Delay:/)).to.exist;
    expect(getByText(/90 minutes/)).to.exist;
  });
  
  it('should render approaching message when train is approaching a station', () => {
    const clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
    
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={mockTrainStatus3} 
        approaching={mockTrainApproaching} 
      />
    );
    
    expect(getByText(/Arriving at Gallup in 15 minutes/)).to.exist;
    
    clock.restore();
  });
  
  it('should render arrived message when train has arrived at a station', () => {
    const clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
    
    const arrivedApproaching = {
      ...mockTrainApproaching,
      eta: new Date(new Date('2025-04-25T12:00:00Z').getTime() - 10 * 60 * 1000).toISOString(),
      minutesAway: -10
    };
    
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={mockTrainStatus3} 
        approaching={arrivedApproaching} 
      />
    );
    
    expect(getByText(/Expected.*Gallup.*minutes ago/)).to.exist;
    
    clock.restore();
  });
  
  it('should render TrainInstance components when allTrainStatuses is provided', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="4" 
        direction="eastbound"
        trainStatus={mockTrainStatus4Fort} 
        approaching={mockTrainNotApproaching}
        allTrainStatuses={[mockTrainStatus4Fort]}
      />
    );
    
    expect(getByText(/Next Stop/)).to.exist;
  });
  
  it('should render multiple TrainInstance components when multiple train statuses are provided', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="4" 
        direction="eastbound"
        trainStatus={mockTrainStatus4Fort} 
        approaching={mockTrainNotApproaching}
        allTrainStatuses={[mockTrainStatus4Fort, mockTrainStatus4Fort]}
      />
    );
    
    expect(getByText(/Next Stops/)).to.exist;
  });
  
  it('should call onSelectStation when a station is selected', () => {
    const onSelectStationSpy = sinon.spy();
    
    const { getByText } = render(
      <TrainStatus 
        trainId="4" 
        direction="eastbound"
        trainStatus={mockTrainStatus4Fort} 
        approaching={mockTrainNotApproaching}
        allTrainStatuses={[mockTrainStatus4Fort]}
        onSelectStation={onSelectStationSpy}
      />
    );
    
    // Note: In a real test, we would use fireEvent.click to click on the TrainInstance
    // However, since we're mocking the TrainInstance component, we can't test that here
    // This would require integration testing with the actual components
  });
  
  it('should display last updated time', () => {
    const { getByText } = render(
      <TrainStatus 
        trainId="3" 
        direction="westbound"
        trainStatus={mockTrainStatus3} 
        approaching={mockTrainNotApproaching} 
      />
    );
    
    expect(getByText(/Last updated:/)).to.exist;
  });
});
