#!/bin/bash

# AWS Cleanup Script for TrainTracker Migration to Render
# Run this ONLY after confirming Render deployment is working and DNS has been migrated

echo "🚨 WARNING: This script will delete AWS resources and cannot be undone!"
echo "Make sure Render deployment is working and DNS has been migrated before proceeding."
echo ""
read -p "Are you sure you want to proceed? (type 'yes' to continue): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo "Starting AWS resource cleanup..."

# Set your AWS region
AWS_REGION="us-east-1"
CLUSTER_NAME="TrainTracker-App-TrainTrackerService"
SERVICE_NAME="Service"
LAMBDA_FUNCTION_NAME="traintracker-cron-lambda"
RULE_NAME="traintracker-cron-rule"

echo "1. Scaling down ECS service to 0..."
aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --desired-count 0 \
    --region $AWS_REGION

echo "Waiting for service to scale down..."
aws ecs wait services-stable \
    --cluster $CLUSTER_NAME \
    --services $SERVICE_NAME \
    --region $AWS_REGION

echo "2. Deleting ECS service..."
aws ecs delete-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force \
    --region $AWS_REGION

echo "3. Deleting Lambda function..."
aws lambda delete-function \
    --function-name $LAMBDA_FUNCTION_NAME \
    --region $AWS_REGION

echo "4. Deleting EventBridge rule..."
# First remove targets
aws events remove-targets \
    --rule $RULE_NAME \
    --ids "1" \
    --region $AWS_REGION

# Then delete the rule
aws events delete-rule \
    --name $RULE_NAME \
    --region $AWS_REGION

echo "5. Use CDK to destroy remaining infrastructure..."
echo "Run the following commands in the infrastructure directory:"
echo "  cd infrastructure"
echo "  npm run cdk destroy --all"

echo ""
echo "6. Manual cleanup required:"
echo "   - Delete ECR repository (if no longer needed)"
echo "   - Delete CloudWatch log groups:"
echo "     - /ecs/traintracker"
echo "     - /aws/lambda/traintracker-cron-lambda"
echo "   - Verify all resources are deleted in AWS Console"

echo ""
echo "✅ Automated cleanup completed!"
echo "Please run the CDK destroy command and perform manual cleanup as listed above."
