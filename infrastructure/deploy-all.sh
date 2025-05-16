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

# Function to display a header
function header() {
    echo ""
    echo "====================================================="
    echo "  $1"
    echo "====================================================="
    echo ""
}

# Ask for confirmation
read -p "This will deploy both production and development environments. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

# Deploy production environment
header "Deploying Production Environment"
./simplified-deploy.sh

# Deploy development environment
header "Deploying Development Environment"
./deploy-dev.sh

header "Deployment Complete"
echo "Production URL:"
aws cloudformation describe-stacks --stack-name TrainTracker-App --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text

echo ""
echo "Development URL:"
aws cloudformation describe-stacks --stack-name TrainTracker-Dev --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text

echo ""
echo "To push Docker images:"
echo "  Production: ./push-image.sh"
echo "  Development: ./push-image-dev.sh"
