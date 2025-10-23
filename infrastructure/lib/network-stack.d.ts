import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
export declare class NetworkStack extends cdk.Stack {
    readonly vpc: ec2.Vpc;
    readonly albSecurityGroup: ec2.SecurityGroup;
    readonly ecsSecurityGroup: ec2.SecurityGroup;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
