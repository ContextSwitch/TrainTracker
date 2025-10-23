// Custom Next.js server to ensure the application listens on the correct port
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Determine if we're in development or production mode
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const app = next({ dev, hostname });
const handle = app.getRequestHandler();

// Get port from environment variable or default to 10000 for production, 3000 for development
const port = process.env.PORT || (dev ? 3000 : 10000);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse the URL
      const parsedUrl = parse(req.url, true);
      
      // Let Next.js handle the request
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
