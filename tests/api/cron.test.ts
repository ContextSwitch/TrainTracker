import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/cron';
import * as scraper from '../../app/utils/scraper';
import * as transitdocsScraper from '../../app/utils/transitdocs-scraper';
import * as dixielandScraper from '../../app/utils/dixieland-scraper';
import { appConfig } from '../../app/config';
import { mockTrainStatus3, mockTrainStatus4Fort, mockTrainStatus4Las } from '../mocks/mockData';

describe('Cron API Endpoint', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let fsExistsStub: sinon.SinonStub;
  let fsMkdirStub: sinon.SinonStub;
  let fsWriteFileStub: sinon.SinonStub;
  let scrapeTrainStatusStub: sinon.SinonStub;
  let mockTrainStatusStub: sinon.SinonStub;
  let scrapeTransitDocsTrainStatusStub: sinon.SinonStub;
  let scrapeDixielandTrainStatusStub: sinon.SinonStub;
  let jsonSpy: sinon.SinonSpy;
  let statusSpy: sinon.SinonSpy;
  let endSpy: sinon.SinonSpy;
  let clock: sinon.SinonFakeTimers;
  
  beforeEach(() => {
    // Fix the date to a known value for consistent testing
    clock = sinon.useFakeTimers(new Date('2025-04-25T12:00:00Z'));
    
    // Setup request and response objects
    req = {
      method: 'GET'
    };
    
    jsonSpy = sinon.spy();
    statusSpy = sinon.spy(() => ({ json: jsonSpy, end: endSpy }));
    endSpy = sinon.spy();
    
    res = {
      status: statusSpy,
      json: jsonSpy,
      end: endSpy
    };
    
    // Stub fs functions
    fsExistsStub = sinon.stub(fs, 'existsSync');
    fsMkdirStub = sinon.stub(fs, 'mkdirSync');
    fsWriteFileStub = sinon.stub(fs, 'writeFileSync');
    
    // Stub scraper functions
    scrapeTrainStatusStub = sinon.stub(scraper, 'scrapeTrainStatus');
    mockTrainStatusStub = sinon.stub(scraper, 'mockTrainStatus');
    scrapeTransitDocsTrainStatusStub = sinon.stub(transitdocsScraper, 'scrapeTransitDocsTrainStatus');
    scrapeDixielandTrainStatusStub = sinon.stub(dixielandScraper, 'scrapeDixielandTrainStatus');
    
    // Default stubs
    fsExistsStub.returns(true);
    scrapeTrainStatusStub.withArgs(sinon.match.string, '3').resolves([mockTrainStatus3]);
    scrapeTrainStatusStub.withArgs(sinon.match.string, '4').resolves([mockTrainStatus4Fort, mockTrainStatus4Las]);
    mockTrainStatusStub.withArgs('3').returns([mockTrainStatus3]);
    mockTrainStatusStub.withArgs('4').returns([mockTrainStatus4Fort, mockTrainStatus4Las]);
  });
  
  afterEach(() => {
    clock.restore();
    sinon.restore();
  });
  
  it('should return 405 for non-GET requests', () => {
    req.method = 'POST';
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(405)).to.be.true;
    expect(endSpy.calledOnce).to.be.true;
  });
  
  it('should skip update if last run was less than 5 minutes ago', async () => {
    // Set lastRun to 2 minutes ago
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Reset spies
    jsonSpy.resetHistory();
    statusSpy.resetHistory();
    
    // Advance time by 2 minutes
    clock.tick(2 * 60 * 1000);
    
    // Run again
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.true;
    expect(jsonSpy.firstCall.args[0].message).to.include('Skipped update');
  });
  
  it('should scrape train data and save it', async () => {
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(scrapeTrainStatusStub.calledTwice).to.be.true;
    expect(fsWriteFileStub.called).to.be.true;
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.true;
    expect(jsonSpy.firstCall.args[0].message).to.include('Successfully updated');
  });
  
  it('should fall back to mock data when scraping fails', async () => {
    scrapeTrainStatusStub.withArgs(sinon.match.string, '3').rejects(new Error('Scrape error'));
    scrapeTrainStatusStub.withArgs(sinon.match.string, '4').rejects(new Error('Scrape error'));
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(mockTrainStatusStub.calledTwice).to.be.true;
    expect(fsWriteFileStub.called).to.be.true;
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.true;
  });
  
  it('should create data directory if it does not exist', async () => {
    fsExistsStub.returns(false);
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(fsMkdirStub.called).to.be.true;
    expect(fsWriteFileStub.called).to.be.true;
    expect(statusSpy.calledWith(200)).to.be.true;
  });
  
  it('should return error when an exception occurs', async () => {
    fsWriteFileStub.throws(new Error('File write error'));
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(500)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.false;
    expect(jsonSpy.firstCall.args[0].message).to.include('Error');
  });
  
  it('should use the dixieland scraper when configured', async () => {
    // Set the scraper type to dixieland
    appConfig.scraperType = 'dixieland';
    
    // Configure the stubs
    scrapeTrainStatusStub.callThrough(); // Use the real implementation
    scrapeDixielandTrainStatusStub.withArgs('3').resolves(mockTrainStatus3);
    scrapeDixielandTrainStatusStub.withArgs('4').resolves(mockTrainStatus4Fort);
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(scrapeDixielandTrainStatusStub.calledTwice).to.be.true;
    expect(scrapeTransitDocsTrainStatusStub.called).to.be.false;
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.true;
  });
  
  it('should use the transitdocs scraper when configured', async () => {
    // Set the scraper type to transitdocs
    appConfig.scraperType = 'transitdocs';
    
    // Configure the stubs
    scrapeTrainStatusStub.callThrough(); // Use the real implementation
    scrapeTransitDocsTrainStatusStub.withArgs('3').resolves([mockTrainStatus3]);
    scrapeTransitDocsTrainStatusStub.withArgs('4').resolves([mockTrainStatus4Fort, mockTrainStatus4Las]);
    
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(scrapeTransitDocsTrainStatusStub.calledTwice).to.be.true;
    expect(scrapeDixielandTrainStatusStub.called).to.be.false;
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.firstCall.args[0].success).to.be.true;
  });
  
  it('should update current status based on train statuses', async () => {
    await handler(req as NextApiRequest, res as NextApiResponse);
    
    // Check that the current status file was written
    const writeFileCalls = fsWriteFileStub.getCalls();
    const currentStatusCall = writeFileCalls.find(call => 
      call.args[0].includes('current_status.json')
    );
    
    expect(currentStatusCall).to.not.be.undefined;
    
    if (currentStatusCall) {
      // Parse the written data
      const writtenData = JSON.parse(currentStatusCall.args[1]);
      
      expect(writtenData).to.have.property('train3');
      expect(writtenData).to.have.property('train4');
      expect(writtenData).to.have.property('lastUpdated');
    }
  });
});
