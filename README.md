# Southwest Chief Railcam Tracker

A web application for tracking Amtrak's Southwest Chief train with live railcam feeds, providing real-time status updates between Chicago and Los Angeles.

## AWS Deployment Guide

This project is set up to be deployed to AWS using AWS CDK with a CI/CD pipeline that includes development and production environments.

### Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- Docker installed and running
- GitHub repository for the project
- AWS IAM user with the following permissions:
  - cloudformation:*
  - iam:*
  - s3:*
  - ecr:*
  - ecs:*
  - dynamodb:*
  - logs:*
  - elasticloadbalancing:*
  - ec2:*
  
  For testing purposes, you can attach the 'AdministratorAccess' policy to your IAM user.

### Infrastructure Setup

The infrastructure is defined as code using AWS CDK in the `infrastructure` directory.

1. Navigate to the infrastructure directory and run the setup script:

```bash
cd infrastructure
chmod +x setup.sh
./setup.sh
```

This script will:
- Install dependencies
- Install AWS CDK CLI if needed
- Verify AWS credentials
- Bootstrap your AWS environment
- Provide guidance on next steps

2. Create a GitHub personal access token with `repo` and `admin:repo_hook` permissions and store it in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string YOUR_GITHUB_TOKEN
```

3. Update the GitHub repository information in `infrastructure/bin/app.ts`:

```typescript
// Update these values with your GitHub information
githubOwner: 'your-github-username',
githubRepo: 'southwest-chief-railcam-tracker',
githubBranch: 'main'
```

4. Review the CDK configuration in `infrastructure/cdk.json` to ensure it matches your requirements.

5. Deploy the infrastructure:

```bash
cd infrastructure
npm run deploy
```

The deployment will create the following AWS resources:
- VPC with public and private subnets
- DynamoDB tables for train status data
- S3 buckets for static assets
- ECS Fargate clusters for running the application
- CI/CD pipeline with CodePipeline and CodeBuild

### CI/CD Pipeline

The CI/CD pipeline is automatically created as part of the infrastructure deployment. It includes the following stages:

1. **Source**: Pulls the code from the GitHub repository
2. **Build and Test**: Builds the application and runs unit tests
3. **Deploy to Dev**: Deploys the application to the development environment
4. **Integration Tests**: Runs integration tests against the development environment
5. **Deploy to Production**: Deploys the application to the production environment if all tests pass

### Manual Deployment

If you need to manually deploy the application:

1. Build and push the Docker image:

```bash
# Get the ECR repository URI
export ECR_REPOSITORY_URI=$(aws ecr describe-repositories --repository-names traintracker-dev --query 'repositories[0].repositoryUri' --output text)

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push the image
docker build -t $ECR_REPOSITORY_URI:latest .
docker push $ECR_REPOSITORY_URI:latest
```

2. Update the ECS service:

```bash
# For development environment
aws ecs update-service --cluster SWChiefTracker-Dev-ECS --service SWChiefTracker-Dev-Service --force-new-deployment

# For production environment
aws ecs update-service --cluster SWChiefTracker-Prod-ECS --service SWChiefTracker-Prod-Service --force-new-deployment
```

### Environment Variables

The application uses the following environment variables:

- `NODE_ENV`: Set to `development` or `production`
- `TRAIN_STATUS_TABLE`: DynamoDB table name for train status data
- `CURRENT_STATUS_TABLE`: DynamoDB table name for current status data
- `ASSETS_BUCKET`: S3 bucket name for static assets
- `AWS_REGION`: AWS region for the services

These variables are automatically set by the ECS task definition.

### Monitoring and Logs

- CloudWatch Logs: All application logs are sent to CloudWatch Logs
- CloudWatch Alarms: Alarms are set up for CPU and memory usage
- CloudWatch Metrics: Custom metrics are available for API endpoints

### Cleanup

To remove all AWS resources created by this project:

```bash
cd infrastructure
npm run cdk destroy -- --all
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Run tests:

```bash
npm test
```

4. Run integration tests:

```bash
npm run test:integration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
