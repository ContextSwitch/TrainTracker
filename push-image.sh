#!/bin/bash

# Exit on error
set -e

echo "Building and pushing Docker image to ECR..."

# Get the ECR repository URI from the CloudFormation stack outputs
REPOSITORY_URI=$(aws cloudformation describe-stacks --stack-name TrainTracker-Storage --query "Stacks[0].Outputs[?OutputKey=='RepositoryURI'].OutputValue" --output text)

if [ -z "$REPOSITORY_URI" ]; then
  echo "Error: Could not retrieve ECR repository URI from CloudFormation stack."
  exit 1
fi

echo "Using ECR repository: $REPOSITORY_URI"

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

echo "Using AWS Account: $AWS_ACCOUNT_ID in region: $AWS_REGION"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build the Docker image
echo "Building Docker image..."
docker build -t $REPOSITORY_URI:latest .

# Push the Docker image to ECR
echo "Pushing Docker image to ECR..."
docker push $REPOSITORY_URI:latest

echo "Docker image pushed successfully to $REPOSITORY_URI:latest"

# Update the ECS service to use the new image
echo "Updating ECS service..."

# Check if the ECS cluster exists
if ! aws ecs describe-clusters --clusters TrainTracker-App-TrainTrackerService --query "clusters[0].clusterArn" --output text &> /dev/null; then
  echo "Warning: ECS cluster 'TrainTracker-App-TrainTrackerService' not found."
  echo "This could be because:"
  echo "  1. The infrastructure deployment (deploy.sh) hasn't been run yet"
  echo "  2. The infrastructure deployment failed"
  echo "  3. The cluster name has changed"
  echo ""
  echo "The Docker image has been successfully pushed to ECR: $REPOSITORY_URI:latest"
  echo "To complete the deployment:"
  echo "  1. Run './infrastructure/deploy.sh' to deploy the infrastructure if not already done"
  echo "  2. After infrastructure deployment, run this script again to update the ECS service"
  echo ""
  echo "To check if the infrastructure was deployed successfully:"
  echo "aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE"
  exit 0
fi

# Get the service name
SERVICE_NAME=$(aws ecs list-services --cluster TrainTracker-App-TrainTrackerService --query "serviceArns[0]" --output text | awk -F'/' '{print $NF}')

if [ -z "$SERVICE_NAME" ] || [ "$SERVICE_NAME" == "None" ]; then
  echo "Warning: Could not retrieve ECS service name."
  echo "This could be because:"
  echo "  1. The service hasn't been created yet"
  echo "  2. The service creation failed"
  echo ""
  echo "The Docker image has been successfully pushed to ECR: $REPOSITORY_URI:latest"
  echo "To complete the deployment:"
  echo "  1. Check the status of the CloudFormation stacks:"
  echo "     aws cloudformation describe-stacks --stack-name TrainTracker-App"
  echo "  2. If the stack is complete, check the ECS console for any issues with the service"
  exit 0
fi

echo "Using ECS service: $SERVICE_NAME"

# Get the cluster ARN
CLUSTER_ARN=$(aws ecs describe-clusters --clusters TrainTracker-App-TrainTrackerService --query "clusters[0].clusterArn" --output text)

# Get the service ARN
SERVICE_ARN=$(aws ecs list-services --cluster TrainTracker-App-TrainTrackerService --query "serviceArns[0]" --output text)

echo "Using cluster ARN: $CLUSTER_ARN"
echo "Using service ARN: $SERVICE_ARN"

# Update the service
aws ecs update-service --cluster TrainTracker-App-TrainTrackerService --service $SERVICE_NAME --force-new-deployment --region $AWS_REGION

echo "ECS service updated successfully. The new image will be deployed shortly."
echo "You can check the status of the deployment in the AWS ECS console."
echo "Application URL can be found in the CloudFormation outputs:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-App --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"
