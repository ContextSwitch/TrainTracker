import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../pages/api/status';
import { mockCurrentStatus } from '../mocks/mockData';

describe('Status API Endpoint', () => {
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
  
  it('should return default status when file does not exist', () => {
    fsExistsStub.returns(false);
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.calledOnce).to.be.true;
    
    const responseData = jsonSpy.firstCall.args[0];
    expect(responseData.train3).to.deep.equal({ approaching: false });
    expect(responseData.train4).to.deep.equal({ approaching: false });
    expect(responseData.lastUpdated).to.be.a('string');
  });
  
  it('should return status from file when it exists', () => {
    fsExistsStub.returns(true);
    fsReadFileStub.returns(JSON.stringify(mockCurrentStatus));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.calledOnce).to.be.true;
    
    const responseData = jsonSpy.firstCall.args[0];
    expect(responseData).to.deep.equal(mockCurrentStatus);
  });
  
  it('should return default status when file read fails', () => {
    fsExistsStub.returns(true);
    fsReadFileStub.throws(new Error('File read error'));
    
    handler(req as NextApiRequest, res as NextApiResponse);
    
    expect(statusSpy.calledWith(200)).to.be.true;
    expect(jsonSpy.calledOnce).to.be.true;
    
    const responseData = jsonSpy.firstCall.args[0];
    expect(responseData.train3).to.deep.equal({ approaching: false });
    expect(responseData.train4).to.deep.equal({ approaching: false });
    expect(responseData.lastUpdated).to.be.a('string');
  });
});
