# TrainTracker

A web application for tracking train status and providing real-time updates.

## AWS Deployment Guide

This project is set up to be deployed to AWS using AWS CDK. The deployment includes:

- Production and development environments with ECS Fargate
- CI/CD pipelines for automated deployments
- ECR repositories for Docker images
- Load balancers for traffic distribution

### Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- Docker installed and running
- AWS CDK installed globally (`npm install -g aws-cdk`)

### Deployment Steps

#### 1. Deploy the Infrastructure

You can deploy either the production environment, development environment, or both:

**Production Environment Only:**
```bash
# Navigate to the infrastructure directory
cd infrastructure

# Install dependencies
npm install

# Bootstrap CDK (only needed once per AWS account/region)
cdk bootstrap

# Deploy the production infrastructure
./simplified-deploy.sh
```

**Development Environment Only:**
```bash
# Navigate to the infrastructure directory
cd infrastructure

# Deploy the development infrastructure
./deploy-dev.sh
```

**Both Environments:**
```bash
# Navigate to the infrastructure directory
cd infrastructure

# Deploy both production and development infrastructures
./deploy-all.sh
```

This will create:
- VPC with public and isolated subnets
- ECS Fargate cluster
- Application Load Balancer
- ECR Repository
- CI/CD Pipeline

#### 2. Build and Push the Docker Image

After the infrastructure is deployed, you need to build and push the Docker image to the ECR repository:

```bash
# From the project root directory
chmod +x push-image.sh
./push-image.sh
```

This script will:
1. Get the ECR repository URI from the CloudFormation stack
2. Build the Docker image
3. Push the image to ECR
4. Update the ECS service to use the new image

#### 3. Using the CI/CD Pipeline

The CI/CD pipeline is set up to use an S3 bucket as the source. To deploy a new version:

1. Zip your application code:
   ```bash
   git archive --format=zip HEAD -o source.zip
   ```

2. Upload the zip file to the S3 bucket:
   ```bash
   aws s3 cp source.zip s3://[SOURCE_BUCKET_NAME]/source.zip
   ```

   You can find the source bucket name in the CloudFormation outputs.

3. The pipeline will automatically start and:
   - Run tests
   - Build the Docker image
   - Push the image to ECR
   - Deploy the new image to ECS

### Environment Structure

The deployment creates two main stacks:

1. **TrainTracker-App**: Contains the application infrastructure
   - VPC
   - ECS Cluster
   - Fargate Service
   - Load Balancer
   - ECR Repository

2. **TrainTracker-Pipeline**: Contains the CI/CD pipeline
   - Source stage (S3)
   - Test stage
   - Build stage
   - Deploy stage

### Accessing the Application

Once deployed, you can access the application using the Load Balancer URL, which is provided in the CloudFormation outputs:

```bash
aws cloudformation describe-stacks --stack-name TrainTracker-App --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text
```

### Development Environment

In addition to the production environment, this project includes a separate development environment that can be deployed alongside production.

#### Deploying the Development Environment

```bash
# Navigate to the infrastructure directory
cd infrastructure

# Make the script executable (if not already)
chmod +x deploy-dev.sh

# Deploy the development environment
./deploy-dev.sh
```

This will create a separate stack named `TrainTracker-Dev` with its own:
- VPC (with public subnets only to save costs)
- ECS Fargate cluster (with reduced capacity)
- Application Load Balancer
- ECR Repository
- CI/CD Pipeline (configured to use the 'develop' branch)

#### Deploying to the Development Environment

After the development infrastructure is deployed, you can build and push the Docker image:

```bash
# From the project root directory
chmod +x push-image-dev.sh
./push-image-dev.sh
```

#### Accessing the Development Environment

Once deployed, you can access the development application using:

```bash
aws cloudformation describe-stacks --stack-name TrainTracker-Dev --query "Stacks[0].Outputs[?OutputKey=='URL'].OutputValue" --output text
```

### Cleaning Up

To avoid incurring charges, you can delete the stacks when they're no longer needed using the cleanup script:

```bash
cd infrastructure
chmod +x cleanup.sh
./cleanup.sh
```

The script will prompt you to choose which environment to clean up:
1. Development only
2. Production only
3. Both environments

Alternatively, you can manually delete the stacks:

```bash
cd infrastructure
# Delete development stacks
cdk destroy TrainTracker-Dev-Pipeline
cdk destroy TrainTracker-Dev

# Delete production stacks
cdk destroy TrainTracker-Pipeline
cdk destroy TrainTracker-App
```

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
