#!/bin/bash
set -e

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install it first."
    exit 1
fi

# Get the ECR repository URI from CloudFormation
REPO_URI=$(aws cloudformation describe-stacks --stack-name TrainTracker-Dev --query "Stacks[0].Outputs[?OutputKey=='RepositoryURI'].OutputValue" --output text)

if [ -z "$REPO_URI" ]; then
    echo "Could not find the ECR repository URI. Make sure the TrainTracker-Dev stack is deployed."
    exit 1
fi

echo "Found ECR repository: $REPO_URI"

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Determine AWS region using multiple methods
if [ -n "$AWS_REGION" ]; then
  echo "Using AWS_REGION environment variable: $AWS_REGION"
elif [ -n "$AWS_DEFAULT_REGION" ]; then
  AWS_REGION=$AWS_DEFAULT_REGION
  echo "Using AWS_DEFAULT_REGION environment variable: $AWS_REGION"
else
  # Try to get region from AWS CLI configuration
  CLI_REGION=$(aws configure get region 2>/dev/null)
  if [ -n "$CLI_REGION" ]; then
    AWS_REGION=$CLI_REGION
    echo "Using region from AWS CLI configuration: $AWS_REGION"
  else
    # Try to get region from ~/.aws/config file
    if [ -f ~/.aws/config ]; then
      CONFIG_REGION=$(grep -m 1 "region" ~/.aws/config | cut -d '=' -f 2 | tr -d ' ')
      if [ -n "$CONFIG_REGION" ]; then
        AWS_REGION=$CONFIG_REGION
        echo "Using region from ~/.aws/config file: $AWS_REGION"
      else
        # Default to us-east-1
        AWS_REGION="us-east-1"
        echo "No region found in configuration. Defaulting to: $AWS_REGION"
      fi
    else
      # Default to us-east-1
      AWS_REGION="us-east-1"
      echo "No AWS configuration found. Defaulting to region: $AWS_REGION"
    fi
  fi
fi

# Explicitly set the AWS_REGION environment variable for this script
export AWS_REGION
export AWS_DEFAULT_REGION=$AWS_REGION

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the Docker image
echo "Building Docker image..."
docker build -t traintracker-dev:latest .

# Tag the image
echo "Tagging image as $REPO_URI:latest"
docker tag traintracker-dev:latest $REPO_URI:latest

# Push the image to ECR
echo "Pushing image to ECR..."
docker push $REPO_URI:latest

echo "Image pushed successfully to $REPO_URI:latest"

# Update the ECS service to use the new image
echo "Updating ECS service..."
aws ecs update-service --cluster TrainTracker-Dev-Cluster --service TrainTracker-Dev-Service --force-new-deployment

echo "Deployment completed successfully!"
echo "The application will be available at the load balancer URL:"
aws cloudformation describe-stacks --stack-name TrainTracker-Dev --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text
