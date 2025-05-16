# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a healthcheck endpoint
RUN echo 'const http = require("http"); const server = http.createServer((req, res) => { res.writeHead(200); res.end("OK"); }); server.listen(3000);' > healthcheck.js

# Command to run the application
CMD ["npm", "start"]
