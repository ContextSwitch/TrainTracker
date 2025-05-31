import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigPage from '../../../app/admin/config/page';
import { AppConfig } from '../../../app/types';
import * as chai from 'chai';
import * as sinon from 'sinon';

const { expect } = chai;

// Mock the fetch function
const fetchStub = sinon.stub(global, 'fetch');

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}));

describe('ConfigPage Component', () => {
  beforeEach(() => {
    sinon.restore();
    fetchStub.reset();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render with default configuration', async () => {
    // Mock the fetch response for the initial config
    fetchStub.resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'transitdocs',
          checkIntervalMinutes: 60,
          notificationsEnabled: false,
          approachWindowMinutes: 30,
          postArrivalWindowMinutes: 30
        },
      }),
    });

    render(<ConfigPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Data Source')).to.exist;
    });

    // Check that the TransitDocs API text is displayed
    expect(screen.getByText('Data Source:')).to.exist;
    expect(screen.getByText('TransitDocs API')).to.exist;
    
    // Check that the configuration options are displayed
    expect(screen.getByText('Check Interval (minutes)')).to.exist;
    expect(screen.getByText('Enable Notifications')).to.exist;
  });

  it('should handle form submission', async () => {
    // Mock the fetch response for the initial config
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'transitdocs',
          checkIntervalMinutes: 60,
          notificationsEnabled: false,
          approachWindowMinutes: 30,
          postArrivalWindowMinutes: 30
        },
      }),
    });

    render(<ConfigPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('Data Source')).to.exist;
    });

    // Submit the form
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText('Configuration saved successfully!')).to.exist;
    });
  });
});
