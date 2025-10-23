"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerStack = void 0;
const cdk = require("aws-cdk-lib");
const lambda = require("aws-cdk-lib/aws-lambda");
const events = require("aws-cdk-lib/aws-events");
const targets = require("aws-cdk-lib/aws-events-targets");
const iam = require("aws-cdk-lib/aws-iam");
const logs = require("aws-cdk-lib/aws-logs");
class SchedulerStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.SchedulerStack = SchedulerStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NoZWR1bGVyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NoZWR1bGVyLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFtQztBQUVuQyxpREFBaUQ7QUFDakQsaURBQWlEO0FBQ2pELDBEQUEwRDtBQUMxRCwyQ0FBMkM7QUFDM0MsNkNBQTZDO0FBTTdDLE1BQWEsY0FBZSxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBQzNDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBMEI7UUFDbEUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsOEJBQThCO1FBQzlCLE1BQU0sUUFBUSxHQUFHLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsWUFBWSxFQUFFLHNDQUFzQztZQUNwRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7U0FDdkMsQ0FBQyxDQUFDO1FBRUgsa0RBQWtEO1FBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZ0JBQWdCLEVBQUU7WUFDdEQsU0FBUyxFQUFFLElBQUksR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDO1lBQzNELGVBQWUsRUFBRTtnQkFDZixHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLDBDQUEwQyxDQUFDO2FBQ3ZGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsa0NBQWtDO1FBQ2xDLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQzdDLE9BQU8sRUFBRTtnQkFDUCxtQkFBbUI7Z0JBQ25CLHNCQUFzQjtnQkFDdEIsc0JBQXNCO2FBQ3ZCO1lBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ2pCLENBQUMsQ0FBQyxDQUFDO1FBRUoseUJBQXlCO1FBQ3pCLE1BQU0sVUFBVSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3pELFlBQVksRUFBRSwwQkFBMEI7WUFDeEMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVztZQUNuQyxPQUFPLEVBQUUsZUFBZTtZQUN4QixJQUFJLEVBQUUsVUFBVTtZQUNoQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E4RjVCLENBQUM7WUFDRixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsOENBQThDO1lBQ2pGLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxLQUFLLENBQUMsTUFBTTtnQkFDckIsZ0JBQWdCLEVBQUUsc0NBQXNDO2FBQ3pEO1lBQ0QsUUFBUSxFQUFFLFFBQVE7U0FDbkIsQ0FBQyxDQUFDO1FBRUgsNkRBQTZEO1FBQzdELE1BQU0sSUFBSSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQzdDLFFBQVEsRUFBRSx3QkFBd0I7WUFDbEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDO1lBQ3hELFdBQVcsRUFBRSx3REFBd0Q7U0FDdEUsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFFdkQsZ0RBQWdEO1FBQ2hELElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO1lBQ3BDLEtBQUssRUFBRSxVQUFVLENBQUMsWUFBWTtZQUM5QixXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFO1lBQ2xDLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUTtZQUNwQixXQUFXLEVBQUUsOEJBQThCO1NBQzVDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhLRCx3Q0FnS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgKiBhcyBldmVudHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XG5pbXBvcnQgKiBhcyB0YXJnZXRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcblxuaW50ZXJmYWNlIFNjaGVkdWxlclN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGFwaVVybDogc3RyaW5nOyAvLyBUaGUgVVJMIG9mIHRoZSBBUEkgdG8gY2FsbFxufVxuXG5leHBvcnQgY2xhc3MgU2NoZWR1bGVyU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogU2NoZWR1bGVyU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIGxvZyBncm91cCBmb3IgTGFtYmRhXG4gICAgY29uc3QgbG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQ3JvbkxhbWJkYUxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiAnL2F3cy9sYW1iZGEvdHJhaW50cmFja2VyLWNyb24tbGFtYmRhJyxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFS1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBMYW1iZGEgd2l0aCBFQ1MgcGVybWlzc2lvbnNcbiAgICBjb25zdCBsYW1iZGFSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdDcm9uTGFtYmRhUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdsYW1iZGEuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnc2VydmljZS1yb2xlL0FXU0xhbWJkYUJhc2ljRXhlY3V0aW9uUm9sZScpXG4gICAgICBdXG4gICAgfSk7XG4gICAgXG4gICAgLy8gQWRkIEVDUyBwZXJtaXNzaW9ucyB0byB0aGUgcm9sZVxuICAgIGxhbWJkYVJvbGUuYWRkVG9Qb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnZWNzOlVwZGF0ZVNlcnZpY2UnLFxuICAgICAgICAnZWNzOkRlc2NyaWJlU2VydmljZXMnLFxuICAgICAgICAnZWNzOkRlc2NyaWJlQ2x1c3RlcnMnXG4gICAgICBdLFxuICAgICAgcmVzb3VyY2VzOiBbJyonXVxuICAgIH0pKTtcblxuICAgIC8vIENyZWF0ZSBMYW1iZGEgZnVuY3Rpb25cbiAgICBjb25zdCBjcm9uTGFtYmRhID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCAnQ3JvbkxhbWJkYScsIHtcbiAgICAgIGZ1bmN0aW9uTmFtZTogJ3RyYWludHJhY2tlci1jcm9uLWxhbWJkYScsXG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgIHJvbGU6IGxhbWJkYVJvbGUsXG4gICAgICBjb2RlOiBsYW1iZGEuQ29kZS5mcm9tSW5saW5lKGBcbiAgICAgICAgY29uc3QgaHR0cHMgPSByZXF1aXJlKCdodHRwcycpO1xuICAgICAgICBjb25zdCBodHRwID0gcmVxdWlyZSgnaHR0cCcpO1xuICAgICAgICBjb25zdCBBV1MgPSByZXF1aXJlKCdhd3Mtc2RrJyk7XG4gICAgICAgIFxuICAgICAgICBleHBvcnRzLmhhbmRsZXIgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnVHJhaW5UcmFja2VyIGNyb24gam9iIHN0YXJ0ZWQnKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBhcGlVcmwgPSBwcm9jZXNzLmVudi5BUElfVVJMO1xuICAgICAgICAgIGNvbnN0IGNsdXN0ZXJOYW1lID0gcHJvY2Vzcy5lbnYuRUNTX0NMVVNURVJfTkFNRTtcbiAgICAgICAgICBjb25zdCBzZXJ2aWNlTmFtZSA9IHByb2Nlc3MuZW52LkVDU19TRVJWSUNFX05BTUU7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc29sZS5sb2coXFxgQ2FsbGluZyBBUEkgVVJMOiBcXCR7YXBpVXJsfVxcYCk7XG4gICAgICAgICAgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIERldGVybWluZSBpZiB3ZSBzaG91bGQgdXNlIGh0dHAgb3IgaHR0cHNcbiAgICAgICAgICAgIGNvbnN0IGNsaWVudCA9IGFwaVVybC5zdGFydHNXaXRoKCdodHRwcycpID8gaHR0cHMgOiBodHRwO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBNYWtlIHRoZSByZXF1ZXN0IHRvIHRoZSBBUElcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCByZXEgPSBjbGllbnQuZ2V0KGFwaVVybCwgKHJlcykgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBkYXRhID0gJyc7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgcmVzLm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XG4gICAgICAgICAgICAgICAgICBkYXRhICs9IGNodW5rO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIHJlcy5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6IHJlcy5zdGF0dXNDb2RlLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiByZXMuaGVhZGVycyxcbiAgICAgICAgICAgICAgICAgICAgYm9keTogZGF0YVxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgcmVxLm9uKCdlcnJvcicsIChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgcmVxLmVuZCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBUEkgcmVzcG9uc2U6JywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBJZiBFQ1MgY2x1c3RlciBuYW1lIGlzIHByb3ZpZGVkLCBkaXNjb3ZlciBhbmQgcmVmcmVzaCB0aGUgc2VydmljZVxuICAgICAgICAgICAgaWYgKGNsdXN0ZXJOYW1lKSB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxcYERpc2NvdmVyaW5nIHNlcnZpY2VzIGluIGNsdXN0ZXI6IFxcJHtjbHVzdGVyTmFtZX1cXGApO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlY3MgPSBuZXcgQVdTLkVDUygpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vIExpc3Qgc2VydmljZXMgaW4gdGhlIGNsdXN0ZXJcbiAgICAgICAgICAgICAgICBjb25zdCBsaXN0U2VydmljZXNSZXNwb25zZSA9IGF3YWl0IGVjcy5saXN0U2VydmljZXMoe1xuICAgICAgICAgICAgICAgICAgY2x1c3RlcjogY2x1c3Rlck5hbWVcbiAgICAgICAgICAgICAgICB9KS5wcm9taXNlKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxpc3RTZXJ2aWNlc1Jlc3BvbnNlLnNlcnZpY2VBcm5zICYmIGxpc3RTZXJ2aWNlc1Jlc3BvbnNlLnNlcnZpY2VBcm5zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgIC8vIEdldCB0aGUgZmlyc3Qgc2VydmljZSBBUk5cbiAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZpY2VBcm4gPSBsaXN0U2VydmljZXNSZXNwb25zZS5zZXJ2aWNlQXJuc1swXTtcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZpY2VOYW1lID0gc2VydmljZUFybi5zcGxpdCgnLycpLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcXGBGb3VuZCBzZXJ2aWNlOiBcXCR7c2VydmljZU5hbWV9XFxgKTtcbiAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxcYFJlZnJlc2hpbmcgRUNTIHNlcnZpY2U6IFxcJHtzZXJ2aWNlTmFtZX0gaW4gY2x1c3RlcjogXFwke2NsdXN0ZXJOYW1lfVxcYCk7XG4gICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgIC8vIEZvcmNlIGEgbmV3IGRlcGxveW1lbnQgb2YgdGhlIHNlcnZpY2VcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVJlc3BvbnNlID0gYXdhaXQgZWNzLnVwZGF0ZVNlcnZpY2Uoe1xuICAgICAgICAgICAgICAgICAgICBjbHVzdGVyOiBjbHVzdGVyTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZTogc2VydmljZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgIGZvcmNlTmV3RGVwbG95bWVudDogdHJ1ZVxuICAgICAgICAgICAgICAgICAgfSkucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRUNTIHNlcnZpY2UgcmVmcmVzaCBpbml0aWF0ZWQgc3VjY2Vzc2Z1bGx5OicsIHVwZGF0ZVJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ05vIHNlcnZpY2VzIGZvdW5kIGluIHRoZSBjbHVzdGVyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGNhdGNoIChlY3NFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHJlZnJlc2hpbmcgRUNTIHNlcnZpY2U6JywgZWNzRXJyb3IpO1xuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGV4ZWN1dGlvbiBldmVuIGlmIEVDUyByZWZyZXNoIGZhaWxzXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogMjAwLFxuICAgICAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2U6ICdDcm9uIGpvYiBleGVjdXRlZCBzdWNjZXNzZnVsbHknIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjYWxsaW5nIEFQSTonLCBlcnJvcik7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICBzdGF0dXNDb2RlOiA1MDAsXG4gICAgICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgbWVzc2FnZTogJ0Vycm9yIGV4ZWN1dGluZyBjcm9uIGpvYicsIGVycm9yOiBlcnJvci5tZXNzYWdlIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIGApLFxuICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLCAvLyBJbmNyZWFzZWQgdGltZW91dCB0byBhbGxvdyBmb3IgRUNTIEFQSSBjYWxsXG4gICAgICBtZW1vcnlTaXplOiAxMjgsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBBUElfVVJMOiBwcm9wcy5hcGlVcmwsXG4gICAgICAgIEVDU19DTFVTVEVSX05BTUU6ICdUcmFpblRyYWNrZXItQXBwLVRyYWluVHJhY2tlclNlcnZpY2UnXG4gICAgICB9LFxuICAgICAgbG9nR3JvdXA6IGxvZ0dyb3VwXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgRXZlbnRCcmlkZ2UgcnVsZSB0byB0cmlnZ2VyIExhbWJkYSBldmVyeSAxMCBtaW51dGVzXG4gICAgY29uc3QgcnVsZSA9IG5ldyBldmVudHMuUnVsZSh0aGlzLCAnQ3JvblJ1bGUnLCB7XG4gICAgICBydWxlTmFtZTogJ3RyYWludHJhY2tlci1jcm9uLXJ1bGUnLFxuICAgICAgc2NoZWR1bGU6IGV2ZW50cy5TY2hlZHVsZS5leHByZXNzaW9uKCdyYXRlKDEwIG1pbnV0ZXMpJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ1J1bGUgdG8gdHJpZ2dlciBUcmFpblRyYWNrZXIgY3JvbiBqb2IgZXZlcnkgMTAgbWludXRlcydcbiAgICB9KTtcblxuICAgIC8vIEFkZCBMYW1iZGEgYXMgdGFyZ2V0IGZvciB0aGUgcnVsZVxuICAgIHJ1bGUuYWRkVGFyZ2V0KG5ldyB0YXJnZXRzLkxhbWJkYUZ1bmN0aW9uKGNyb25MYW1iZGEpKTtcblxuICAgIC8vIE91dHB1dCB0aGUgTGFtYmRhIGZ1bmN0aW9uIG5hbWUgYW5kIHJ1bGUgbmFtZVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdMYW1iZGFOYW1lJywge1xuICAgICAgdmFsdWU6IGNyb25MYW1iZGEuZnVuY3Rpb25OYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdOYW1lIG9mIHRoZSBMYW1iZGEgZnVuY3Rpb24nXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnUnVsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogcnVsZS5ydWxlTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnTmFtZSBvZiB0aGUgRXZlbnRCcmlkZ2UgcnVsZSdcbiAgICB9KTtcbiAgfVxufVxuIl19