import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  environment: string;
}

export class StorageStack extends cdk.Stack {
  public readonly assetsBucket: s3.Bucket;
  
  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);
    
    // Create an S3 bucket for static assets
    this.assetsBucket = new s3.Bucket(this, `TrainTrackerAssets-${props.environment}`, {
      bucketName: `traintracker-assets-${props.environment}-${cdk.Stack.of(this).account}`,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: props.environment === 'prod' 
        ? false 
        : true
    });
    
    // Output the bucket name
    new cdk.CfnOutput(this, `AssetsBucketName-${props.environment}`, {
      value: this.assetsBucket.bucketName,
      description: `The name of the assets bucket for ${props.environment}`
    });
  }
}
