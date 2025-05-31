import * as chai from 'chai';
import * as sinon from 'sinon';
import { JSDOM } from 'jsdom';
import * as path from 'path';
import * as fs from 'fs';

const { expect } = chai;

/**
 * Sets up a fake DOM environment for testing
 */
export function setupDOM(): JSDOM {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });
  
  // Set up global variables that would be available in a browser environment
  // Use type assertions to avoid type errors
  global.window = dom.window as unknown as (Window & typeof globalThis);
  global.document = dom.window.document;
  global.navigator = dom.window.navigator as Navigator;
  
  return dom;
}

/**
 * Loads a sample HTML file for testing
 * @param filename The name of the file to load
 * @returns The HTML content as a string
 */
export function loadSampleHTML(filename: string): string {
  const filePath = path.join(process.cwd(), filename);
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Creates a fake clock for testing time-dependent functions
 * @param date The date to set the clock to
 * @returns The sinon fake clock
 */
export function createFakeClock(date: Date = new Date()): sinon.SinonFakeTimers {
  return sinon.useFakeTimers(date);
}

/**
 * Asserts that two objects have the same structure and values
 * @param actual The actual object
 * @param expected The expected object
 * @param message Optional message to display on failure
 */
export function assertObjectsEqual(actual: any, expected: any, message?: string): void {
  expect(actual).to.deep.equal(expected, message);
}

/**
 * Creates a mock response object for testing API handlers
 * @returns A mock response object with spy methods
 */
export function createMockResponse() {
  const res: any = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.send = sinon.stub().returns(res);
  res.end = sinon.stub().returns(res);
  return res;
}

/**
 * Creates a mock request object for testing API handlers
 * @param method The HTTP method
 * @param body The request body
 * @param query The query parameters
 * @returns A mock request object
 */
export function createMockRequest(method = 'GET', body = {}, query = {}) {
  return {
    method,
    body,
    query
  };
}
