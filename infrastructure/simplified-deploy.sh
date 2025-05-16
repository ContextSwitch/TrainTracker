#!/bin/bash

# Exit on error
set -e

# Check if we're in the infrastructure directory
if [ ! -f "cdk.json" ]; then
    echo "Error: This script must be run from the infrastructure directory."
    exit 1
fi

# Parse command line arguments
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        *)
            echo "Unknown option: $key"
            echo "Usage: ./simplified-deploy.sh [-y|--yes]"
            exit 1
            ;;
    esac
done

# Build the TypeScript code
echo "Building TypeScript code..."
echo "Cleaning previous build artifacts..."
rm -rf dist
npm run build

# Confirm deployment
if [ "$SKIP_CONFIRM" != true ]; then
    read -p "Are you sure you want to deploy the simplified infrastructure? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

# Deploy the stacks
echo "Deploying simplified infrastructure..."
npx cdk deploy --app "node dist/bin/simplified-app.js" --all

echo "Deployment complete!"
