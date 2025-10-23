import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

interface SchedulerStackProps extends cdk.StackProps {
  apiUrl: string; // The URL of the API to call
}

export class SchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SchedulerStackProps) {
    super(scope, id, props);

    // Create log group for Lambda
    const logGroup = new logs.LogGroup(this, 'CronLambdaLogGroup', {
      logGroupName: '/aws/lambda/traintracker-cron-lambda',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK
    });

    // Create IAM role for Lambda with ECS permissions
    const lambdaRole = new iam.Role(this, 'CronLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ]
    });
    
    // Add ECS permissions to the role
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecs:UpdateService',
        'ecs:DescribeServices',
        'ecs:DescribeClusters'
      ],
      resources: ['*']
    }));

    // Create Lambda function
    const cronLambda = new lambda.Function(this, 'CronLambda', {
      functionName: 'traintracker-cron-lambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: lambdaRole,
      code: lambda.Code.fromInline(`
        const https = require('https');
        const http = require('http');
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          console.log('TrainTracker cron job started');
          
          const apiUrl = process.env.API_URL;
          const clusterName = process.env.ECS_CLUSTER_NAME;
          const serviceName = process.env.ECS_SERVICE_NAME;
          
          console.log(\`Calling API URL: \${apiUrl}\`);
          
          try {
            // Determine if we should use http or https
            const client = apiUrl.startsWith('https') ? https : http;
            
            // Make the request to the API
            const response = await new Promise((resolve, reject) => {
              const req = client.get(apiUrl, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                  data += chunk;
                });
                
                res.on('end', () => {
                  resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                  });
                });
              });
              
              req.on('error', (error) => {
                reject(error);
              });
              
              req.end();
            });
            
            console.log('API response:', response);
            
            // If ECS cluster name is provided, discover and refresh the service
            if (clusterName) {
              console.log(\`Discovering services in cluster: \${clusterName}\`);
              
              try {
                const ecs = new AWS.ECS();
                
                // List services in the cluster
                const listServicesResponse = await ecs.listServices({
                  cluster: clusterName
                }).promise();
                
                if (listServicesResponse.serviceArns && listServicesResponse.serviceArns.length > 0) {
                  // Get the first service ARN
                  const serviceArn = listServicesResponse.serviceArns[0];
                  const serviceName = serviceArn.split('/').pop();
                  
                  console.log(\`Found service: \${serviceName}\`);
                  console.log(\`Refreshing ECS service: \${serviceName} in cluster: \${clusterName}\`);
                  
                  // Force a new deployment of the service
                  const updateResponse = await ecs.updateService({
                    cluster: clusterName,
                    service: serviceName,
                    forceNewDeployment: true
                  }).promise();
                  
                  console.log('ECS service refresh initiated successfully:', updateResponse);
                } else {
                  console.log('No services found in the cluster');
                }
              } catch (ecsError) {
                console.error('Error refreshing ECS service:', ecsError);
                // Continue execution even if ECS refresh fails
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Cron job executed successfully' })
            };
          } catch (error) {
            console.error('Error calling API:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Error executing cron job', error: error.message })
            };
          }
        };
      `),
      timeout: cdk.Duration.seconds(60), // Increased timeout to allow for ECS API call
      memorySize: 128,
      environment: {
        API_URL: props.apiUrl,
        ECS_CLUSTER_NAME: 'TrainTracker-App-TrainTrackerService'
      },
      logGroup: logGroup
    });

    // Create EventBridge rule to trigger Lambda every 10 minutes
    const rule = new events.Rule(this, 'CronRule', {
      ruleName: 'traintracker-cron-rule',
      schedule: events.Schedule.expression('rate(10 minutes)'),
      description: 'Rule to trigger TrainTracker cron job every 10 minutes'
    });

    // Add Lambda as target for the rule
    rule.addTarget(new targets.LambdaFunction(cronLambda));

    // Output the Lambda function name and rule name
    new cdk.CfnOutput(this, 'LambdaName', {
      value: cronLambda.functionName,
      description: 'Name of the Lambda function'
    });

    new cdk.CfnOutput(this, 'RuleName', {
      value: rule.ruleName,
      description: 'Name of the EventBridge rule'
    });
  }
}
