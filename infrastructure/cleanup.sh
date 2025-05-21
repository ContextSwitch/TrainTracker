#!/bin/bash
set -e

echo "Cleaning up TrainTracker infrastructure..."

# Navigate to the infrastructure directory
cd "$(dirname "$0")"

# Destroy stacks in reverse order
echo "Destroying ECS stack..."
npx cdk destroy TrainTracker-App --force

echo "Destroying storage stack..."
npx cdk destroy TrainTracker-Storage --force

echo "Destroying network stack..."
npx cdk destroy TrainTracker-Network --force

echo "Infrastructure cleanup completed successfully!"
