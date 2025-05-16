#!/bin/bash
set -e

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "AWS CDK is not installed. Please install it with: npm install -g aws-cdk"
    exit 1
fi

# Navigate to the infrastructure directory
cd "$(dirname "$0")"

# Function to display a header
function header() {
    echo ""
    echo "====================================================="
    echo "  $1"
    echo "====================================================="
    echo ""
}

# Ask for confirmation
read -p "This will destroy ALL TrainTracker stacks. This action cannot be undone. Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Ask which environment to clean up
echo ""
echo "Which environment would you like to clean up?"
echo "1) Development only"
echo "2) Production only"
echo "3) Both environments"
read -p "Enter your choice (1-3): " choice
echo ""

case $choice in
    1)
        header "Cleaning up Development Environment"
        echo "Destroying TrainTracker-Dev-Pipeline stack..."
        cdk destroy TrainTracker-Dev-Pipeline --force
        
        echo "Destroying TrainTracker-Dev stack..."
        cdk destroy TrainTracker-Dev --force
        ;;
    2)
        header "Cleaning up Production Environment"
        echo "Destroying TrainTracker-Pipeline stack..."
        cdk destroy TrainTracker-Pipeline --force
        
        echo "Destroying TrainTracker-App stack..."
        cdk destroy TrainTracker-App --force
        ;;
    3)
        header "Cleaning up Development Environment"
        echo "Destroying TrainTracker-Dev-Pipeline stack..."
        cdk destroy TrainTracker-Dev-Pipeline --force
        
        echo "Destroying TrainTracker-Dev stack..."
        cdk destroy TrainTracker-Dev --force
        
        header "Cleaning up Production Environment"
        echo "Destroying TrainTracker-Pipeline stack..."
        cdk destroy TrainTracker-Pipeline --force
        
        echo "Destroying TrainTracker-App stack..."
        cdk destroy TrainTracker-App --force
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

header "Cleanup Complete"
echo "All selected stacks have been destroyed."
