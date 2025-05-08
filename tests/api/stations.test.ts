import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/stations';
import { appConfig } from '../../app/config';
import { mockTrainStatus3, mockTrainStatus4Fort } from '../mocks/mockData';

describe('Stations API Endpoint', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;
  let fsExistsStub: sinon.SinonStub;
  let fsReadFileStub: sinon.SinonStub;
  let jsonSpy: sinon.SinonSpy;
  let statusSpy: sinon.SinonSpy;
  let endSpy: sinon.SinonSpy;
  
  beforeEach(() => {
    // Setup request and response objects
    req = {
      method: 'GET',
      query: {}
    };
    
    jsonSpy = sinon.spy();
    statusSpy = sinon.spy(() => ({ json: jsonSpy, end: endSpy }));
    endSpy = sinon.spy();
    
    res = {
      status: statusSpy,
      json: jsonSpy,
      end: endSpy
    };
    
    // Stub fs.existsSync and fs.readFileSync
    fsExistsStub = sinon.stub(fs, 'existsSync');
    fsReadFileStub = sinon.stub(fs, 'readFileSync');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should return 405 for non-GET requests', () => {
    req.method = 'POST';
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(405)).to.be.true;
    expect(endSpy.calledOnce).to.be.true;
  });
  
  it('should return all stations when no trainId is provided', () => {
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.calledOnce).to.be.true;
    
    const responseData = jsonSpy.firstCall.args[0];
    expect(responseData).to.deep.equal(appConfig.stations);
  });
  
  it('should return 404 when trainId is provided but file does not exist', () => {
    req.query = { trainId: '3' };
    fsExistsStub.returns(false);
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(404)).to.be.true;
    expect(jsonSpy.calledWith([])).to.be.true;
  });
  
  it('should return train status for train #3 when file exists', () => {
    req.query = { trainId: '3' };
    fsExistsStub.returns(true);
    
    const mockData = {
      '3': [mockTrainStatus3],
      '4': [mockTrainStatus4Fort]
    };
    
    fsReadFileStub.returns(JSON.stringify(mockData));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.calledOnce).to.be.true;
    
    const responseData = jsonSpy.firstCall.args[0];
    expect(responseData).to.deep.equal([mockTrainStatus3]);
  });
  
  it('should return 404 when trainId is provided but not found in file', () => {
    req.query = { trainId: '5' }; // Non-existent train ID
    fsExistsStub.returns(true);
    
    const mockData = {
      '3': [mockTrainStatus3],
      '4': [mockTrainStatus4Fort]
    };
    
    fsReadFileStub.returns(JSON.stringify(mockData));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(404)).to.be.true;
    expect(jsonSpy.calledWith([])).to.be.true;
  });
  
  it('should return 500 when file read fails', () => {
    req.query = { trainId: '3' };
    fsExistsStub.returns(true);
    fsReadFileStub.throws(new Error('File read error'));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(500)).to.be.true;
    expect(jsonSpy.calledWith([])).to.be.true;
  });
});
