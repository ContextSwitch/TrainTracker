import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

export class SimplifiedStack extends cdk.Stack {
  public readonly appName: string;
  public readonly environmentName: string;
  public readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.appName = 'TrainTracker';
    this.environmentName = 'Production';

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'TrainTrackerVPC', {
      maxAzs: 2,
      natGateways: 0, // To save costs, we'll use public subnets
    });

    // Create an ECR repository for the Docker image
    const repository = new ecr.Repository(this, 'TrainTrackerRepo', {
      repositoryName: `${this.appName.toLowerCase()}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a Fargate service with an Application Load Balancer
    this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'TrainTrackerService', {
      vpc,
      memoryLimitMiB: 512,
      cpu: 256,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository), // Use our ECR repository
        environment: {
          NODE_ENV: 'production',
          PORT: '3000',
        },
        containerPort: 3000,
      },
      desiredCount: 1,
      publicLoadBalancer: true,
      assignPublicIp: true,
      healthCheckGracePeriod: cdk.Duration.seconds(120), // Give more time for health checks
    });

    // Add permissions for the task to access other AWS services if needed
    this.service.taskDefinition.taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess')
    );

    // Output the load balancer URL
    new cdk.CfnOutput(this, 'URL', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'The URL of the load balancer',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'RepositoryURI', {
      value: repository.repositoryUri,
      description: 'The URI of the ECR repository',
    });
  }
}
