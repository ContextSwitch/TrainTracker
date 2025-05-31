# TrainTracker

A web application for tracking train status and providing real-time updates.

## AWS Deployment Guide

This project is set up to be deployed to AWS using AWS CDK. The deployment includes:

- ECS Fargate for container orchestration
- ECR repositories for Docker images
- Load balancers for traffic distribution
- VPC with public and private subnets

### Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- Docker installed and running
- AWS CDK installed globally (`npm install -g aws-cdk`)

### Deployment Steps

#### 1. Deploy the Infrastructure

You have two options to deploy the infrastructure:

**Option 1: Standard deployment (if you haven't encountered any CDK bootstrap issues):**
```bash
# Navigate to the infrastructure directory
cd infrastructure

# Make the script executable (if not already)
chmod +x deploy.sh

# Deploy the infrastructure
./deploy.sh
```

**Option 2: Clean bootstrap and deploy (if you encounter CDK bootstrap errors):**

There are several options for cleaning up and deploying:

```bash
# Comprehensive cleanup and deploy (recommended)
# Handles failed stacks, bootstrap resources, and deployment
chmod +x deploy-with-cleanup.sh
./deploy-with-cleanup.sh

# OR

# Clean bootstrap only (requires jq)
chmod +x clean-bootstrap-and-deploy.sh
./clean-bootstrap-and-deploy.sh

# OR

# Clean bootstrap only (no dependencies required)
chmod +x clean-bootstrap-simple.sh
./clean-bootstrap-simple.sh
```

The comprehensive script will:
1. Clean up any CloudFormation stacks in DELETE_FAILED state
2. Delete the CDKToolkit CloudFormation stack
3. Empty and delete the CDK bootstrap S3 bucket (including all versions)
4. Run bootstrap with the --force flag
5. Deploy the infrastructure

If you encounter a "Stack is in DELETE_FAILED state" error, use the comprehensive script.

This will create:
- VPC with public and private subnets
- ECS Fargate cluster
- Application Load Balancer
- ECR Repository

#### 2. Deploy the Application

After the infrastructure is deployed, you have two options to deploy the application:

**Option 1: All-in-one setup and deployment (recommended):**
```bash
# From the project root directory
chmod +x setup-docker-and-deploy.sh
./setup-docker-and-deploy.sh
```

This script will:
1. Check if Docker is installed, and install it if needed
2. Deploy the infrastructure using AWS CDK
3. Build and push the Docker image to ECR
4. Update the ECS service to use the new image

**Option 2: If you already have Docker installed:**
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
1. Get the ECR repository URI from the CloudFormation stack
2. Build the Docker image
3. Push the image to ECR
4. Update the ECS service to use the new image

**Option 3: If you don't want to use Docker:**
```bash
# From the project root directory
chmod +x deploy-without-docker.sh
./deploy-without-docker.sh
```

This script will:
1. Deploy the infrastructure using AWS CDK
2. Create a task definition using a public nginx image
3. Register the task definition with ECS
4. Update the ECS service to use the new task definition

#### 3. Accessing the Application

Once deployed, you can access the application using the URL provided in the CloudFormation outputs:

```bash
aws cloudformation describe-stacks --stack-name TrainTracker-App --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text
```

### Environment Structure

The deployment creates four main stacks:

1. **TrainTracker-Network**: Contains the network infrastructure
   - VPC
   - Public and private subnets
   - Security groups

2. **TrainTracker-Storage**: Contains the storage infrastructure
   - ECR Repository

3. **TrainTracker-App**: Contains the application infrastructure
   - ECS Cluster
   - Fargate Service
   - Load Balancer

4. **TrainTracker-Scheduler**: Contains the scheduling infrastructure
   - Lambda function for calling the cron API endpoint
   - EventBridge rule for scheduling the Lambda function

### Scheduled Tasks

The application includes a scheduled task that runs every 10 minutes to update train data by calling the `/api/cron` endpoint. This is implemented using:

- AWS Lambda function that makes an HTTP request to the API endpoint
- AWS EventBridge rule that triggers the Lambda function every 10 minutes

The scheduled task is automatically deployed as part of the infrastructure deployment process. No additional steps are required to set it up.

To monitor the scheduled task:

1. View the Lambda function logs in CloudWatch:
   ```bash
   aws logs tail /aws/lambda/traintracker-cron-lambda --follow
   ```

2. Check the EventBridge rule status:
   ```bash
   aws events describe-rule --name traintracker-cron-rule
   ```

### Cleaning Up

To avoid incurring charges, you can delete the stacks when they're no longer needed using the cleanup script:

```bash
cd infrastructure
chmod +x cleanup.sh
./cleanup.sh
```

This will destroy all the stacks in reverse order.

## Development Guide

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run tests with:

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Docker Development

You can also run the application in Docker locally:

```bash
docker build -t traintracker .
docker run -p 3000:3000 traintracker



#force image deploy:

aws ecs update-service --cluster arn:aws:ecs:us-east-1:237069437847:cluster/TrainTracker-App-TrainTrackerService --service arn:aws:ecs:us-east-1:237069437847:service/TrainTracker-App-TrainTrackerService/TrainTracker-App-ServiceD69D759B-wYyaGgjovlBw --force-new-deployment --region us-east-1
