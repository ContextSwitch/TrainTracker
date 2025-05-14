import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Path to the config file
const CONFIG_FILE_PATH = path.join(process.cwd(), 'app', 'config', 'index.ts');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // GET: Return the current YouTube URLs
    if (req.method === 'GET') {
      // Read the config file
      const configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      
      // Extract the stations array using regex
      const stationsMatch = configContent.match(/stations:\s*\[([\s\S]*?)\]/);
      
      if (!stationsMatch) {
        return res.status(500).json({ error: 'Could not parse stations from config file' });
      }
      
      // Parse the stations from the config content
      const stationsContent = stationsMatch[1];
      const stationRegex = /{[\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?youtubeLink:\s*['"]([^'"]+)['"][\s\S]*?}/g;
      
      const stations = [];
      let match;
      
      while ((match = stationRegex.exec(stationsContent)) !== null) {
        stations.push({
          name: match[1],
          youtubeLink: match[2]
        });
      }
      
      return res.status(200).json({ stations });
    }
    
    // PUT: Update the YouTube URLs
    if (req.method === 'PUT') {
      const { stations } = req.body;
      
      if (!stations || !Array.isArray(stations)) {
        return res.status(400).json({ error: 'Invalid stations data' });
      }
      
      // Read the config file
      let configContent = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      
      // Update each station's YouTube URL
      stations.forEach(station => {
        const { name, youtubeLink } = station;
        
        // Create a regex to find and replace the YouTube URL for this station
        const stationRegex = new RegExp(`(\\s*{\\s*name:\\s*['"]${name}['"][\\s\\S]*?youtubeLink:\\s*['"])([^'"]+)(['"][\\s\\S]*?})`);
        
        configContent = configContent.replace(stationRegex, `$1${youtubeLink}$3`);
      });
      
      // Write the updated config back to the file
      fs.writeFileSync(CONFIG_FILE_PATH, configContent, 'utf8');
      
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Error handling YouTube URLs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
