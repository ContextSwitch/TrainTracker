import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  readonly ecrRepository: ecr.Repository;
  readonly service: ecsPatterns.ApplicationLoadBalancedFargateService;
  readonly environmentName: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Define the artifact for source code
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    // CodeBuild project
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true, // Required for Docker commands
      },
      environmentVariables: {
        AWS_ACCOUNT_ID: {
          value: this.account,
        },
        AWS_DEFAULT_REGION: {
          value: this.region,
        },
        REPOSITORY_URI: {
          value: props.ecrRepository.repositoryUri,
        },
        TASK_DEFINITION_ARN: {
          value: props.service.taskDefinition.taskDefinitionArn,
        },
        EXECUTION_ROLE_ARN: {
          value: props.service.taskDefinition.executionRole?.roleArn || '',
        },
        CLOUDWATCH_LOG_GROUP: {
          value: props.service.taskDefinition.defaultContainer?.logDriverConfig?.options?.['awslogs-group'] || '',
        },
        CONTAINER_NAME: {
          value: props.service.taskDefinition.defaultContainer?.containerName || 'web',
        },
      },
      buildSpec: codebuild.BuildSpec.fromSourceFilename('buildspec.yml'),
    });

    // Grant permissions to the CodeBuild project
    props.ecrRepository.grantPullPush(buildProject);
    buildProject.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:DescribeTaskDefinition',
          'ecs:RegisterTaskDefinition',
          'ecs:UpdateService',
        ],
        resources: ['*'],
      })
    );

    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: `${props.environmentName}-Pipeline`,
      crossAccountKeys: false,
    });

    // Add source stage
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeStarConnectionsSourceAction({
          actionName: 'GitHub',
          owner: 'your-github-username', // Replace with your GitHub username
          repo: 'traintracker', // Replace with your repository name
          branch: 'main',
          output: sourceOutput,
          connectionArn: 'arn:aws:codestar-connections:us-east-1:237069437847:connection/your-connection-id', // Replace with your connection ARN
        }),
      ],
    });

    // Add build stage
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'BuildAndPush',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Add deploy stage
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'DeployToECS',
          service: props.service.service,
          imageFile: buildOutput.atPath('imageDefinitions.json'),
        }),
      ],
    });

    // Output the pipeline URL
    new cdk.CfnOutput(this, 'PipelineURL', {
      value: `https://console.aws.amazon.com/codepipeline/home?region=${this.region}#/view/${pipeline.pipelineName}`,
      description: 'URL to the CodePipeline console',
    });
  }
}
