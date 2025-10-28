import { expect } from 'chai';
import sinon from 'sinon';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/scrape.js';
import * as scraper from '../../app/utils/scraper';

describe('/api/scrape endpoint', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let jsonSpy: sinon.SinonSpy;
  let statusSpy: sinon.SinonSpy;
  let scrapeTrainStatusStub: sinon.SinonStub;

  beforeEach(() => {
    jsonSpy = sinon.spy();
    statusSpy = sinon.spy(() => ({ json: jsonSpy }));
    
    req = {
      method: 'GET',
      query: {}
    };
    
    res = {
      status: statusSpy,
      json: jsonSpy
    };

    scrapeTrainStatusStub = sinon.stub(scraper, 'scrapeTrainStatus');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 405 for non-GET requests', async () => {
    req.method = 'POST';
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(405)).to.be.true;
    expect(jsonSpy.calledWith({ error: 'Method not allowed' })).to.be.true;
  });

  it('should scrape train data successfully', async () => {
    const mockTrainData = [{
      trainId: '3',
      direction: 'westbound',
      lastUpdated: new Date().toISOString(),
      nextStation: 'Gallup',
      estimatedArrival: new Date().toISOString(),
      status: 'On time',
      delayMinutes: 0,
      departed: false,
      timezone: 'MDT',
      instanceId: 1,
      isNext: true
    }];

    scrapeTrainStatusStub.resolves(mockTrainData);
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('success', true);
    expect(jsonSpy.firstCall.args[0]).to.have.property('data');
  });

  it('should handle scraping errors gracefully', async () => {
    scrapeTrainStatusStub.rejects(new Error('Scraping failed'));
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(500)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('success', false);
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });

  it('should handle train ID parameter', async () => {
    req.query = { trainId: '4' };
    
    const mockTrainData = [{
      trainId: '4',
      direction: 'eastbound',
      lastUpdated: new Date().toISOString(),
      nextStation: 'Galesburg',
      estimatedArrival: new Date().toISOString(),
      status: 'On time',
      delayMinutes: 0,
      departed: false,
      timezone: 'CDT',
      instanceId: 1,
      isNext: true
    }];

    scrapeTrainStatusStub.resolves(mockTrainData);
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(scrapeTrainStatusStub.calledWith(sinon.match.any, '4')).to.be.true;
    expect(statusSpy.calledWith(200)).to.be.true;
  });
});
