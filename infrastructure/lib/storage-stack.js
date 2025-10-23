"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageStack = void 0;
const cdk = require("aws-cdk-lib");
const ecr = require("aws-cdk-lib/aws-ecr");
class StorageStack extends cdk.Stack {
    constructor(scope, id, props) {
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
exports.StorageStack = StorageStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLDJDQUEyQztBQUUzQyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsS0FBSztJQUd6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDN0QsY0FBYyxFQUFFLG1CQUFtQjtZQUNuQyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPO1lBQ3hDLGdCQUFnQixFQUFFLElBQUk7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsd0JBQXdCO1FBQ3hCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGFBQWE7WUFDcEMsV0FBVyxFQUFFLG9CQUFvQjtTQUNsQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuQkQsb0NBbUJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgZWNyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lY3InO1xuXG5leHBvcnQgY2xhc3MgU3RvcmFnZVN0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHJlcG9zaXRvcnk6IGVjci5SZXBvc2l0b3J5O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBFQ1IgcmVwb3NpdG9yeVxuICAgIHRoaXMucmVwb3NpdG9yeSA9IG5ldyBlY3IuUmVwb3NpdG9yeSh0aGlzLCAnVHJhaW5UcmFja2VyUmVwbycsIHtcbiAgICAgIHJlcG9zaXRvcnlOYW1lOiAndHJhaW50cmFja2VyLXJlcG8nLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVJbWFnZXM6IHRydWVcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCByZXBvc2l0b3J5IFVSSVxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdSZXBvc2l0b3J5VVJJJywge1xuICAgICAgdmFsdWU6IHRoaXMucmVwb3NpdG9yeS5yZXBvc2l0b3J5VXJpLFxuICAgICAgZGVzY3JpcHRpb246ICdFQ1IgUmVwb3NpdG9yeSBVUkknXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==