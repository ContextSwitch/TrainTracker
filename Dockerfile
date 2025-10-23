# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks and other utilities
RUN apk --no-cache add curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm ci --legacy-peer-deps --verbose

# Copy the rest of the application
COPY . .

# Build the application with verbose logging
RUN npm run build --verbose

# Expose the port the app runs on
EXPOSE 10000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10000
ENV JWT_SECRET=traintracker-admin-secret
ENV ADMIN_PASSWORD=WhereDidTheSunGo

# Create a healthcheck endpoint
RUN echo 'const http = require("http"); const server = http.createServer((req, res) => { res.writeHead(200); res.end("OK"); }); server.listen(10000);' > healthcheck.js

# Command to run the application
CMD ["npm", "start"]
