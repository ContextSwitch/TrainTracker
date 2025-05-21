# TrainTracker Infrastructure

This directory contains the AWS CDK infrastructure code for deploying the TrainTracker application to AWS.

## Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- Docker installed and running

## Infrastructure Configuration

The infrastructure is configured for optimal performance and reliability:

- **Compute Resources**: 0.5 vCPU and 1GB memory for the container
- **Networking**: Tasks run in public subnets with public IPs for internet access
- **Health Checks**: Relaxed health check settings to allow for application startup time
- **Security**: Appropriate security groups for ALB and ECS tasks

## Directory Structure

- `bin/` - Contains the main CDK app entry point
- `lib/` - Contains the CDK stack definitions
  - `network-stack.ts` - VPC, subnets, and security groups
  - `storage-stack.ts` - ECR repository
  - `ecs-stack.ts` - ECS cluster, task definition, and service

## Deployment Instructions

### 1. Deploy the Infrastructure

You have two options to deploy the infrastructure:

#### Option 1: Standard deployment (if you haven't encountered any CDK bootstrap issues)

```bash
# Make the script executable (if not already)
chmod +x deploy.sh

# Deploy the infrastructure
./deploy.sh
```

This will:
1. Install dependencies
2. Bootstrap CDK (if not already done)
3. Deploy the network stack
4. Deploy the storage stack
5. Deploy the ECS stack

#### Option 2: Clean bootstrap and deploy (if you encounter CDK bootstrap errors)

If you encounter errors related to CDK bootstrap resources (like S3 bucket already exists) or stacks in DELETE_FAILED state, use one of these options:

**Comprehensive cleanup and deploy (recommended):**
```bash
# From the project root directory
chmod +x deploy-with-cleanup.sh

# Clean up failed stacks, bootstrap resources, and deploy
./deploy-with-cleanup.sh
```

**Standard bootstrap cleanup (requires jq):**
```bash
# From the project root directory
chmod +x clean-bootstrap-and-deploy.sh

# Clean up bootstrap resources and deploy
./clean-bootstrap-and-deploy.sh
```

**Simple bootstrap cleanup (no dependencies required):**
```bash
# From the project root directory
chmod +x clean-bootstrap-simple.sh

# Clean up bootstrap resources and deploy
./clean-bootstrap-simple.sh
```

**Failed stack cleanup only:**
```bash
# From the project root directory
chmod +x cleanup-failed-stacks.sh

# Clean up stacks in DELETE_FAILED state
./cleanup-failed-stacks.sh
```

The comprehensive script will:
1. Clean up any CloudFormation stacks in DELETE_FAILED state
2. Delete the CDKToolkit CloudFormation stack if it exists
3. Empty and delete the CDK bootstrap S3 bucket (including all versions if versioning is enabled)
4. Run the bootstrap command with the force flag
5. Deploy the infrastructure stacks

The standard and simple bootstrap cleanup scripts will handle only the bootstrap resources, while the failed stack cleanup script will handle only stacks in DELETE_FAILED state.

### 2. Deploy the Application

After the infrastructure is deployed, you have three options to deploy the application:

#### Option 1: All-in-one setup and deployment (recommended)

```bash
# From the project root directory
chmod +x setup-docker-and-deploy.sh
./setup-docker-and-deploy.sh
```

This will:
1. Check if Docker is installed, and install it if needed
2. Deploy the infrastructure using AWS CDK
3. Build and push the Docker image to ECR
4. Update the ECS service to use the new image

#### Option 2: If you already have Docker installed

```bash
# From the project root directory
chmod +x push-image.sh
./push-image.sh
```

If you encounter region detection issues, you can explicitly specify the AWS region:
```bash
# From the project root directory
chmod +x push-image-with-region.sh
./push-image-with-region.sh us-east-1  # Replace with your AWS region
```

If you encounter dependency conflicts during the Docker build, you can use the production-only Dockerfile:
```bash
# From the project root directory
chmod +x push-production-image.sh
./push-production-image.sh
```

These scripts will:
1. Build the Docker image
2. Push it to the ECR repository
3. Update the ECS service to use the new image

#### Option 3: If you don't want to use Docker

```bash
# From the project root directory
chmod +x deploy-without-docker.sh
./deploy-without-docker.sh
```

This will:
1. Deploy the infrastructure using AWS CDK
2. Create a task definition using a public nginx image
3. Register the task definition with ECS
4. Update the ECS service to use the new task definition

### 3. Access the Application

Once deployed, you can access the application using the URL provided in the CloudFormation outputs:

```bash
aws cloudformation describe-stacks --stack-name TrainTracker-App --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text
```

### Cleaning Up

To avoid incurring charges, you can delete the stacks when they're no longer needed:

```bash
chmod +x cleanup.sh
./cleanup.sh
```

This will destroy all the stacks in reverse order.

## Customization

You can customize the deployment by modifying the following files:

- `lib/network-stack.ts` - Modify VPC settings, security groups, etc.
- `lib/storage-stack.ts` - Modify ECR repository settings
- `lib/ecs-stack.ts` - Modify ECS settings, container settings, etc.
- `bin/app.ts` - Modify stack names, descriptions, etc.

## Troubleshooting

If you encounter issues with tasks deprovisioning (stopping shortly after starting), check the following:

1. **CloudWatch Logs**: Check the container logs in CloudWatch for application errors
   ```bash
   aws logs get-log-events --log-group-name /ecs/traintracker --log-stream-name <log-stream-name>
   ```

2. **Task Status**: Check the task status in the ECS console or using the AWS CLI
   ```bash
   aws ecs describe-tasks --cluster TrainTracker-App-TrainTrackerService --tasks <task-id>
   ```

3. **Common Issues**:
   - Health check failures: The container might be failing health checks
   - Memory/CPU issues: The container might be using more resources than allocated
   - Networking issues: The container might not be able to communicate properly
   - Permission issues: The task execution role might not have the necessary permissions

4. **Solutions**:
   - Increase memory/CPU allocation in `lib/ecs-stack.ts`
   - Modify health check settings to be less strict
   - Ensure the container has the necessary permissions
   - Make sure the container is in a public subnet with a public IP if it needs internet access
