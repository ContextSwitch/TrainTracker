# SSL Configuration for TrainTracker

This document explains how to configure and deploy the TrainTracker application with SSL support in production.

## Overview

The application has been configured to support SSL in production using AWS Application Load Balancer (ALB) for SSL termination. The following changes have been made:

1. **server.js**: Simplified to run HTTP only, as HTTPS is handled by the load balancer
2. **Dockerfile.production**: Updated to expose only port 80
3. **Infrastructure**: Updated to configure the ALB for SSL termination using your ACM certificate

## SSL Termination at the Load Balancer

This implementation uses SSL termination at the load balancer level, which means:

- The ALB handles all SSL/TLS encryption and decryption
- Traffic between clients and the ALB is encrypted (HTTPS)
- Traffic between the ALB and the application containers is unencrypted (HTTP)
- This approach is more efficient and easier to manage than handling SSL in the application

## Prerequisites

Before deploying with SSL, you need:

1. An AWS account with appropriate permissions
2. An SSL certificate for your domain (chiefjourney.com) in AWS Certificate Manager (ACM)
3. The ARN of your SSL certificate

## Deployment

To deploy the application with SSL support, use the provided deployment script:

```bash
./deploy-with-ssl.sh <certificate-arn>
```

Replace `<certificate-arn>` with the ARN of your SSL certificate in AWS Certificate Manager.

Example:
```bash
./deploy-with-ssl.sh arn:aws:acm:us-east-1:123456789012:certificate/your-certificate-id
```

## Handling Existing Resources

The deployment script has been configured to handle existing AWS resources:

1. **Logical ID Preservation**: The CDK code uses specific logical IDs to match existing resources
2. **Listener Updates**: The HTTP and HTTPS listeners are updated rather than recreated
3. **Resource Reuse**: Existing security groups, load balancers, and other resources are reused

This approach ensures smooth updates without conflicts with existing infrastructure.

## Troubleshooting

If you encounter issues with SSL:

1. **Certificate not found**: Ensure your certificate ARN is correct and the certificate exists in ACM
2. **SSL connection errors**: Check that the ALB is correctly configured with your certificate
3. **Application not accessible**: Check the ECS task logs for any errors
4. **Deployment failures**: If you see "AlreadyExists" errors, check that the logical IDs in the CDK code match the existing resources

## Security Considerations

- The application supports both HTTP and HTTPS access
- For maximum security, consider configuring a redirect from HTTP to HTTPS at the ALB level
- Regularly rotate your SSL certificates in ACM
