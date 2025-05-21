#!/bin/bash

# Exit on error
set -e

# Check if a region was provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <aws-region>"
    echo "Example: $0 us-east-1"
    echo ""
    echo "This script allows you to explicitly specify the AWS region when pushing the Docker image."
    echo "It will set the AWS_REGION environment variable and then call the push-image.sh script."
    exit 1
fi

# Set the AWS region from the command line argument
export AWS_REGION=$1
export AWS_DEFAULT_REGION=$1

echo "Setting AWS region to: $AWS_REGION"

# Call the push-image.sh script
./push-image.sh
