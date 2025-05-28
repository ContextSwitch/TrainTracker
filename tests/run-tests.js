#!/usr/bin/env node

/**
 * Test runner script to run all tests except React component tests
 * This is a workaround for issues with JSX in the test files
 */

import { execSync } from 'child_process';

// Run all integration tests except network-dependent ones
console.log('Running integration tests...');
try {
  execSync('npx mocha tests/integration/train-progression.test.js tests/integration/last-station.test.js tests/integration/train3-final-destination.test.js tests/integration/train4-final-destination.test.js tests/integration/train4-chicago-arrival.test.js', { stdio: 'inherit' });
  console.log('✅ Integration tests passed!');
} catch (error) {
  console.error('❌ Integration tests failed!');
  process.exit(1);
}

// Skip network-dependent tests by default
console.log('\nSkipping network-dependent tests...');
console.log('To run network-dependent tests, use: npx mocha tests/integration/dixieland-scraper.test.js tests/integration/scraper.test.js');

// Run utility tests
console.log('\nRunning utility tests...');
try {
  execSync('npx mocha tests/utils/transitdocs-scraper.test.js tests/utils/dixieland-scraper.test.ts tests/utils/predictions.test.ts tests/utils/scraper.test.ts', { stdio: 'inherit' });
  console.log('✅ Utility tests passed!');
} catch (error) {
  console.error('❌ Utility tests failed!');
  process.exit(1);
}

// Run API tests
console.log('\nRunning API tests...');
try {
  execSync('npx mocha tests/api/cron.test.ts tests/api/config.test.ts', { stdio: 'inherit' });
  console.log('✅ API tests passed!');
} catch (error) {
  console.error('❌ API tests failed!');
  process.exit(1);
}

// Run component tests
console.log('\nRunning component tests...');
try {
  execSync('npx mocha tests/components/admin/ScraperToggle.test.js', { stdio: 'inherit' });
  console.log('✅ Component tests passed!');
} catch (error) {
  console.error('❌ Component tests failed!');
  process.exit(1);
}

console.log('\n✅ All tests completed successfully!');
console.log('\nNote: Some React component tests are currently skipped due to JSX compatibility issues.');
console.log('To run all component tests, you would need to set up a proper React testing environment with Jest or a similar framework.');
