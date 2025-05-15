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

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "AWS credentials not found or not configured correctly."
    echo "Please run 'aws configure' to set up your AWS credentials."
    exit 1
fi

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "Using AWS Account: $AWS_ACCOUNT_ID in region: $AWS_REGION"

# Verify cdk.json exists
if [ ! -f "cdk.json" ]; then
    echo "Error: cdk.json file not found. This file is required for CDK deployment."
    exit 1
fi

# Check for required permissions
echo "Checking for required AWS permissions..."
if aws cloudformation describe-stacks --stack-name Traintracker 2>&1 | grep -q "Stack with id Traintracker does not exist"; then
    echo "Error: Your AWS user doesn't have the necessary permissions to use CloudFormation."
    echo "Please ensure your AWS user has the following permissions:"
    echo "  - cloudformation:*"
    echo "  - iam:*"
    echo "  - s3:*"
    echo "  - ecr:*"
    echo "  - ecs:*"
    echo "  - dynamodb:*"
    echo "  - logs:*"
    echo "  - elasticloadbalancing:*"
    echo "  - ec2:*"
    echo "You can attach the 'AdministratorAccess' policy for testing purposes."
    exit 1
fi

# Bootstrap AWS environment if needed
echo "Bootstrapping AWS environment..."
cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_REGION" || {
    echo "Error: Failed to bootstrap AWS environment."
    echo "This could be due to insufficient permissions or AWS service issues."
    echo "Please check your AWS credentials and try again."
    exit 1
}

# Update GitHub repository information
echo "Please update the GitHub repository information in bin/app.ts with your own values:"
echo "  - githubOwner: 'your-github-username'"
echo "  - githubRepo: 'traintracker'"
echo "  - githubBranch: 'main'"

echo "Setup complete! You can now deploy the infrastructure with 'npm run deploy'"
echo ""
echo "Before deployment, make sure to:"
echo "1. Create a GitHub personal access token and store it in AWS Secrets Manager:"
echo "   aws secretsmanager create-secret --name github-token --secret-string YOUR_GITHUB_TOKEN"
echo "2. Update the GitHub repository information in bin/app.ts"
echo "3. Review the infrastructure stacks in bin/app.ts"
