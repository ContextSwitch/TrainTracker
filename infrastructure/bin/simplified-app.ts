#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SimplifiedStack } from '../lib/simplified-stack';
import { PipelineStack } from '../lib/simplified-pipeline-stack';

const app = new cdk.App();

// Define environment
const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

// Create the main application stack
const appStack = new SimplifiedStack(app, 'TrainTracker-App', { env });

// CI/CD Pipeline
new PipelineStack(app, 'TrainTracker-Pipeline', {
  env,
  appStack: appStack,
  githubOwner: 'ContextSwitch',
  githubRepo: 'TrainTracker',
  githubBranch: 'main'
});

app.synth();
