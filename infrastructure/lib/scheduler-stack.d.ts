import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface SchedulerStackProps extends cdk.StackProps {
    apiUrl: string;
}
export declare class SchedulerStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: SchedulerStackProps);
}
export {};
