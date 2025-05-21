#!/bin/bash

# Exit on error
set -e

echo "Starting comprehensive AWS deployment with cleanup..."

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

# Step 1: Clean up any failed CloudFormation stacks
echo "Step 1: Cleaning up any failed CloudFormation stacks..."
./cleanup-failed-stacks.sh

# Step 2: Clean up CDK bootstrap resources
echo "Step 2: Cleaning up CDK bootstrap resources..."

# Get AWS account ID and region
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region || echo "us-east-1")

echo "Using AWS Account: $AWS_ACCOUNT_ID in region: $AWS_REGION"

# Check for CDKToolkit stack
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

# Check for bootstrap S3 bucket
BUCKET_NAME="cdk-hnb659fds-assets-${AWS_ACCOUNT_ID}-${AWS_REGION}"
echo "Checking for S3 bucket: $BUCKET_NAME..."

if aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null; then
    echo "S3 bucket found. Emptying bucket..."
    
    # Check if jq is installed
    if command -v jq &> /dev/null; then
        # Use jq approach
        echo "Using jq to delete all versions..."
        
        # First, remove all object versions
        echo "Removing all versions from bucket..."
        versions=$(aws s3api list-object-versions --bucket $BUCKET_NAME --output json --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}' 2>/dev/null)
        if [ "$(echo $versions | jq '.Objects | length')" -gt 0 ]; then
            echo $versions | jq '{Objects: .Objects, Quiet: true}' | aws s3api delete-objects --bucket $BUCKET_NAME --delete file:///dev/stdin
        fi
        
        # Then, remove all delete markers
        echo "Removing all delete markers from bucket..."
        markers=$(aws s3api list-object-versions --bucket $BUCKET_NAME --output json --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}' 2>/dev/null)
        if [ "$(echo $markers | jq '.Objects | length')" -gt 0 ]; then
            echo $markers | jq '{Objects: .Objects, Quiet: true}' | aws s3api delete-objects --bucket $BUCKET_NAME --delete file:///dev/stdin
        fi
    else
        # Use pure AWS CLI approach
        echo "jq not found, using AWS CLI approach..."
        
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
    fi
    
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
echo "Step 3: Installing dependencies..."
npm install

# Step 5: Run bootstrap with force flag
echo "Step 4: Bootstrapping CDK environment with force flag..."
npx cdk bootstrap --force

# Step 6: Deploy the infrastructure
echo "Step 5: Deploying infrastructure..."
./deploy.sh

echo "Infrastructure deployment completed."
echo "You can now deploy the application using one of the following scripts:"
echo "1. ./setup-docker-and-deploy.sh (recommended)"
echo "2. ./push-image.sh (if Docker is already installed)"
echo "3. ./deploy-without-docker.sh (if you don't want to use Docker)"
