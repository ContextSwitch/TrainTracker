import { render } from '@testing-library/react';
import ScraperToggle from '../../../app/components/admin/ScraperToggle';
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

describe('ScraperToggle Component', () => {
  beforeEach(() => {
    sinon.restore();
    fetchStub.reset();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should render with default scraper type', async () => {
    // Mock the fetch response for the initial config
    fetchStub.resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'dixieland',
        },
      }),
    });

    const { getByText } = render(<ScraperToggle />);

    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the component rendered
    expect(getByText('Current scraper:')).to.exist;

    // Check that the dixieland button is selected
    const dixielandButton = getByText('Dixieland');
    expect(dixielandButton.className).to.include('bg-blue-600');

    // Check that the transitdocs button is not selected
    const transitdocsButton = getByText('TransitDocs');
    expect(transitdocsButton.className).not.to.include('bg-blue-600');
  });

  it('should render with initialValue prop', async () => {
    // Mock the fetch response for the initial config
    fetchStub.resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'transitdocs',
        },
      }),
    });

    const { getByLabelText } = render(<ScraperToggle initialValue="transitdocs" />);

    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the transitdocs option is selected
    const selectElement = getByLabelText('Scraper Type');
    expect(selectElement).to.exist;
    expect(selectElement.value).to.equal('transitdocs');
  });

  it('should handle scraper type change', async () => {
    // Mock the fetch response for the initial config
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'dixieland',
        },
      }),
    });

    // Mock the fetch response for the update
    fetchStub.onSecondCall().resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'transitdocs',
        },
      }),
    });

    const { getByText } = render(<ScraperToggle />);

    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the component rendered
    expect(getByLabelText('Scraper Type')).to.exist;

    // Change the select value to transitdocs
    const selectElement = getByLabelText('Scraper Type');
    selectElement.value = 'transitdocs';
    selectElement.dispatchEvent(new Event('change', { bubbles: true }));

    // Wait for the update to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the success message is displayed
    expect(getByText('Scraper type updated to transitdocs')).to.exist;

    // Check that the fetch was called with the correct parameters
    expect(fetchStub.secondCall.args[0]).to.equal('/api/admin/config');
    expect(fetchStub.secondCall.args[1].method).to.equal('POST');
    expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.deep.equal({
      scraperType: 'transitdocs',
    });
  });

  it('should handle test scraper button click', async () => {
    // Mock the fetch response for the initial config
    fetchStub.onFirstCall().resolves({
      ok: true,
      json: async () => ({
        success: true,
        config: {
          scraperType: 'dixieland',
        },
      }),
    });

    // Mock the fetch response for the test
    fetchStub.onSecondCall().resolves({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        scraperType: 'dixieland',
      }),
    });

    const { getByText } = render(<ScraperToggle />);

    // Wait for the component to load
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the component rendered
    expect(getByLabelText('Scraper Type')).to.exist;

    // Click the test button
    const testButton = getByText('Test Scraper');
    testButton.click();

    // Wait for the test to complete
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check that the success message is displayed
    expect(getByText('Successfully tested dixieland scraper')).to.exist;

    // Check that the fetch was called with the correct parameters
    expect(fetchStub.secondCall.args[0]).to.equal('/api/test-scraper-flag');
    expect(fetchStub.secondCall.args[1].method).to.equal('POST');
    expect(JSON.parse(fetchStub.secondCall.args[1].body)).to.deep.equal({
      scraperType: 'dixieland',
    });
  });
});
