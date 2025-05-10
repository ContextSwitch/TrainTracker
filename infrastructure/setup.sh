#!/bin/bash

# Exit on error
set -e

echo "Setting up TrainTracker infrastructure..."

# Install dependencies
npm install

# Install AWS CDK CLI globally if not already installed
if ! command -v cdk &> /dev/null; then
    echo "Installing AWS CDK CLI..."
    npm install -g aws-cdk
fi

# Bootstrap AWS environment if needed
echo "Bootstrapping AWS environment..."
cdk bootstrap

echo "Setup complete! You can now deploy the infrastructure with 'npm run deploy'"
