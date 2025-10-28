/**
 * Test setup file
 * This file is loaded before running tests to set up the test environment
 */

// Import chai and configure it
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import { JSDOM } from 'jsdom';
import React from 'react';

// Configure chai to use sinon-chai for assertions on spies and stubs
chai.use(sinonChai);

// Set up global variables for testing
global.expect = chai.expect;
global.React = React;

// Set up JSDOM for React component testing
const jsdom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Set up global variables for DOM testing
global.window = jsdom.window;
global.document = jsdom.window.document;
global.navigator = jsdom.window.navigator;
global.HTMLElement = jsdom.window.HTMLElement;
global.HTMLAnchorElement = jsdom.window.HTMLAnchorElement;
global.HTMLButtonElement = jsdom.window.HTMLButtonElement;
global.HTMLInputElement = jsdom.window.HTMLInputElement;
global.HTMLSelectElement = jsdom.window.HTMLSelectElement;
global.HTMLTextAreaElement = jsdom.window.HTMLTextAreaElement;
global.Event = jsdom.window.Event;
global.MouseEvent = jsdom.window.MouseEvent;
global.KeyboardEvent = jsdom.window.KeyboardEvent;

// Copy properties from window to global
Object.keys(jsdom.window).forEach(property => {
  if (typeof global[property] === 'undefined') {
    global[property] = jsdom.window[property];
  }
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = callback => setTimeout(callback, 0);
global.cancelAnimationFrame = id => clearTimeout(id);

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia
global.matchMedia = global.matchMedia || function (query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () {},
  };
};

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
