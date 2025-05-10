#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { EcsStack } from '../lib/ecs-stack';
import { StorageStack } from '../lib/storage-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Define environment
const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

// Network infrastructure (shared)
const networkStack = new NetworkStack(app, 'TrainTracker-Network', { env });

// Development environment
const devDbStack = new DatabaseStack(app, 'TrainTracker-Dev-DB', { 
  env,
  environment: 'dev' 
});

const devStorageStack = new StorageStack(app, 'TrainTracker-Dev-Storage', {
  env,
  environment: 'dev'
});

const devEcsStack = new EcsStack(app, 'TrainTracker-Dev-ECS', { 
  env,
  vpc: networkStack.vpc,
  environment: 'dev',
  trainStatusTable: devDbStack.trainStatusTable,
  currentStatusTable: devDbStack.currentStatusTable,
  assetsBucket: devStorageStack.assetsBucket
});

// Production environment
const prodDbStack = new DatabaseStack(app, 'TrainTracker-Prod-DB', { 
  env,
  environment: 'prod' 
});

const prodStorageStack = new StorageStack(app, 'TrainTracker-Prod-Storage', {
  env,
  environment: 'prod'
});

const prodEcsStack = new EcsStack(app, 'TrainTracker-Prod-ECS', { 
  env,
  vpc: networkStack.vpc,
  environment: 'prod',
  trainStatusTable: prodDbStack.trainStatusTable,
  currentStatusTable: prodDbStack.currentStatusTable,
  assetsBucket: prodStorageStack.assetsBucket
});

// CI/CD Pipeline
new PipelineStack(app, 'TrainTracker-Pipeline', {
  env,
  devService: devEcsStack.service,
  prodService: prodEcsStack.service,
  devCluster: devEcsStack.cluster,
  prodCluster: prodEcsStack.cluster,
  repository: devEcsStack.repository,
  githubOwner: 'your-github-username',
  githubRepo: 'traintracker',
  githubBranch: 'main'
});

app.synth();
