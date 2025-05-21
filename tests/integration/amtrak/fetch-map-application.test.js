import axios from 'axios';
import fs from 'fs';

import { describe, it } from 'mocha';

/**
 * Test script to fetch and analyze the mapApplication.js file
 * This script will help us understand how to fetch train data from Amtrak's website
 */
describe('Amtrak Map Application API Tests', function() {
  // These tests are skipped by default as they make real API calls
  it.skip('should fetch and analyze mapApplication.js', async function() {
    this.timeout(30000); // Increase timeout for API calls
    await fetchMapApplication();
  });
});

async function fetchMapApplication() {
  try {
    console.log('Fetching and analyzing mapApplication.js...');
    
    // Fetch the mapApplication.js file
    const mapAppUrl = 'https://maps.amtrak.com/rttl/js/mapApplication.js';
    const response = await axios.get(mapAppUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.amtrak.com/track-your-train.html'
      }
    });
    
    console.log('mapApplication.js response status:', response.status);
    
    // Save the file for analysis
    fs.writeFileSync('mapApplication.js', response.data);
    console.log('Saved mapApplication.js');
    
    // Look for API endpoints or URLs in the JavaScript
    const apiUrlPattern = /(https?:\/\/[^"'\s]+)|(\/api\/[^"'\s]+)/g;
    const matches = response.data.match(apiUrlPattern) || [];
    
    console.log(`Found ${matches.length} potential API URLs in mapApplication.js:`);
    matches.forEach(url => console.log(`  ${url}`));
    
    // Look for AJAX calls
    const ajaxPattern = /\$.ajax\(\s*{\s*url\s*:\s*["']([^"']+)["']/g;
    const ajaxCalls = [];
    let match;
    
    while ((match = ajaxPattern.exec(response.data)) !== null) {
      ajaxCalls.push(match[1]);
    }
    
    console.log(`Found ${ajaxCalls.length} AJAX calls in mapApplication.js:`);
    ajaxCalls.forEach(url => console.log(`  ${url}`));
    
    // Look for $.get calls
    const getPattern = /\$.get\(\s*["']([^"']+)["']/g;
    const getCalls = [];
    let getMatch;
    
    while ((getMatch = getPattern.exec(response.data)) !== null) {
      getCalls.push(getMatch[1]);
    }
    
    console.log(`Found ${getCalls.length} $.get calls in mapApplication.js:`);
    getCalls.forEach(url => console.log(`  ${url}`));
    
    // Look for variables that might contain API endpoints
    const varPattern = /var\s+([a-zA-Z0-9_$]+)\s*=\s*["']https?:\/\/[^"']+["']/g;
    const varMatches = [];
    let varMatch;
    
    while ((varMatch = varPattern.exec(response.data)) !== null) {
      varMatches.push(varMatch[1]);
    }
    
    console.log(`Found ${varMatches.length} variables containing URLs in mapApplication.js:`);
    varMatches.forEach(varName => console.log(`  ${varName}`));
    
    // Look for functions that might fetch train data
    const funcPattern = /function\s+([a-zA-Z0-9_$]+)\s*\([^)]*\)\s*{[^}]*\$.ajax/g;
    const funcMatches = [];
    let funcMatch;
    
    while ((funcMatch = funcPattern.exec(response.data)) !== null) {
      funcMatches.push(funcMatch[1]);
    }
    
    console.log(`Found ${funcMatches.length} functions that might fetch train data in mapApplication.js:`);
    funcMatches.forEach(funcName => console.log(`  ${funcName}`));
    
    // Now let's try to fetch data from the API endpoints we found in _$$_666.js
    console.log('\nTrying to fetch train data from API endpoints...');
    
    // Try to fetch all trains data
    const allTrainsUrl = 'https://maps.amtrak.com/services/MapDataService/trains/getTrainsData';
    
    try {
      const allTrainsResponse = await axios.get(allTrainsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.amtrak.com/services/maps.trainlocation.html'
        }
      });
      
      console.log('All trains response status:', allTrainsResponse.status);
      console.log('All trains response type:', typeof allTrainsResponse.data);
      
      if (typeof allTrainsResponse.data === 'object') {
        //console.log('All trains response sample:', JSON.stringify(allTrainsResponse.data).substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync('all-trains-data.json', JSON.stringify(allTrainsResponse.data, null, 2));
        console.log('Saved all-trains-data.json');
        
        // Look for Southwest Chief trains (train numbers 3 and 4)
        if (allTrainsResponse.data.features) {
          const swChiefTrains = allTrainsResponse.data.features.filter(train => 
            train.properties && (train.properties.TrainNum === '3' || train.properties.TrainNum === '4')
          );
          
          console.log(`Found ${swChiefTrains.length} Southwest Chief trains:`);
          swChiefTrains.forEach(train => {
            console.log(`  Train #${train.properties.TrainNum} (${train.properties.RouteName || 'Unknown'})`);
            console.log(`    Current location: ${train.properties.EventCode || 'Unknown'}`);
            console.log(`    Status: ${train.properties.StatusMsg || 'Unknown'}`);
            console.log(`    Next station: ${train.properties.NextStnName || 'Unknown'}`);
            console.log(`    ETA: ${train.properties.ETA || 'Unknown'}`);
            console.log(`    Delay: ${train.properties.Delay || 'Unknown'}`);
          });
          
          // Save the Southwest Chief trains data for further analysis
          fs.writeFileSync('sw-chief-trains.json', JSON.stringify(swChiefTrains, null, 2));
          console.log('Saved sw-chief-trains.json');
        }
      } else if (typeof allTrainsResponse.data === 'string') {
        console.log('All trains response sample:', allTrainsResponse.data.substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync('all-trains-data.txt', allTrainsResponse.data);
        console.log('Saved all-trains-data.txt');
      } else {
        console.log('All trains response is not in expected format');
      }
    } catch (error) {
      console.error('Error fetching all trains data:', error.message);
    }
    
    // Try to fetch train stations data
    const stationsUrl = 'https://maps.amtrak.com/services/MapDataService/stations/trainStations';
    
    try {
      const stationsResponse = await axios.get(stationsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.amtrak.com/services/maps.trainlocation.html'
        }
      });
      
      console.log('Stations response status:', stationsResponse.status);
      console.log('Stations response type:', typeof stationsResponse.data);
      
      if (typeof stationsResponse.data === 'object') {
        console.log('Stations response sample:', JSON.stringify(stationsResponse.data).substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync('stations-data.json', JSON.stringify(stationsResponse.data, null, 2));
        console.log('Saved stations-data.json');
        
        // Look for Southwest Chief stations
        if (stationsResponse.data.features) {
          // Filter stations that are on the Southwest Chief route
          // This is a simplification - we'd need to know which stations are on the Southwest Chief route
          const swChiefStations = stationsResponse.data.features.filter(station => 
            station.properties && station.properties.StnName && (
              station.properties.StnName.includes('Chicago') ||
              station.properties.StnName.includes('Kansas City') ||
              station.properties.StnName.includes('Albuquerque') ||
              station.properties.StnName.includes('Flagstaff') ||
              station.properties.StnName.includes('Los Angeles')
            )
          );
          
          console.log(`Found ${swChiefStations.length} potential Southwest Chief stations:`);
          swChiefStations.forEach(station => {
            console.log(`  ${station.properties.StnName} (${station.properties.StnCode})`);
          });
          
          // Save the Southwest Chief stations data for further analysis
          fs.writeFileSync('sw-chief-stations.json', JSON.stringify(swChiefStations, null, 2));
          console.log('Saved sw-chief-stations.json');
        }
      } else if (typeof stationsResponse.data === 'string') {
        console.log('Stations response sample:', stationsResponse.data.substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync('stations-data.txt', stationsResponse.data);
        console.log('Saved stations-data.txt');
      } else {
        console.log('Stations response is not in expected format');
      }
    } catch (error) {
      console.error('Error fetching stations data:', error.message);
    }
    
    // Try to fetch a specific train
    const trainId = '3'; // Southwest Chief westbound
    const specificTrainUrl = `https://maps.amtrak.com/services/MapDataService/trains/train/${trainId}`;
    
    try {
      const specificTrainResponse = await axios.get(specificTrainUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.amtrak.com/services/maps.trainlocation.html'
        }
      });
      
      console.log(`Train #${trainId} response status:`, specificTrainResponse.status);
      console.log(`Train #${trainId} response type:`, typeof specificTrainResponse.data);
      
      if (typeof specificTrainResponse.data === 'object') {
        console.log(`Train #${trainId} response sample:`, JSON.stringify(specificTrainResponse.data).substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync(`train-${trainId}-data.json`, JSON.stringify(specificTrainResponse.data, null, 2));
        console.log(`Saved train-${trainId}-data.json`);
      } else if (typeof specificTrainResponse.data === 'string') {
        console.log(`Train #${trainId} response sample:`, specificTrainResponse.data.substring(0, 500) + '...');
        
        // Save the response for further analysis
        fs.writeFileSync(`train-${trainId}-data.txt`, specificTrainResponse.data);
        console.log(`Saved train-${trainId}-data.txt`);
      } else {
        console.log(`Train #${trainId} response is not in expected format`);
      }
    } catch (error) {
      console.error(`Error fetching train #${trainId} data:`, error.message);
    }
    
    console.log('\nAnalysis completed!');
  } catch (error) {
    console.error('Error in fetchMapApplication:', error);
  }
}
