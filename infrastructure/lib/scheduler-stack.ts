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

    // Create Lambda function
    const cronLambda = new lambda.Function(this, 'CronLambda', {
      functionName: 'traintracker-cron-lambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const https = require('https');
        const http = require('http');

        exports.handler = async (event) => {
          console.log('TrainTracker cron job started');
          
          const apiUrl = process.env.API_URL;
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
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        API_URL: props.apiUrl
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
