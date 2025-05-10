import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environment: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly trainStatusTable: dynamodb.Table;
  public readonly currentStatusTable: dynamodb.Table;
  
  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);
    
    // Create a DynamoDB table for train status data
    this.trainStatusTable = new dynamodb.Table(this, `TrainStatusTable-${props.environment}`, {
      tableName: `TrainTracker-TrainStatus-${props.environment}`,
      partitionKey: { name: 'trainId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'instanceId', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });
    
    // Create a DynamoDB table for current status data
    this.currentStatusTable = new dynamodb.Table(this, `CurrentStatusTable-${props.environment}`, {
      tableName: `TrainTracker-CurrentStatus-${props.environment}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.environment === 'prod' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY
    });
    
    // Output the table names
    new cdk.CfnOutput(this, `TrainStatusTableName-${props.environment}`, {
      value: this.trainStatusTable.tableName,
      description: `The name of the train status table for ${props.environment}`
    });
    
    new cdk.CfnOutput(this, `CurrentStatusTableName-${props.environment}`, {
      value: this.currentStatusTable.tableName,
      description: `The name of the current status table for ${props.environment}`
    });
  }
}
