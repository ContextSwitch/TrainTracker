import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  albSecurityGroup: ec2.SecurityGroup;
  ecsSecurityGroup: ec2.SecurityGroup;
  repository: ecr.Repository;
}

export class EcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'TrainTrackerCluster', {
      vpc: props.vpc,
      clusterName: 'TrainTracker-App-TrainTrackerService'
    });

    // Create task execution role
    const executionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
      ]
    });

    // Create task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
    });

    // Create log group
    const logGroup = new logs.LogGroup(this, 'TrainTrackerLogGroup', {
      logGroupName: '/ecs/traintracker',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK
    });

    // Create task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      family: 'traintracker',
      cpu: 512, // 0.5 vCPU
      memoryLimitMiB: 1024, // 1 GB
      executionRole: executionRole,
      taskRole: taskRole
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('traintracker-container', {
      // Use the image from our ECR repository
      image: ecs.ContainerImage.fromEcrRepository(props.repository),
      essential: true,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'traintracker',
        logGroup: logGroup
      }),
      environment: {
        'NODE_ENV': 'production',
        'PORT': '80'
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(10),
        retries: 5,
        startPeriod: cdk.Duration.seconds(120)
      }
    });

    // Add port mapping to container
    container.addPortMappings({
      containerPort: 80,
      hostPort: 80,
      protocol: ecs.Protocol.TCP
    });

    // Create ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TrainTrackerALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSecurityGroup
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(120),
        timeout: cdk.Duration.seconds(30),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 5,
        healthyHttpCodes: '200-299,302,301'
      }
    });

    // Import existing certificate for chiefjourney.com
    // Note: Replace the ARN below with the actual ARN of your certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      process.env.SSL_CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id'
    );

    // Create HTTP listener with redirect to HTTPS
    const httpListener = alb.addListener('HttpListener', {
      port: 80,
      open: true,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        host: '#{host}',
        path: '/#{path}',
        query: '#{query}',
        permanent: true
      })
    });
    
    // Add a rule to redirect HTTP apex domain directly to HTTPS www subdomain
    new elbv2.ApplicationListenerRule(this, 'HttpRedirectToWwwRule', {
      listener: httpListener,
      priority: 1, // Highest priority
      conditions: [
        elbv2.ListenerCondition.hostHeaders(['chiefjourney.com'])
      ],
      action: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        host: 'www.chiefjourney.com',
        path: '/#{path}',
        query: '#{query}',
        permanent: true
      })
    });
    
    // Override the logical ID to match the existing resource
    const cfnHttpListener = httpListener.node.defaultChild as cdk.CfnResource;
    cfnHttpListener.overrideLogicalId('TrainTrackerALBHttpListener4CBE1E50');

    // Create HTTPS listener with SSL termination
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [certificate],
      open: true,
      defaultTargetGroups: [targetGroup]
    });
    
    // Add a listener rule to redirect apex domain to www subdomain
    new elbv2.ApplicationListenerRule(this, 'RedirectToWwwRule', {
      listener: httpsListener,
      priority: 1, // Highest priority to ensure it's evaluated first
      conditions: [
        elbv2.ListenerCondition.hostHeaders(['chiefjourney.com'])
      ],
      action: elbv2.ListenerAction.redirect({
        host: 'www.chiefjourney.com',
        path: '/#{path}',
        query: '#{query}',
        permanent: true
      })
    });
    
    // Override the logical ID to match the existing resource
    const cfnHttpsListener = httpsListener.node.defaultChild as cdk.CfnResource;
    cfnHttpsListener.overrideLogicalId('TrainTrackerALBHttpsListener5AD44181');

    // Create ECS service
    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: 2, // Updated to 2
      securityGroups: [props.ecsSecurityGroup],
      assignPublicIp: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      circuitBreaker: { rollback: true },
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1
        }
      ],
      minHealthyPercent: 50, // Updated for rolling deployment
      maxHealthyPercent: 150, // Updated for rolling deployment
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS
      }
    });

    // Attach service to target group
    service.attachToApplicationTargetGroup(targetGroup);

    // Output ALB DNS names
    new cdk.CfnOutput(this, 'HttpURL', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'HTTP Application URL'
    });
    
    new cdk.CfnOutput(this, 'HttpsURL', {
      value: `https://${alb.loadBalancerDnsName}`,
      description: 'HTTPS Application URL'
    });
    
    new cdk.CfnOutput(this, 'DomainURL', {
      value: 'https://chiefjourney.com',
      description: 'Domain URL'
    });
  }
}
