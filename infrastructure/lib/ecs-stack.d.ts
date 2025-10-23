import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc;
    albSecurityGroup: ec2.SecurityGroup;
    ecsSecurityGroup: ec2.SecurityGroup;
    repository: ecr.Repository;
}
export declare class EcsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: EcsStackProps);
}
export {};
