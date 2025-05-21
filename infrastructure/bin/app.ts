#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { EcsStack } from '../lib/ecs-stack';

const app = new cdk.App();

// Create network stack
const networkStack = new NetworkStack(app, 'TrainTracker-Network', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'Network infrastructure for TrainTracker application'
});

// Create storage stack
const storageStack = new StorageStack(app, 'TrainTracker-Storage', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'Storage infrastructure for TrainTracker application'
});

// Create ECS stack
const ecsStack = new EcsStack(app, 'TrainTracker-App', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'ECS infrastructure for TrainTracker application',
  vpc: networkStack.vpc,
  albSecurityGroup: networkStack.albSecurityGroup,
  ecsSecurityGroup: networkStack.ecsSecurityGroup,
  repository: storageStack.repository
});

// Add dependencies
ecsStack.addDependency(networkStack);
ecsStack.addDependency(storageStack);
