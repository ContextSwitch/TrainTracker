#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { EcsStack } from '../lib/ecs-stack';
import { SchedulerStack } from '../lib/scheduler-stack';

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

// Create Scheduler stack for cron job
const schedulerStack = new SchedulerStack(app, 'TrainTracker-Scheduler', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  description: 'Scheduler infrastructure for TrainTracker cron jobs',
  apiUrl: 'https://www.chiefjourney.com/api/cron'
});

// Add dependencies
ecsStack.addDependency(networkStack);
ecsStack.addDependency(storageStack);
schedulerStack.addDependency(ecsStack);
