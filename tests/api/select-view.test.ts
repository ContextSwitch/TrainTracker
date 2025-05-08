import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/select-view';
import * as config from '../../app/config';
import { mockCurrentStatus, mockStations } from '../mocks/mockData';

describe('Select View API Endpoint', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let fsExistsStub: sinon.SinonStub;
  let fsReadFileStub: sinon.SinonStub;
  let fsWriteFileStub: sinon.SinonStub;
  let getStationByNameStub: sinon.SinonStub;
  let getYoutubeEmbedUrlStub: sinon.SinonStub;
  let jsonSpy: sinon.SinonSpy;
  let statusSpy: sinon.SinonSpy;
  let endSpy: sinon.SinonSpy;
  
  beforeEach(() => {
    // Setup request and response objects
    req = {
      method: 'POST',
      body: {
        trainId: '3',
        stationName: 'Gallup'
      }
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
    fsReadFileStub = sinon.stub(fs, 'readFileSync');
    fsWriteFileStub = sinon.stub(fs, 'writeFileSync');
    
    // Stub config functions
    getStationByNameStub = sinon.stub(config, 'getStationByName');
    getYoutubeEmbedUrlStub = sinon.stub(config, 'getYoutubeEmbedUrl');
    
    // Default stubs
    getStationByNameStub.returns(mockStations[0]); // Gallup
    getYoutubeEmbedUrlStub.returns('https://www.youtube.com/embed/hbmeqWdDLjk?autoplay=1');
    fsExistsStub.returns(true);
    fsReadFileStub.returns(JSON.stringify(mockCurrentStatus));
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should return 405 for non-POST requests', () => {
    req.method = 'GET';
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(405)).to.be.true;
    expect(endSpy.calledOnce).to.be.true;
  });
  
  it('should return 400 when trainId is missing', () => {
    req.body = { stationName: 'Gallup' };
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(400)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });
  
  it('should return 400 when stationName is missing', () => {
    req.body = { trainId: '3' };
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(400)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });
  
  it('should return 404 when station is not found', () => {
    getStationByNameStub.returns(undefined);
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(404)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });
  
  it('should return 400 when trainId is invalid', () => {
    req.body = { trainId: '5', stationName: 'Gallup' };
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(400)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });
  
  it('should update train3 approaching status when trainId is 3', () => {
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(fsWriteFileStub.calledOnce).to.be.true;
    
    // Parse the written data
    const writtenData = JSON.parse(fsWriteFileStub.firstCall.args[1]);
    
    expect(writtenData.train3.approaching).to.be.true;
    expect(writtenData.train3.station).to.deep.equal(mockStations[0]);
    expect(writtenData.train3.youtubeLink).to.equal('https://www.youtube.com/embed/hbmeqWdDLjk?autoplay=1');
  });
  
  it('should update train4 approaching status when trainId is 4', () => {
    req.body = { trainId: '4', stationName: 'Las Vegas' };
    getStationByNameStub.returns(mockStations[1]); // Las Vegas
    getYoutubeEmbedUrlStub.returns('https://www.youtube.com/embed/BgmZJ-NUqiY?autoplay=1');
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(fsWriteFileStub.calledOnce).to.be.true;
    
    // Parse the written data
    const writtenData = JSON.parse(fsWriteFileStub.firstCall.args[1]);
    
    expect(writtenData.train4.approaching).to.be.true;
    expect(writtenData.train4.station).to.deep.equal(mockStations[1]);
    expect(writtenData.train4.youtubeLink).to.equal('https://www.youtube.com/embed/BgmZJ-NUqiY?autoplay=1');
  });
  
  it('should deselect train4 when selecting train3 for the same station', () => {
    // First, set up a current status where train4 is approaching Gallup
    const modifiedStatus = {
      ...mockCurrentStatus,
      train4: {
        approaching: true,
        station: mockStations[0], // Gallup
        eta: new Date().toISOString(),
        minutesAway: 10,
        youtubeLink: 'https://www.youtube.com/embed/hbmeqWdDLjk?autoplay=1'
      }
    };
    
    fsReadFileStub.returns(JSON.stringify(modifiedStatus));
    
    // Now select train3 for Gallup
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(fsWriteFileStub.calledOnce).to.be.true;
    
    // Parse the written data
    const writtenData = JSON.parse(fsWriteFileStub.firstCall.args[1]);
    
    expect(writtenData.train3.approaching).to.be.true;
    expect(writtenData.train3.station).to.deep.equal(mockStations[0]);
    expect(writtenData.train4.approaching).to.be.false;
  });
  
  it('should create default status when file does not exist', () => {
    fsExistsStub.returns(false);
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(fsWriteFileStub.calledOnce).to.be.true;
    
    // Parse the written data
    const writtenData = JSON.parse(fsWriteFileStub.firstCall.args[1]);
    
    expect(writtenData.train3.approaching).to.be.true;
    expect(writtenData.train3.station).to.deep.equal(mockStations[0]);
    expect(writtenData.train4.approaching).to.be.false;
  });
  
  it('should return 500 when file write fails', () => {
    fsWriteFileStub.throws(new Error('File write error'));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(500)).to.be.true;
    expect(jsonSpy.firstCall.args[0]).to.have.property('error');
  });
});
