#!/bin/bash

# Exit on error
set -e

echo "Redeploying infrastructure and updating to use application image..."

# Step 1: Redeploy the infrastructure with our changes
echo "Step 1: Redeploying infrastructure..."
cd infrastructure
./deploy.sh
cd ..

# Step 2: Build and push the production Docker image
echo "Step 2: Building and pushing production Docker image..."
./push-production-image.sh

echo "Deployment completed successfully!"
echo "You can access the application using the URL from CloudFormation outputs:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-App --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"
