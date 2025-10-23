# Render Deployment Guide

This guide will help you deploy the TrainTracker application to Render, replacing the current AWS infrastructure.

## Cost Comparison
- **Current AWS**: ~$85-125/month
- **New Render**: ~$7-25/month
- **Savings**: 70-90% reduction

## Prerequisites
- [x] Render account created
- [x] Code updated for Render compatibility
- [ ] Code pushed to GitHub

## Step 1: Push Updated Code to GitHub

```bash
git add .
git commit -m "Update configuration for Render deployment"
git push origin main
```
ss
## Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ContextSwitch/TrainTracker`
4. Configure the service:
   - **Name**: `traintracker-web`
   - **Runtime**: Node
   - **Branch**: main
   - **Build Command**: `npm ci --legacy-peer-deps && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

5. Set Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=traintracker-admin-secret
   ADMIN_PASSWORD=WhereDidTheSunGo
   ```

6. Click "Create Web Service"

### Alternative: Docker Deployment (if Node.js fails)

If the Node.js runtime fails, try Docker:
1. Change **Runtime** to "Docker"
2. Set **Dockerfile Path** to `./Dockerfile.render` (recommended) or `./Dockerfile`
3. Keep other settings the same

**Note**: The Docker build issue has been fixed - dev dependencies are now included during build and removed after to keep the final image small.

## Step 3: Configure Custom Domain

1. In your web service settings, go to "Settings" → "Custom Domains"
2. Add domains:
   - `chiefjourney.com`
   - `www.chiefjourney.com`
3. Render will provide DNS instructions
4. **DO NOT update DNS yet** - wait until testing is complete

## Step 4: Create Cron Job Service

1. Click "New +" → "Cron Job"
2. Connect the same GitHub repository
3. Configure:
   - **Name**: `traintracker-cron`
   - **Runtime**: Node
   - **Branch**: main
   - **Build Command**: `npm ci --legacy-peer-deps`
   - **Schedule**: `*/10 * * * *` (every 10 minutes)
   - **Command**: 
   ```bash
   node -e "
   const https = require('https');
   const http = require('http');
   
   console.log('TrainTracker cron job started');
   
   const apiUrl = 'https://traintracker-web.onrender.com/api/cron';
   console.log('Calling API URL:', apiUrl);
   
   const client = https;
   const req = client.get(apiUrl, (res) => {
     let data = '';
     res.on('data', (chunk) => data += chunk);
     res.on('end', () => {
       console.log('API response status:', res.statusCode);
       console.log('API response:', data);
       process.exit(0);
     });
   });
   
   req.on('error', (error) => {
     console.error('Error calling API:', error);
     process.exit(1);
   });
   
   req.setTimeout(50000, () => {
     console.error('Request timeout');
     req.destroy();
     process.exit(1);
   });
   "
   ```

4. Set Environment Variables:
   ```
   NODE_ENV=production
   ```

5. Click "Create Cron Job"

## Step 5: Test Deployment

1. Wait for the web service to deploy (usually 5-10 minutes)
2. Test the Render URL: `https://traintracker-web.onrender.com`
3. Verify all functionality:
   - Home page loads
   - Train data displays
   - Admin panel works
   - API endpoints respond

## Step 6: Update DNS (Final Step)

**Only do this after confirming everything works on Render!**

1. Go to your domain registrar (where you bought chiefjourney.com)
2. Update DNS records:
   - Delete existing A/CNAME records for `chiefjourney.com` and `www.chiefjourney.com`
   - Add new CNAME records as provided by Render

3. Wait for DNS propagation (can take up to 48 hours, usually 1-2 hours)

## Step 7: Clean Up AWS Resources

**Only do this after DNS is fully migrated and working!**

1. Delete ECS Service
2. Delete Application Load Balancer
3. Delete ECS Cluster
4. Delete Lambda function
5. Delete EventBridge rule
6. Delete ECR repository (optional)
7. Delete VPC and associated resources
8. Delete CloudWatch log groups

## Monitoring and Troubleshooting

### Render Dashboard
- Monitor deployments and logs in the Render dashboard
- Check cron job execution logs
- Monitor resource usage

### Common Issues
1. **Build failures**: Check build logs in Render dashboard
2. **Port issues**: Ensure PORT=10000 in environment variables
3. **Cron job failures**: Check cron job logs and API endpoint health

### Rollback Plan
If issues arise, you can quickly revert DNS back to AWS while troubleshooting.

## Cost Breakdown (Render)
- Web Service (Starter): $7/month
- Cron Job: $1-3/month (based on execution time)
- Custom Domain: Free
- SSL Certificate: Free
- **Total**: ~$8-10/month

## Support
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
