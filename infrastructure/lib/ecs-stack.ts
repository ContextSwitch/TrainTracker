import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environment: string;
  trainStatusTable: dynamodb.Table;
  currentStatusTable: dynamodb.Table;
  assetsBucket: s3.Bucket;
}

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly repository: ecr.Repository;
  
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);
    
    // Create an ECS cluster
    this.cluster = new ecs.Cluster(this, `TrainTrackerCluster-${props.environment}`, {
      vpc: props.vpc,
      containerInsights: true
    });
    
    // Create an ECR repository for the Docker images
    this.repository = new ecr.Repository(this, `TrainTrackerRepo-${props.environment}`, {
      repositoryName: `traintracker-${props.environment}`,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });
    
    // Create a task execution role
    const executionRole = new iam.Role(this, `TaskExecutionRole-${props.environment}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });
    
    // Create a task role with permissions to access DynamoDB and S3
    const taskRole = new iam.Role(this, `TaskRole-${props.environment}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });
    
    // Grant permissions to the task role
    props.trainStatusTable.grantReadWriteData(taskRole);
    props.currentStatusTable.grantReadWriteData(taskRole);
    props.assetsBucket.grantReadWrite(taskRole);
    
    // Create a task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, `TaskDef-${props.environment}`, {
      executionRole,
      taskRole,
      cpu: 512,
      memoryLimitMiB: 1024
    });
    
    // Add container to the task definition
    const container = taskDefinition.addContainer(`TrainTrackerContainer-${props.environment}`, {
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: `traintracker-${props.environment}` }),
      environment: {
        NODE_ENV: props.environment === 'prod' ? 'production' : 'development',
        ENVIRONMENT: props.environment,
        TRAIN_STATUS_TABLE: props.trainStatusTable.tableName,
        CURRENT_STATUS_TABLE: props.currentStatusTable.tableName,
        ASSETS_BUCKET: props.assetsBucket.bucketName
      },
      portMappings: [
        {
          containerPort: 3000,
          hostPort: 3000,
          protocol: ecs.Protocol.TCP
        }
      ]
    });
    
    // Create a security group for the service
    const serviceSecurityGroup = new ec2.SecurityGroup(this, `ServiceSG-${props.environment}`, {
      vpc: props.vpc,
      description: `Security group for TrainTracker ${props.environment} service`,
      allowAllOutbound: true
    });
    
    // Create a security group for the load balancer
    const lbSecurityGroup = new ec2.SecurityGroup(this, `LBSG-${props.environment}`, {
      vpc: props.vpc,
      description: `Security group for TrainTracker ${props.environment} load balancer`,
      allowAllOutbound: true
    });
    
    // Allow inbound traffic from the load balancer to the service
    serviceSecurityGroup.addIngressRule(
      lbSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow inbound traffic from the load balancer'
    );
    
    // Allow inbound HTTP traffic to the load balancer
    lbSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow inbound HTTP traffic'
    );
    
    // Create an Application Load Balancer
    const lb = new elbv2.ApplicationLoadBalancer(this, `ALB-${props.environment}`, {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: lbSecurityGroup
    });
    
    // Create a target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup-${props.environment}`, {
      vpc: props.vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
        healthyHttpCodes: '200'
      }
    });
    
    // Add listener to the load balancer
    const listener = lb.addListener(`Listener-${props.environment}`, {
      port: 80,
      open: true
    });
    
    listener.addTargetGroups(`TargetGroups-${props.environment}`, {
      targetGroups: [targetGroup]
    });
    
    // Create the ECS service
    this.service = new ecs.FargateService(this, `Service-${props.environment}`, {
      cluster: this.cluster,
      taskDefinition,
      desiredCount: props.environment === 'prod' ? 2 : 1,
      securityGroups: [serviceSecurityGroup],
      assignPublicIp: false,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });
    
    // Add the service as a target to the target group
    this.service.attachToApplicationTargetGroup(targetGroup);
    
    // Output the load balancer DNS name
    new cdk.CfnOutput(this, `LoadBalancerDNS-${props.environment}`, {
      value: lb.loadBalancerDnsName,
      description: `The DNS name of the load balancer for ${props.environment}`
    });
    
    // Output the repository URI
    new cdk.CfnOutput(this, `RepositoryURI-${props.environment}`, {
      value: this.repository.repositoryUri,
      description: `The URI of the ECR repository for ${props.environment}`
    });
  }
}
