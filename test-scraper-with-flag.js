/**
 * Test script for the scraper toggle functionality
 * This script tests both the dixieland and transitdocs scrapers
 */

// Import required modules
const fetch = require('node-fetch');

// Function to test the scraper with a specific type
async function testScraper(scraperType) {
  try {
    console.log(`Testing ${scraperType} scraper...`);
    console.log('='.repeat(50));
    
    // Call the test-scraper-flag API endpoint
    const response = await fetch('http://localhost:3000/api/test-scraper-flag', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-auth': 'true', // Bypass authentication for testing
      },
      body: JSON.stringify({
        scraperType,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`API returned error: ${data.error}`);
    }
    
    // Process the data
    console.log(`\nScraper Type: ${data.scraperType}`);
    
    // Log train #3 data
    console.log('\nTrain #3 Data:');
    if (data.data && data.data.train3 && data.data.train3.length > 0) {
      data.data.train3.forEach((train, index) => {
        console.log(`\nInstance ${index + 1}:`);
        console.log(`Train ID: ${train.trainId}`);
        console.log(`Direction: ${train.direction}`);
        console.log(`Current Location: ${train.currentLocation || 'N/A'}`);
        console.log(`Next Station: ${train.nextStation || 'N/A'}`);
        console.log(`Status: ${train.status || 'N/A'}`);
        console.log(`Delay: ${train.delayMinutes || 0} minutes`);
        console.log(`Last Updated: ${train.lastUpdated}`);
      });
    } else {
      console.log('No data available for train #3');
    }
    
    // Log train #4 data
    console.log('\nTrain #4 Data:');
    if (data.data && data.data.train4 && data.data.train4.length > 0) {
      data.data.train4.forEach((train, index) => {
        console.log(`\nInstance ${index + 1}:`);
        console.log(`Train ID: ${train.trainId}`);
        console.log(`Direction: ${train.direction}`);
        console.log(`Current Location: ${train.currentLocation || 'N/A'}`);
        console.log(`Next Station: ${train.nextStation || 'N/A'}`);
        console.log(`Status: ${train.status || 'N/A'}`);
        console.log(`Delay: ${train.delayMinutes || 0} minutes`);
        console.log(`Last Updated: ${train.lastUpdated}`);
      });
    } else {
      console.log('No data available for train #4');
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing ${scraperType} scraper:`, error);
    return null;
  }
}

// Main function to run the test
async function runTest() {
  console.log('Testing Scraper Toggle Functionality');
  console.log('='.repeat(50));
  
  // Test the dixieland scraper
  await testScraper('dixieland');
  
  console.log('\n');
  console.log('='.repeat(50));
  
  // Test the transitdocs scraper
  await testScraper('transitdocs');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
