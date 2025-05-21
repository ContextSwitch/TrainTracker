// Custom Next.js server to ensure the application listens on the correct port
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Determine if we're in development or production mode
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Get port from environment variable or default to 80 for production, 3000 for development
const port = process.env.PORT || (dev ? 3000 : 80);

app.prepare().then(() => {
  createServer((req, res) => {
    // Parse the URL
    const parsedUrl = parse(req.url, true);
    
    // Let Next.js handle the request
    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
