#!/bin/bash
set -e

# Script to deploy the application with SSL support using load balancer SSL termination
# This script assumes you have AWS CLI configured and CDK installed

# Check if certificate ARN is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <certificate-arn>"
  echo "Example: $0 arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id"
  exit 1
fi

# Set the certificate ARN as an environment variable
export SSL_CERTIFICATE_ARN=$1

echo "Using SSL certificate ARN: $SSL_CERTIFICATE_ARN"

# Navigate to the infrastructure directory
cd infrastructure

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing infrastructure dependencies..."
  npm install
fi

# Deploy the infrastructure with SSL support
echo "Deploying infrastructure with SSL termination at the load balancer..."
npm run cdk deploy -- --all --require-approval never

echo "Deployment completed successfully!"
echo "Your application should now be accessible via both HTTP and HTTPS."
echo "HTTP URL: http://chiefjourney.com"
echo "HTTPS URL: https://chiefjourney.com"
echo ""
echo "Note: SSL is terminated at the load balancer level. The application itself runs HTTP only."
