import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with 2 public and 2 private subnets
    this.vpc = new ec2.Vpc(this, 'TrainTrackerVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ]
    });

    // Create security group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true
    });

    // Allow HTTP and HTTPS traffic to ALB
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create security group for ECS
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS',
      allowAllOutbound: true
    });

    // Allow traffic from ALB to ECS on port 80
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB to port 80'
    );
    
    // Allow traffic from ALB to ECS on port 3000 (for Node.js apps)
    this.ecsSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB to port 3000'
    );
    
    // Allow outbound HTTPS traffic for container to access external services
    this.ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS traffic'
    );
    
    // Allow outbound HTTP traffic for container to access external services
    this.ecsSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP traffic'
    );

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID'
    });
  }
}
