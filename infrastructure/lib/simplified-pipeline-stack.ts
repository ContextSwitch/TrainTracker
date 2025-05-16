import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';
import { SimplifiedStack } from './simplified-stack';

export interface PipelineStackProps extends cdk.StackProps {
  appStack: SimplifiedStack;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    // Pipeline artifact bucket
    const artifactBucket = new cdk.aws_s3.Bucket(this, 'ArtifactBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
    });

    // Find the ECR repository created by the app stack
    const ecrRepo = ecr.Repository.fromRepositoryName(
      this,
      'AppECRRepo',
      `${props.appStack.appName.toLowerCase()}-repo`
    );

    // CodeBuild project for testing
    const testProject = new codebuild.PipelineProject(this, 'TestProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18'
            },
            commands: [
              'npm ci'
            ]
          },
          build: {
            commands: [
              'npm test'
            ]
          }
        }
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true
      }
    });

    // CodeBuild project for building and pushing Docker image
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '18'
            },
            commands: [
              'npm ci'
            ]
          },
          pre_build: {
            commands: [
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/' + `${props.appStack.appName.toLowerCase()}-repo`,
              'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
              'IMAGE_TAG=${COMMIT_HASH:=latest}'
            ]
          },
          build: {
            commands: [
              'npm run build',
              'docker build -t $REPOSITORY_URI:latest .',
              'docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG'
            ]
          },
          post_build: {
            commands: [
              'docker push $REPOSITORY_URI:latest',
              'docker push $REPOSITORY_URI:$IMAGE_TAG',
              'echo Writing image definitions file...',
              'echo "{\"ImageURI\":\"$REPOSITORY_URI:$IMAGE_TAG\"}" > imageDefinitions.json'
            ]
          }
        },
        artifacts: {
          files: ['imageDefinitions.json']
        }
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: {
            value: this.region
          },
          AWS_ACCOUNT_ID: {
            value: this.account
          }
        }
      }
    });

    // Grant permissions to push to ECR
    ecrRepo.grantPullPush(buildProject.role!);
    
    // Grant permissions to update ECS service
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'ecs:UpdateService',
        'ecs:DescribeServices',
        'ecs:DescribeTaskDefinition',
        'ecs:RegisterTaskDefinition',
        'ecs:ListTaskDefinitions',
        'iam:PassRole'
      ],
      resources: ['*']
    }));

    // Pipeline definition
    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      artifactBucket,
      pipelineName: 'TrainTracker-Pipeline',
      restartExecutionOnUpdate: true
    });

    // Source stage using S3
    const sourceOutput = new codepipeline.Artifact('SourceCode');
    
    // Create an S3 bucket for source code
    const sourceBucket = new cdk.aws_s3.Bucket(this, 'SourceBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    });
    
    // S3 source action
    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'S3Source',
      bucket: sourceBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
    });
    
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    });
    
    // Output the source bucket name
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Name of the S3 bucket for source code uploads'
    });

    // Test stage
    const testAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'Test',
      project: testProject,
      input: sourceOutput,
      outputs: []
    });
    pipeline.addStage({
      stageName: 'Test',
      actions: [testAction]
    });

    // Build stage
    const buildOutput = new codepipeline.Artifact('BuildOutput');
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'BuildAndPushImage',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput]
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [buildAction]
    });

    // Deploy stage
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToECS',
      service: props.appStack.service.service,
      imageFile: buildOutput.atPath('imageDefinitions.json')
    });

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [deployAction]
    });

    // Output the pipeline URL
    new cdk.CfnOutput(this, 'PipelineConsoleUrl', {
      value: `https://console.aws.amazon.com/codepipeline/home?region=${this.region}#/view/${pipeline.pipelineName}`,
      description: 'URL to the CodePipeline console'
    });
  }
}
