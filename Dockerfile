# Use Node.js 18 as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install curl for health checks and other utilities
RUN apk --no-cache add curl

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build --legacy-peer-deps

# Expose the port the app runs on
EXPOSE 80

# Set environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV JWT_SECRET=traintracker-admin-secret
ENV ADMIN_PASSWORD=WhereDidTheSunGo

# Create a healthcheck endpoint
RUN echo 'const http = require("http"); const server = http.createServer((req, res) => { res.writeHead(200); res.end("OK"); }); server.listen(80);' > healthcheck.js

# Command to run the application
CMD ["npm", "start"]
