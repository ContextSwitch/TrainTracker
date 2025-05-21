import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';

export class StorageStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create ECR repository
    this.repository = new ecr.Repository(this, 'TrainTrackerRepo', {
      repositoryName: 'traintracker-repo',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteImages: true
    });

    // Output repository URI
    new cdk.CfnOutput(this, 'RepositoryURI', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI'
    });
  }
}
