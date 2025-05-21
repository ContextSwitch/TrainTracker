#!/bin/bash

# Exit on error
set -e

echo "Starting cleanup of CDK bootstrap resources (simple version)..."

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

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "Using AWS Account: $AWS_ACCOUNT_ID in region: $AWS_REGION"

# Step 1: Delete the CDKToolkit CloudFormation stack if it exists
echo "Checking for CDKToolkit CloudFormation stack..."
if aws cloudformation describe-stacks --stack-name CDKToolkit &> /dev/null; then
    echo "CDKToolkit stack found. Deleting..."
    aws cloudformation delete-stack --stack-name CDKToolkit
    echo "Waiting for stack deletion to complete (this may take a few minutes)..."
    aws cloudformation wait stack-delete-complete --stack-name CDKToolkit
    echo "CDKToolkit stack deleted successfully."
else
    echo "CDKToolkit stack not found or already deleted."
fi

# Step 2: Check if the S3 bucket exists and delete it
BUCKET_NAME="cdk-hnb659fds-assets-${AWS_ACCOUNT_ID}-${AWS_REGION}"
echo "Checking for S3 bucket: $BUCKET_NAME..."

if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "S3 bucket found. Emptying bucket..."
    
    # Alternative approach without jq - use AWS CLI to empty the bucket with versioning
    echo "Removing all objects and versions..."
    
    # First, enable versioning (in case it's not already enabled)
    aws s3api put-bucket-versioning --bucket $BUCKET_NAME --versioning-configuration Status=Enabled
    
    # Then use the AWS CLI to remove all versions
    aws s3api list-object-versions --bucket $BUCKET_NAME --output text --query 'Versions[].{Key:Key,VersionId:VersionId}' | \
    while read -r key version; do
        if [ "$key" != "None" ] && [ "$version" != "None" ]; then
            echo "Deleting object: $key (version $version)"
            aws s3api delete-object --bucket $BUCKET_NAME --key "$key" --version-id "$version"
        fi
    done
    
    # Delete all delete markers
    aws s3api list-object-versions --bucket $BUCKET_NAME --output text --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' | \
    while read -r key version; do
        if [ "$key" != "None" ] && [ "$version" != "None" ]; then
            echo "Deleting delete marker: $key (version $version)"
            aws s3api delete-object --bucket $BUCKET_NAME --key "$key" --version-id "$version"
        fi
    done
    
    # Also remove any non-versioned objects
    echo "Removing any remaining objects..."
    aws s3 rm s3://$BUCKET_NAME --recursive
    
    echo "Deleting bucket..."
    aws s3api delete-bucket --bucket $BUCKET_NAME
    
    echo "S3 bucket deleted successfully."
else
    echo "S3 bucket not found or already deleted."
fi

# Step 3: Navigate to infrastructure directory
cd infrastructure

# Step 4: Install dependencies
echo "Installing dependencies..."
npm install

# Step 5: Run bootstrap with force flag
echo "Bootstrapping CDK environment with force flag..."
npx cdk bootstrap --force

# Step 6: Deploy the infrastructure
echo "Deploying infrastructure..."
./deploy.sh

echo "Infrastructure deployment completed."
echo "You can now deploy the application using one of the following scripts:"
echo "1. ./setup-docker-and-deploy.sh (recommended)"
echo "2. ./push-image.sh (if Docker is already installed)"
echo "3. ./deploy-without-docker.sh (if you don't want to use Docker)"
