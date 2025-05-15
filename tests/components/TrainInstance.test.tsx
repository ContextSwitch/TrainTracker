import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render } from '@testing-library/react';
import TrainInstance from '../../app/components/TrainInstance';

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

describe('TrainInstance Component', () => {
  let clock: sinon.SinonFakeTimers;
  
  beforeEach(() => {
    // Fix the date to a known value for consistent testing
    clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
  });
  
  afterEach(() => {
    clock.restore();
    sinon.restore();
  });
  
  it('should return null when there is no next railcam station', () => {
    // Mock findNextRailcamStation to return null
    const originalModule = require('../../app/utils/predictions.js');
    const findNextRailcamStationStub = sinon.stub(originalModule, 'findNextRailcamStation').returns(null);
    
    const { container } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(container.firstChild).to.be.null;
    
    findNextRailcamStationStub.restore();
  });
  
  it('should render station name and arrival time', () => {
    const { getByText } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(getByText('Gallup')).to.exist;
    expect(getByText(/Arriving in/)).to.exist;
  });
  
  it('should render "expected X min ago" when train has passed the station', () => {
    // Set ETA to 10 minutes ago
    const passedTrainStatus = {
      ...mockTrainStatus3,
      estimatedArrival: new Date(new Date('2025-04-25T12:00:00Z').getTime() - 10 * 60 * 1000).toISOString()
    };
    
    const { getByText } = render(
      <TrainInstance 
        trainStatus={passedTrainStatus} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(getByText(/Expected 10 min ago/)).to.exist;
  });
  
  it('should render time in hours and minutes when more than 60 minutes away', () => {
    // Set ETA to 90 minutes from now
    const futureTrainStatus = {
      ...mockTrainStatus3,
      estimatedArrival: new Date(new Date('2025-04-25T12:00:00Z').getTime() + 90 * 60 * 1000).toISOString()
    };
    
    const { getByText } = render(
      <TrainInstance 
        trainStatus={futureTrainStatus} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(getByText(/Arriving in 1 hr 30 min/)).to.exist;
  });
  
  it('should render instance ID', () => {
    const { getByText } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={2}
      />
    );
    
    expect(getByText(/Instance 3/)).to.exist; // instanceId + 1
  });
  
  it('should render current location when available', () => {
    const { getByText } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(getByText(/Current location:/)).to.exist;
    expect(getByText(/En route/)).to.exist;
  });
  
  it('should render status when not "On time"', () => {
    const delayedTrainStatus = {
      ...mockTrainStatus3,
      status: 'Delayed 1 hr 30 min'
    };
    
    const { getByText } = render(
      <TrainInstance 
        trainStatus={delayedTrainStatus} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    expect(getByText(/Status:/)).to.exist;
    expect(getByText(/Delayed 1 hr 30 min/)).to.exist;
  });
  
  it('should not render status when "On time"', () => {
    const { queryAllByText } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    const statusElements = queryAllByText(/Status:/);
    expect(statusElements.length).to.equal(0);
  });
  
  it('should have selected styling when isSelected is true', () => {
    const { container } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={true}
        onSelectStation={() => {}}
        instanceId={0}
      />
    );
    
    // Check for the blue border class
    const divElement = container.firstChild as HTMLElement;
    expect(divElement.className).to.include('border-blue-500');
  });
  
  it('should call onSelectStation when clicked', () => {
    const onSelectStationSpy = sinon.spy();
    
    const { getByText } = render(
      <TrainInstance 
        trainStatus={mockTrainStatus3} 
        isSelected={false}
        onSelectStation={onSelectStationSpy}
        instanceId={0}
      />
    );
    
    // Use the returned getByText instead of screen
    const element = getByText('Gallup');
    element.click();
    
    expect(onSelectStationSpy.calledOnce).to.be.true;
    expect(onSelectStationSpy.calledWith('Gallup')).to.be.true;
  });
});
