import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface PipelineStackProps extends cdk.StackProps {
  repository: ecr.Repository;
  devCluster: ecs.Cluster;
  prodCluster: ecs.Cluster;
  devService: ecs.FargateService;
  prodService: ecs.FargateService;
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    
    // Create the pipeline
    const pipeline = new codepipeline.Pipeline(this, 'TrainTrackerPipeline', {
      pipelineName: 'TrainTracker-Pipeline'
    });
    
    // Add source stage
    const sourceOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      owner: props.githubOwner,
      repo: props.githubRepo,
      branch: props.githubBranch,
      oauthToken: cdk.SecretValue.secretsManager('github-token'),
      output: sourceOutput
    });
    
    pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction]
    });
    
    // Add build and test stage
    const buildOutput = new codepipeline.Artifact();
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci'
            ]
          },
          build: {
            commands: [
              'npm run build',
              'npm test',
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'echo Building the Docker image...',
              'docker build -t $ECR_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .',
              'docker tag $ECR_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION $ECR_REPOSITORY_URI:latest',
              'echo Pushing the Docker image...',
              'docker push $ECR_REPOSITORY_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION',
              'docker push $ECR_REPOSITORY_URI:latest'
            ]
          }
        },
        artifacts: {
          files: [
            'appspec.yml',
            'taskdef.json',
            'imagedefinitions.json'
          ]
        }
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true
      },
      environmentVariables: {
        AWS_ACCOUNT_ID: { value: cdk.Stack.of(this).account },
        AWS_DEFAULT_REGION: { value: cdk.Stack.of(this).region },
        ECR_REPOSITORY_URI: { value: props.repository.repositoryUri }
      }
    });
    
    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'BuildAndTest',
      project: buildProject,
      input: sourceOutput,
      outputs: [buildOutput]
    });
    
    pipeline.addStage({
      stageName: 'BuildAndTest',
      actions: [buildAction]
    });
    
    // Add deploy to dev stage
    const deployToDevProject = new codebuild.PipelineProject(this, 'DeployToDevProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Deploying to development environment...',
              'aws ecs update-service --cluster $DEV_CLUSTER --service $DEV_SERVICE --force-new-deployment'
            ]
          }
        }
      }),
      environmentVariables: {
        DEV_CLUSTER: { value: props.devCluster.clusterName },
        DEV_SERVICE: { value: props.devService.serviceName }
      }
    });
    
    // Grant permissions to update ECS service
    deployToDevProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:UpdateService'],
      resources: [props.devService.serviceArn]
    }));
    
    const deployToDevAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'DeployToDev',
      project: deployToDevProject,
      input: buildOutput
    });
    
    pipeline.addStage({
      stageName: 'DeployToDev',
      actions: [deployToDevAction]
    });
    
    // Add integration tests stage
    const integrationTestProject = new codebuild.PipelineProject(this, 'IntegrationTestProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci'
            ]
          },
          build: {
            commands: [
              'echo Running integration tests...',
              'npm run test:integration'
            ]
          }
        }
      }),
      environmentVariables: {
        API_URL: { 
          value: `http://${props.devService.loadBalancer?.loadBalancerDnsName || 'localhost:3000'}` 
        }
      }
    });
    
    const integrationTestAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'IntegrationTests',
      project: integrationTestProject,
      input: sourceOutput
    });
    
    pipeline.addStage({
      stageName: 'IntegrationTests',
      actions: [integrationTestAction]
    });
    
    // Add deploy to production stage
    const deployToProdProject = new codebuild.PipelineProject(this, 'DeployToProdProject', {
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo Deploying to production environment...',
              'aws ecs update-service --cluster $PROD_CLUSTER --service $PROD_SERVICE --force-new-deployment'
            ]
          }
        }
      }),
      environmentVariables: {
        PROD_CLUSTER: { value: props.prodCluster.clusterName },
        PROD_SERVICE: { value: props.prodService.serviceName }
      }
    });
    
    // Grant permissions to update ECS service
    deployToProdProject.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ecs:UpdateService'],
      resources: [props.prodService.serviceArn]
    }));
    
    const deployToProdAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'DeployToProd',
      project: deployToProdProject,
      input: buildOutput
    });
    
    pipeline.addStage({
      stageName: 'DeployToProd',
      actions: [deployToProdAction]
    });
  }
}
