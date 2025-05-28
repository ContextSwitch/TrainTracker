/**
 * Test script for the TransitDocs API
 * This script fetches train data from the TransitDocs API and logs the results
 */

// Import required modules
import fetch from 'node-fetch';

// Get the current date in YYYY/MM/DD format
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const dateStr = `${year}/${month}/${day}`;

// Function to fetch train data from the TransitDocs API
async function fetchTrainData(trainNumber) {
  try {
    console.log(`Fetching data for train #${trainNumber}...`);
    
    // Construct the API URL
    const url = `https://asm-backend.transitdocs.com/train/${dateStr}/AMTRAK/${trainNumber}?points=true`;
    
    console.log(`URL: ${url}`);
    
    // Fetch the data from the API
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`TransitDocs API returned status ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the data
    console.log(`\nTrain #${trainNumber} Data:`);
    console.log('='.repeat(50));
    
    // Log basic train info
    console.log(`Train ID: ${data.train_id || 'N/A'}`);
    console.log(`Status: ${data.status || 'N/A'}`);
    console.log(`Delay: ${data.delay_minutes || 0} minutes`);
    
    // Log points data (train location)
    if (data.points && data.points.length > 0) {
      console.log('\nCurrent Location:');
      console.log(`Latitude: ${data.points[0].lat}`);
      console.log(`Longitude: ${data.points[0].lon}`);
    } else {
      console.log('\nNo location data available');
    }
    
    // Log stations data
    if (data.stations && data.stations.length > 0) {
      console.log('\nStations:');
      
      // Find the current station (last station departed from)
      const now = Math.floor(Date.now() / 1000); // Current time in seconds
      let currentStation = null;
      
      for (let i = data.stations.length - 1; i >= 0; i--) {
        const station = data.stations[i];
        if (station.dep_timestamp && station.dep_timestamp < now) {
          currentStation = station;
          break;
        }
      }
      
      // Find the next station (next station to arrive at)
      let nextStation = null;
      
      for (let i = 0; i < data.stations.length; i++) {
        const station = data.stations[i];
        if (station.arr_timestamp && station.arr_timestamp > now) {
          nextStation = station;
          break;
        }
      }
      
      // Log current and next station info
      if (currentStation) {
        console.log('\nCurrent Station:');
        console.log(`Name: ${currentStation.name}`);
        console.log(`Departed: ${new Date(currentStation.dep_timestamp * 1000).toLocaleString()}`);
      } else {
        console.log('\nNo current station data available');
      }
      
      if (nextStation) {
        console.log('\nNext Station:');
        console.log(`Name: ${nextStation.name}`);
        console.log(`Estimated Arrival: ${new Date(nextStation.arr_timestamp * 1000).toLocaleString()}`);
      } else {
        console.log('\nNo next station data available');
      }
      
      // Log all stations
      console.log('\nAll Stations:');
      data.stations.forEach((station, index) => {
        console.log(`${index + 1}. ${station.name}`);
        if (station.arr_timestamp) {
          console.log(`   Arrival: ${new Date(station.arr_timestamp * 1000).toLocaleString()}`);
        }
        if (station.dep_timestamp) {
          console.log(`   Departure: ${new Date(station.dep_timestamp * 1000).toLocaleString()}`);
        }
        console.log('   -----------------');
      });
    } else {
      console.log('\nNo stations data available');
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching data for train #${trainNumber}:`, error);
    return null;
  }
}

// Main function to run the test
async function runTest() {
  console.log('Testing TransitDocs API...');
  console.log('='.repeat(50));
  
  // Fetch data for train #3 (Southwest Chief - Westbound)
  await fetchTrainData('3');
  
  console.log('\n');
  console.log('='.repeat(50));
  
  // Fetch data for train #4 (Southwest Chief - Eastbound)
  await fetchTrainData('4');
}

// Run the test
runTest().catch(error => {
  console.error('Test failed:', error);
});
