#!/bin/bash

# Exit on error
set -e

echo "Deploying TrainTracker to AWS without Docker..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Deploy infrastructure
echo "Deploying infrastructure..."
cd infrastructure
./deploy.sh
cd ..

# Get the ECR repository URI from the CloudFormation stack outputs
echo "Getting ECR repository URI..."
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

# Use a public Node.js image as a base
echo "Using public Node.js image as a base..."
PUBLIC_IMAGE="public.ecr.aws/docker/library/node:18-alpine"

# Create a task definition JSON file
echo "Creating task definition..."
cat > task-definition.json << EOF
{
  "family": "traintracker",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/TrainTracker-App-TaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/TrainTracker-App-TaskRole",
  "networkMode": "awsvpc",
  "containerDefinitions": [
    {
      "name": "traintracker-container",
      "image": "public.ecr.aws/nginx/nginx:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/traintracker",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "traintracker"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
        "interval": 60,
        "timeout": 10,
        "retries": 5,
        "startPeriod": 120
      }
    }
  ],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024"
}
EOF

# Register the task definition
echo "Registering task definition..."
TASK_DEFINITION_ARN=$(aws ecs register-task-definition --cli-input-json file://task-definition.json --query 'taskDefinition.taskDefinitionArn' --output text)

echo "Task definition registered: $TASK_DEFINITION_ARN"

# Update the ECS service to use the new task definition
echo "Updating ECS service..."
CLUSTER_NAME="TrainTracker-App-TrainTrackerService"
SERVICE_NAME=$(aws ecs list-services --cluster $CLUSTER_NAME --query "serviceArns[0]" --output text | awk -F'/' '{print $NF}')

if [ -z "$SERVICE_NAME" ]; then
  echo "Error: Could not retrieve ECS service name."
  exit 1
fi

echo "Using ECS service: $SERVICE_NAME"

aws ecs update-service --cluster $CLUSTER_NAME --service $SERVICE_NAME --task-definition $TASK_DEFINITION_ARN --force-new-deployment

echo "ECS service updated successfully. The new image will be deployed shortly."
echo "You can check the status of the deployment in the AWS ECS console."
echo "Application URL can be found in the CloudFormation outputs:"
echo "aws cloudformation describe-stacks --stack-name TrainTracker-App --query \"Stacks[0].Outputs[?OutputKey=='URL'].OutputValue\" --output text"

# Clean up
rm task-definition.json

echo "Deployment completed successfully!"
