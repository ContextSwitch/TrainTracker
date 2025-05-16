#!/bin/bash
set -e

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "AWS CDK is not installed. Please install it with: npm install -g aws-cdk"
    exit 1
fi

# Navigate to the infrastructure directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Set environment variables for development
export NODE_ENV=development
export ENVIRONMENT=dev

# Deploy the development stack
echo "Deploying development environment..."
cdk deploy TrainTracker-Dev --app "npx ts-node bin/dev-app.ts" --require-approval never

echo "Development environment deployed successfully!"
echo "To get the development URL, run:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-Dev --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"
