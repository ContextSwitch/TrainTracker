# Southwest Chief Railcam Tracker

A web application for tracking Amtrak's Southwest Chief train with live railcam feeds, providing real-time status updates between Chicago and Los Angeles.

## AWS Deployment Guide

This project is set up to be deployed to AWS using AWS CDK with a CI/CD pipeline that includes development and production environments.

### Prerequisites

- AWS CLI installed and configured with appropriate credentials
- Node.js 18 or later
- Docker installed and running
- GitHub repository for the project

### Infrastructure Setup

The infrastructure is defined as code using AWS CDK in the `infrastructure` directory.

1. Install dependencies for the infrastructure project:

```bash
cd infrastructure
npm install
```

2. Configure your AWS account and region:

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1  # or your preferred region
```

3. Create a GitHub personal access token with `repo` and `admin:repo_hook` permissions and store it in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-token \
  --secret-string YOUR_GITHUB_TOKEN
```

4. Update the GitHub repository information in `infrastructure/bin/app.ts`:

```typescript
// Update these values with your GitHub information
githubOwner: 'your-github-username',
githubRepo: 'southwest-chief-railcam-tracker',
githubBranch: 'main'
```

5. Deploy the infrastructure:

```bash
npm run cdk deploy -- --all
```

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
export ECR_REPOSITORY_URI=$(aws ecr describe-repositories --repository-names swchieftracker-dev --query 'repositories[0].repositoryUri' --output text)

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
