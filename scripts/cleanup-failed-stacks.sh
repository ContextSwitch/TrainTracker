#!/bin/bash

# Exit on error
set -e

echo "Starting cleanup of failed CloudFormation stacks..."

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

# Function to clean up a stack in DELETE_FAILED state
cleanup_failed_stack() {
    local stack_name=$1
    echo "Cleaning up stack: $stack_name"
    
    # Get the stack status
    local stack_status=$(aws cloudformation describe-stacks --stack-name $stack_name --query "Stacks[0].StackStatus" --output text 2>/dev/null || echo "STACK_NOT_FOUND")
    
    if [ "$stack_status" == "DELETE_FAILED" ]; then
        echo "Stack $stack_name is in DELETE_FAILED state. Attempting to clean up..."
        
        # List resources that failed to delete
        echo "Listing resources that failed to delete..."
        local resources=$(aws cloudformation list-stack-resources --stack-name $stack_name --query "StackResourceSummaries[?ResourceStatus=='DELETE_FAILED'].LogicalResourceId" --output text)
        
        if [ -z "$resources" ]; then
            echo "No resources in DELETE_FAILED state found. Attempting normal delete..."
            aws cloudformation delete-stack --stack-name $stack_name
        else
            echo "Found resources in DELETE_FAILED state: $resources"
            echo "Deleting stack with --retain-resources flag..."
            
            # Convert space-separated list to comma-separated list
            local retain_resources=$(echo $resources | tr ' ' ',')
            
            # Delete the stack with retain-resources flag
            aws cloudformation delete-stack --stack-name $stack_name --retain-resources $retain_resources
        fi
        
        echo "Waiting for stack deletion to complete (this may take a few minutes)..."
        aws cloudformation wait stack-delete-complete --stack-name $stack_name || true
        
        # Check if the stack still exists
        if aws cloudformation describe-stacks --stack-name $stack_name &>/dev/null; then
            echo "WARNING: Stack $stack_name still exists. It may need manual cleanup in the AWS console."
        else
            echo "Stack $stack_name has been deleted successfully."
        fi
    elif [ "$stack_status" != "STACK_NOT_FOUND" ]; then
        echo "Stack $stack_name exists but is not in DELETE_FAILED state (current state: $stack_status). No cleanup needed."
    else
        echo "Stack $stack_name not found. No cleanup needed."
    fi
}

# Check for TrainTracker stacks in DELETE_FAILED state
echo "Checking for TrainTracker stacks..."

# List of stack names to check
stack_names=("TrainTracker-Network" "TrainTracker-Storage" "TrainTracker-App")

# Clean up each stack if needed
for stack_name in "${stack_names[@]}"; do
    cleanup_failed_stack $stack_name
done

echo "Stack cleanup process completed."
