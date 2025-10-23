import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
export declare class StorageStack extends cdk.Stack {
    readonly repository: ecr.Repository;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
