"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EcsStack = void 0;
const cdk = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ecs = require("aws-cdk-lib/aws-ecs");
const elbv2 = require("aws-cdk-lib/aws-elasticloadbalancingv2");
const logs = require("aws-cdk-lib/aws-logs");
const iam = require("aws-cdk-lib/aws-iam");
const acm = require("aws-cdk-lib/aws-certificatemanager");
class EcsStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', process.env.SSL_CERTIFICATE_ARN || 'arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id');
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
        const cfnHttpListener = httpListener.node.defaultChild;
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
        const cfnHttpsListener = httpsListener.node.defaultChild;
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
exports.EcsStack = EcsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWNzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWNzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBRTNDLGdFQUFnRTtBQUNoRSw2Q0FBNkM7QUFDN0MsMkNBQTJDO0FBQzNDLDBEQUEwRDtBQVMxRCxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHFCQUFxQjtRQUNyQixNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQzNELEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRztZQUNkLFdBQVcsRUFBRSxzQ0FBc0M7U0FDcEQsQ0FBQyxDQUFDO1FBRUgsNkJBQTZCO1FBQzdCLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDNUQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHlCQUF5QixDQUFDO1lBQzlELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLCtDQUErQyxDQUFDO2FBQzVGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsbUJBQW1CO1FBQ25CLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzlDLFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyx5QkFBeUIsQ0FBQztTQUMvRCxDQUFDLENBQUM7UUFFSCxtQkFBbUI7UUFDbkIsTUFBTSxRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElB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RSxJQUFJO1lBQ3BCLFVBQVUsRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRTtZQUNqRCxjQUFjLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1lBQ2xDLDBCQUEwQixFQUFFO2dCQUMxQjtvQkFDRSxnQkFBZ0IsRUFBRSxjQUFjO29CQUNoQyxNQUFNLEVBQUUsQ0FBQztpQkFDVjthQUNGO1lBQ0QsaUJBQWlCLEVBQUUsRUFBRSxFQUFFLGlDQUFpQztZQUN4RCxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsaUNBQWlDO1lBQ3pELG9CQUFvQixFQUFFO2dCQUNwQixJQUFJLEVBQUUsR0FBRyxDQUFDLHdCQUF3QixDQUFDLEdBQUc7YUFDdkM7U0FDRixDQUFDLENBQUM7UUFFSCxpQ0FBaUM7UUFDakMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBELHVCQUF1QjtRQUN2QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRTtZQUNqQyxLQUFLLEVBQUUsVUFBVSxHQUFHLENBQUMsbUJBQW1CLEVBQUU7WUFDMUMsV0FBVyxFQUFFLHNCQUFzQjtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRTtZQUNsQyxLQUFLLEVBQUUsV0FBVyxHQUFHLENBQUMsbUJBQW1CLEVBQUU7WUFDM0MsV0FBVyxFQUFFLHVCQUF1QjtTQUNyQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUNuQyxLQUFLLEVBQUUsMEJBQTBCO1lBQ2pDLFdBQVcsRUFBRSxZQUFZO1NBQzFCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNNRCw0QkEyTUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBlY3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcyc7XG5pbXBvcnQgKiBhcyBlY3IgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjcic7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIGFjbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2VydGlmaWNhdGVtYW5hZ2VyJztcblxuaW50ZXJmYWNlIEVjc1N0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIHZwYzogZWMyLlZwYztcbiAgYWxiU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG4gIGVjc1NlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuICByZXBvc2l0b3J5OiBlY3IuUmVwb3NpdG9yeTtcbn1cblxuZXhwb3J0IGNsYXNzIEVjc1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEVjc1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBFQ1MgY2x1c3RlclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBuZXcgZWNzLkNsdXN0ZXIodGhpcywgJ1RyYWluVHJhY2tlckNsdXN0ZXInLCB7XG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGNsdXN0ZXJOYW1lOiAnVHJhaW5UcmFja2VyLUFwcC1UcmFpblRyYWNrZXJTZXJ2aWNlJ1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRhc2sgZXhlY3V0aW9uIHJvbGVcbiAgICBjb25zdCBleGVjdXRpb25Sb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdUYXNrRXhlY3V0aW9uUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlY3MtdGFza3MuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FtYXpvbkVDU1Rhc2tFeGVjdXRpb25Sb2xlUG9saWN5JylcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSB0YXNrIHJvbGVcbiAgICBjb25zdCB0YXNrUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnVGFza1JvbGUnLCB7XG4gICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZWNzLXRhc2tzLmFtYXpvbmF3cy5jb20nKVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxvZyBncm91cFxuICAgIGNvbnN0IGxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ1RyYWluVHJhY2tlckxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiAnL2Vjcy90cmFpbnRyYWNrZXInLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgdGFzayBkZWZpbml0aW9uXG4gICAgY29uc3QgdGFza0RlZmluaXRpb24gPSBuZXcgZWNzLkZhcmdhdGVUYXNrRGVmaW5pdGlvbih0aGlzLCAnVGFza0RlZmluaXRpb24nLCB7XG4gICAgICBmYW1pbHk6ICd0cmFpbnRyYWNrZXInLFxuICAgICAgY3B1OiA1MTIsIC8vIDAuNSB2Q1BVXG4gICAgICBtZW1vcnlMaW1pdE1pQjogMTAyNCwgLy8gMSBHQlxuICAgICAgZXhlY3V0aW9uUm9sZTogZXhlY3V0aW9uUm9sZSxcbiAgICAgIHRhc2tSb2xlOiB0YXNrUm9sZVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGNvbnRhaW5lciB0byB0YXNrIGRlZmluaXRpb25cbiAgICBjb25zdCBjb250YWluZXIgPSB0YXNrRGVmaW5pdGlvbi5hZGRDb250YWluZXIoJ3RyYWludHJhY2tlci1jb250YWluZXInLCB7XG4gICAgICAvLyBVc2UgdGhlIGltYWdlIGZyb20gb3VyIEVDUiByZXBvc2l0b3J5XG4gICAgICBpbWFnZTogZWNzLkNvbnRhaW5lckltYWdlLmZyb21FY3JSZXBvc2l0b3J5KHByb3BzLnJlcG9zaXRvcnkpLFxuICAgICAgZXNzZW50aWFsOiB0cnVlLFxuICAgICAgbG9nZ2luZzogZWNzLkxvZ0RyaXZlcnMuYXdzTG9ncyh7XG4gICAgICAgIHN0cmVhbVByZWZpeDogJ3RyYWludHJhY2tlcicsXG4gICAgICAgIGxvZ0dyb3VwOiBsb2dHcm91cFxuICAgICAgfSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICAnTk9ERV9FTlYnOiAncHJvZHVjdGlvbicsXG4gICAgICAgICdQT1JUJzogJzgwJ1xuICAgICAgfSxcbiAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgIGNvbW1hbmQ6IFsnQ01ELVNIRUxMJywgJ2N1cmwgLWYgaHR0cDovL2xvY2FsaG9zdC8gfHwgZXhpdCAxJ10sXG4gICAgICAgIGludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICAgIHRpbWVvdXQ6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEwKSxcbiAgICAgICAgcmV0cmllczogNSxcbiAgICAgICAgc3RhcnRQZXJpb2Q6IGNkay5EdXJhdGlvbi5zZWNvbmRzKDEyMClcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEFkZCBwb3J0IG1hcHBpbmcgdG8gY29udGFpbmVyXG4gICAgY29udGFpbmVyLmFkZFBvcnRNYXBwaW5ncyh7XG4gICAgICBjb250YWluZXJQb3J0OiA4MCxcbiAgICAgIGhvc3RQb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlY3MuUHJvdG9jb2wuVENQXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgQUxCXG4gICAgY29uc3QgYWxiID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uTG9hZEJhbGFuY2VyKHRoaXMsICdUcmFpblRyYWNrZXJBTEInLCB7XG4gICAgICB2cGM6IHByb3BzLnZwYyxcbiAgICAgIGludGVybmV0RmFjaW5nOiB0cnVlLFxuICAgICAgc2VjdXJpdHlHcm91cDogcHJvcHMuYWxiU2VjdXJpdHlHcm91cFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRhcmdldCBncm91cFxuICAgIGNvbnN0IHRhcmdldEdyb3VwID0gbmV3IGVsYnYyLkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAodGhpcywgJ1RhcmdldEdyb3VwJywge1xuICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICBwb3J0OiA4MCxcbiAgICAgIHByb3RvY29sOiBlbGJ2Mi5BcHBsaWNhdGlvblByb3RvY29sLkhUVFAsXG4gICAgICB0YXJnZXRUeXBlOiBlbGJ2Mi5UYXJnZXRUeXBlLklQLFxuICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICBpbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMTIwKSxcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoMzApLFxuICAgICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IDIsXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiA1LFxuICAgICAgICBoZWFsdGh5SHR0cENvZGVzOiAnMjAwLTI5OSwzMDIsMzAxJ1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSW1wb3J0IGV4aXN0aW5nIGNlcnRpZmljYXRlIGZvciBjaGllZmpvdXJuZXkuY29tXG4gICAgLy8gTm90ZTogUmVwbGFjZSB0aGUgQVJOIGJlbG93IHdpdGggdGhlIGFjdHVhbCBBUk4gb2YgeW91ciBjZXJ0aWZpY2F0ZVxuICAgIGNvbnN0IGNlcnRpZmljYXRlID0gYWNtLkNlcnRpZmljYXRlLmZyb21DZXJ0aWZpY2F0ZUFybihcbiAgICAgIHRoaXMsXG4gICAgICAnQ2VydGlmaWNhdGUnLFxuICAgICAgcHJvY2Vzcy5lbnYuU1NMX0NFUlRJRklDQVRFX0FSTiB8fCAnYXJuOmF3czphY206dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpjZXJ0aWZpY2F0ZS95b3VyLWNlcnRpZmljYXRlLWlkJ1xuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSFRUUCBsaXN0ZW5lciB3aXRoIHJlZGlyZWN0IHRvIEhUVFBTXG4gICAgY29uc3QgaHR0cExpc3RlbmVyID0gYWxiLmFkZExpc3RlbmVyKCdIdHRwTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA4MCxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICBkZWZhdWx0QWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi5yZWRpcmVjdCh7XG4gICAgICAgIHByb3RvY29sOiAnSFRUUFMnLFxuICAgICAgICBwb3J0OiAnNDQzJyxcbiAgICAgICAgaG9zdDogJyN7aG9zdH0nLFxuICAgICAgICBwYXRoOiAnLyN7cGF0aH0nLFxuICAgICAgICBxdWVyeTogJyN7cXVlcnl9JyxcbiAgICAgICAgcGVybWFuZW50OiB0cnVlXG4gICAgICB9KVxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFkZCBhIHJ1bGUgdG8gcmVkaXJlY3QgSFRUUCBhcGV4IGRvbWFpbiBkaXJlY3RseSB0byBIVFRQUyB3d3cgc3ViZG9tYWluXG4gICAgbmV3IGVsYnYyLkFwcGxpY2F0aW9uTGlzdGVuZXJSdWxlKHRoaXMsICdIdHRwUmVkaXJlY3RUb1d3d1J1bGUnLCB7XG4gICAgICBsaXN0ZW5lcjogaHR0cExpc3RlbmVyLFxuICAgICAgcHJpb3JpdHk6IDEsIC8vIEhpZ2hlc3QgcHJpb3JpdHlcbiAgICAgIGNvbmRpdGlvbnM6IFtcbiAgICAgICAgZWxidjIuTGlzdGVuZXJDb25kaXRpb24uaG9zdEhlYWRlcnMoWydjaGllZmpvdXJuZXkuY29tJ10pXG4gICAgICBdLFxuICAgICAgYWN0aW9uOiBlbGJ2Mi5MaXN0ZW5lckFjdGlvbi5yZWRpcmVjdCh7XG4gICAgICAgIHByb3RvY29sOiAnSFRUUFMnLFxuICAgICAgICBwb3J0OiAnNDQzJyxcbiAgICAgICAgaG9zdDogJ3d3dy5jaGllZmpvdXJuZXkuY29tJyxcbiAgICAgICAgcGF0aDogJy8je3BhdGh9JyxcbiAgICAgICAgcXVlcnk6ICcje3F1ZXJ5fScsXG4gICAgICAgIHBlcm1hbmVudDogdHJ1ZVxuICAgICAgfSlcbiAgICB9KTtcbiAgICBcbiAgICAvLyBPdmVycmlkZSB0aGUgbG9naWNhbCBJRCB0byBtYXRjaCB0aGUgZXhpc3RpbmcgcmVzb3VyY2VcbiAgICBjb25zdCBjZm5IdHRwTGlzdGVuZXIgPSBodHRwTGlzdGVuZXIubm9kZS5kZWZhdWx0Q2hpbGQgYXMgY2RrLkNmblJlc291cmNlO1xuICAgIGNmbkh0dHBMaXN0ZW5lci5vdmVycmlkZUxvZ2ljYWxJZCgnVHJhaW5UcmFja2VyQUxCSHR0cExpc3RlbmVyNENCRTFFNTAnKTtcblxuICAgIC8vIENyZWF0ZSBIVFRQUyBsaXN0ZW5lciB3aXRoIFNTTCB0ZXJtaW5hdGlvblxuICAgIGNvbnN0IGh0dHBzTGlzdGVuZXIgPSBhbGIuYWRkTGlzdGVuZXIoJ0h0dHBzTGlzdGVuZXInLCB7XG4gICAgICBwb3J0OiA0NDMsXG4gICAgICBwcm90b2NvbDogZWxidjIuQXBwbGljYXRpb25Qcm90b2NvbC5IVFRQUyxcbiAgICAgIGNlcnRpZmljYXRlczogW2NlcnRpZmljYXRlXSxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICBkZWZhdWx0VGFyZ2V0R3JvdXBzOiBbdGFyZ2V0R3JvdXBdXG4gICAgfSk7XG4gICAgXG4gICAgLy8gQWRkIGEgbGlzdGVuZXIgcnVsZSB0byByZWRpcmVjdCBhcGV4IGRvbWFpbiB0byB3d3cgc3ViZG9tYWluXG4gICAgbmV3IGVsYnYyLkFwcGxpY2F0aW9uTGlzdGVuZXJSdWxlKHRoaXMsICdSZWRpcmVjdFRvV3d3UnVsZScsIHtcbiAgICAgIGxpc3RlbmVyOiBodHRwc0xpc3RlbmVyLFxuICAgICAgcHJpb3JpdHk6IDEsIC8vIEhpZ2hlc3QgcHJpb3JpdHkgdG8gZW5zdXJlIGl0J3MgZXZhbHVhdGVkIGZpcnN0XG4gICAgICBjb25kaXRpb25zOiBbXG4gICAgICAgIGVsYnYyLkxpc3RlbmVyQ29uZGl0aW9uLmhvc3RIZWFkZXJzKFsnY2hpZWZqb3VybmV5LmNvbSddKVxuICAgICAgXSxcbiAgICAgIGFjdGlvbjogZWxidjIuTGlzdGVuZXJBY3Rpb24ucmVkaXJlY3Qoe1xuICAgICAgICBob3N0OiAnd3d3LmNoaWVmam91cm5leS5jb20nLFxuICAgICAgICBwYXRoOiAnLyN7cGF0aH0nLFxuICAgICAgICBxdWVyeTogJyN7cXVlcnl9JyxcbiAgICAgICAgcGVybWFuZW50OiB0cnVlXG4gICAgICB9KVxuICAgIH0pO1xuICAgIFxuICAgIC8vIE92ZXJyaWRlIHRoZSBsb2dpY2FsIElEIHRvIG1hdGNoIHRoZSBleGlzdGluZyByZXNvdXJjZVxuICAgIGNvbnN0IGNmbkh0dHBzTGlzdGVuZXIgPSBodHRwc0xpc3RlbmVyLm5vZGUuZGVmYXVsdENoaWxkIGFzIGNkay5DZm5SZXNvdXJjZTtcbiAgICBjZm5IdHRwc0xpc3RlbmVyLm92ZXJyaWRlTG9naWNhbElkKCdUcmFpblRyYWNrZXJBTEJIdHRwc0xpc3RlbmVyNUFENDQxODEnKTtcblxuICAgIC8vIENyZWF0ZSBFQ1Mgc2VydmljZVxuICAgIGNvbnN0IHNlcnZpY2UgPSBuZXcgZWNzLkZhcmdhdGVTZXJ2aWNlKHRoaXMsICdTZXJ2aWNlJywge1xuICAgICAgY2x1c3RlcixcbiAgICAgIHRhc2tEZWZpbml0aW9uLFxuICAgICAgZGVzaXJlZENvdW50OiAyLCAvLyBVcGRhdGVkIHRvIDJcbiAgICAgIHNlY3VyaXR5R3JvdXBzOiBbcHJvcHMuZWNzU2VjdXJpdHlHcm91cF0sXG4gICAgICBhc3NpZ25QdWJsaWNJcDogdHJ1ZSxcbiAgICAgIHZwY1N1Ym5ldHM6IHsgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDIH0sXG4gICAgICBjaXJjdWl0QnJlYWtlcjogeyByb2xsYmFjazogdHJ1ZSB9LFxuICAgICAgY2FwYWNpdHlQcm92aWRlclN0cmF0ZWdpZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGNhcGFjaXR5UHJvdmlkZXI6ICdGQVJHQVRFX1NQT1QnLFxuICAgICAgICAgIHdlaWdodDogMVxuICAgICAgICB9XG4gICAgICBdLFxuICAgICAgbWluSGVhbHRoeVBlcmNlbnQ6IDUwLCAvLyBVcGRhdGVkIGZvciByb2xsaW5nIGRlcGxveW1lbnRcbiAgICAgIG1heEhlYWx0aHlQZXJjZW50OiAxNTAsIC8vIFVwZGF0ZWQgZm9yIHJvbGxpbmcgZGVwbG95bWVudFxuICAgICAgZGVwbG95bWVudENvbnRyb2xsZXI6IHtcbiAgICAgICAgdHlwZTogZWNzLkRlcGxveW1lbnRDb250cm9sbGVyVHlwZS5FQ1NcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEF0dGFjaCBzZXJ2aWNlIHRvIHRhcmdldCBncm91cFxuICAgIHNlcnZpY2UuYXR0YWNoVG9BcHBsaWNhdGlvblRhcmdldEdyb3VwKHRhcmdldEdyb3VwKTtcblxuICAgIC8vIE91dHB1dCBBTEIgRE5TIG5hbWVzXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0h0dHBVUkwnLCB7XG4gICAgICB2YWx1ZTogYGh0dHA6Ly8ke2FsYi5sb2FkQmFsYW5jZXJEbnNOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0hUVFAgQXBwbGljYXRpb24gVVJMJ1xuICAgIH0pO1xuICAgIFxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIdHRwc1VSTCcsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2FsYi5sb2FkQmFsYW5jZXJEbnNOYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogJ0hUVFBTIEFwcGxpY2F0aW9uIFVSTCdcbiAgICB9KTtcbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRG9tYWluVVJMJywge1xuICAgICAgdmFsdWU6ICdodHRwczovL2NoaWVmam91cm5leS5jb20nLFxuICAgICAgZGVzY3JpcHRpb246ICdEb21haW4gVVJMJ1xuICAgIH0pO1xuICB9XG59XG4iXX0=