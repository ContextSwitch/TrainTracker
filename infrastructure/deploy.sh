#!/bin/bash

# Exit on error
set -e

# Check if we're in the infrastructure directory
if [ ! -f "cdk.json" ]; then
    echo "Error: This script must be run from the infrastructure directory."
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="all"
SKIP_CONFIRM=false

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --dev)
            ENVIRONMENT="dev"
            shift
            ;;
        --prod)
            ENVIRONMENT="prod"
            shift
            ;;
        --all)
            ENVIRONMENT="all"
            shift
            ;;
        -y|--yes)
            SKIP_CONFIRM=true
            shift
            ;;
        *)
            echo "Unknown option: $key"
            echo "Usage: ./deploy.sh [--dev|--prod|--all] [-y|--yes]"
            exit 1
            ;;
    esac
done

# Build the TypeScript code
echo "Building TypeScript code..."
npm run build

# Determine which stacks to deploy
if [ "$ENVIRONMENT" == "dev" ]; then
    STACKS="SWChiefTracker-Network SWChiefTracker-Dev-DB SWChiefTracker-Dev-Storage SWChiefTracker-Dev-ECS"
    echo "Deploying development environment stacks..."
elif [ "$ENVIRONMENT" == "prod" ]; then
    STACKS="SWChiefTracker-Network SWChiefTracker-Prod-DB SWChiefTracker-Prod-Storage SWChiefTracker-Prod-ECS"
    echo "Deploying production environment stacks..."
elif [ "$ENVIRONMENT" == "all" ]; then
    STACKS="--all"
    echo "Deploying all stacks..."
fi

# Confirm deployment
if [ "$SKIP_CONFIRM" != true ]; then
    read -p "Are you sure you want to deploy $ENVIRONMENT environment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
fi

# Deploy the stacks
if [ "$STACKS" == "--all" ]; then
    npx cdk deploy --all
else
    npx cdk deploy $STACKS
fi

echo "Deployment complete!"
