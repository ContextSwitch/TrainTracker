#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DevStack } from '../lib/dev-stack';
import { PipelineStack } from '../lib/simplified-pipeline-stack';

const app = new cdk.App();

// Define environment
const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1'
};

// Create the development application stack
const devStack = new DevStack(app, 'TrainTracker-Dev', { env });

// CI/CD Pipeline for development
new PipelineStack(app, 'TrainTracker-Dev-Pipeline', {
  env,
  appStack: devStack,
  githubOwner: 'ContextSwitch',
  githubRepo: 'TrainTracker',
  githubBranch: 'develop' // Use a develop branch for development
});

app.synth();
