import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class DevStack extends cdk.Stack {
  public readonly appName: string;
  public readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.appName = 'TrainTracker-Dev';

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: 0, // Save costs in dev environment
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Create an ECR Repository
    this.ecrRepository = new ecr.Repository(this, 'Repository', {
      repositoryName: `${this.appName.toLowerCase()}-repo`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev environment, we can destroy the repo
      autoDeleteImages: true, // Auto delete images when the repo is deleted
    });

    // Create a Fargate Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${this.appName}-Cluster`,
    });

    // Create a Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Add permissions to the task role
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
    );

    // Create a Log Group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/ecs/${this.appName}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK, // Shorter retention for dev
    });

    // Create a Fargate Service with an Application Load Balancer
    this.service = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      serviceName: `${this.appName}-Service`,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // Placeholder image
        containerName: 'web',
        containerPort: 3000,
        taskRole,
        logDriver: ecs.LogDrivers.awsLogs({
          logGroup,
          streamPrefix: 'ecs',
        }),
        environment: {
          NODE_ENV: 'development',
          PORT: '3000',
        },
      },
      desiredCount: 1, // Only 1 instance for dev
      cpu: 256, // 0.25 vCPU
      memoryLimitMiB: 512, // 0.5 GB
      publicLoadBalancer: true,
    });

    // Add health check to the target group
    this.service.targetGroup.configureHealthCheck({
      path: '/',
      interval: cdk.Duration.seconds(60),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    // Output the URL of the load balancer
    new cdk.CfnOutput(this, 'URL', {
      value: this.service.loadBalancer.loadBalancerDnsName,
      description: 'The URL of the load balancer',
    });

    // Output the ECR repository URI
    new cdk.CfnOutput(this, 'RepositoryURI', {
      value: this.ecrRepository.repositoryUri,
      description: 'The URI of the ECR repository',
    });
  }
}
