#!/bin/bash

# Exit on error
set -e

echo "Redeploying application with HTTP fix..."

# Step 1: Build and push the production Docker image
echo "Step 1: Building and pushing production Docker image..."
./push-production-image.sh

echo "Deployment completed successfully!"
echo "You can access the application using the URL from CloudFormation outputs:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-App --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"
echo ""
echo "IMPORTANT: Make sure to use HTTP instead of HTTPS when accessing the application."
