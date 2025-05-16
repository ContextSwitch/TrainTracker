#!/bin/bash

# Exit on error
set -e

echo "Setting up simplified TrainTracker infrastructure..."

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
if aws cloudformation describe-stacks --stack-name CDKToolkit 2>&1 | grep -q "Stack with id CDKToolkit does not exist"; then
    echo "Error: Your AWS user doesn't have the necessary permissions to use CloudFormation."
    echo "Please ensure your AWS user has the following permissions:"
    echo "  - cloudformation:*"
    echo "  - iam:*"
    echo "  - s3:*"
    echo "  - elasticbeanstalk:*"
    echo "  - ec2:*"
    echo "  - codepipeline:*"
    echo "  - codebuild:*"
    echo "  - ssm:GetParameter"
    echo "  - ssm:PutParameter"
    echo "You can attach the 'AdministratorAccess' policy for testing purposes."
    exit 1
fi

# Clean any existing build artifacts
if [ -d "dist" ]; then
    echo "Cleaning previous build artifacts..."
    rm -rf dist
fi

# Bootstrap AWS environment if needed
echo "Bootstrapping AWS environment..."
cdk bootstrap "aws://$AWS_ACCOUNT_ID/$AWS_REGION" || {
    echo "Error: Failed to bootstrap AWS environment."
    echo "This could be due to insufficient permissions or AWS service issues."
    echo "Please check your AWS credentials and try again."
    exit 1
}

# No GitHub token needed for this simplified setup

# Update GitHub repository information
echo "Please update the GitHub repository information in bin/simplified-app.ts with your own values:"
echo "  - githubOwner: 'your-github-username'"
echo "  - githubRepo: 'traintracker'"
echo "  - githubBranch: 'main'"

echo ""
echo "After deployment, you'll need to:"
echo "1. Create a Dockerfile in your project root if it doesn't exist already"
echo "2. Zip your project: zip -r source.zip . -x \"node_modules/*\" -x \".git/*\""
echo "3. Upload to S3: aws s3 cp source.zip s3://YOUR_SOURCE_BUCKET_NAME/"
echo "4. Start the pipeline: aws codepipeline start-pipeline-execution --name TrainTracker-Pipeline"

echo "Setup complete! You can now deploy the infrastructure with './simplified-deploy.sh'"
