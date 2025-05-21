#!/bin/bash
set -e

echo "Deploying TrainTracker infrastructure..."

# Navigate to the infrastructure directory
cd "$(dirname "$0")"

# Install dependencies
echo "Installing dependencies..."
npm install

# Bootstrap CDK (only needed once per AWS account/region)
echo "Bootstrapping CDK..."
npx cdk bootstrap

# Deploy stacks
echo "Deploying network stack..."
npx cdk deploy TrainTracker-Network --require-approval never

echo "Deploying storage stack..."
npx cdk deploy TrainTracker-Storage --require-approval never

echo "Deploying ECS stack..."
npx cdk deploy TrainTracker-App --require-approval never

echo "Infrastructure deployment completed successfully!"
echo "You can now build and push the Docker image using the push-image.sh script."
