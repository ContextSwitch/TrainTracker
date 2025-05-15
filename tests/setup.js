/**
 * Test setup file
 * This file is loaded before running tests to set up the test environment
 */

// Import chai and configure it
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { JSDOM } from 'jsdom';

// Configure chai to use sinon-chai for assertions on spies and stubs
chai.use(sinonChai);

// Set up global variables for testing
global.expect = chai.expect;

// Set up JSDOM for React component testing
const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
});

// Set up global variables for DOM testing
global.window = jsdom.window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;
global.HTMLElement = jsdom.window.HTMLElement;

// Copy properties from window to global
Object.keys(jsdom.window).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = jsdom.window[property];
  }
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Set up environment variables for testing
process.env.NODE_ENV = 'test';

// Suppress console output during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

if (process.env.VERBOSE_TESTS !== 'true') {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
}

// Restore console after tests
after(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
