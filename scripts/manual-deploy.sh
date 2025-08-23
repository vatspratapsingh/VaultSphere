#!/bin/bash

# VaultSphere Manual Deployment Script
set -e

echo "🚀 Starting Manual Deployment..."

# Step 1: Create deployment package
echo "📦 Creating deployment package..."
cd backend
tar --exclude='node_modules' --exclude='*.log' -czf ../backend-deploy.tar.gz .
cd ..

# Step 2: Upload to S3 temporarily
echo "📤 Uploading to S3..."
aws s3 cp backend-deploy.tar.gz s3://vaultsphere-frontend-2024-vats/backend-deploy.tar.gz

# Step 3: Use AWS CLI to run commands on EC2
echo "🔧 Deploying on EC2..."
aws ssm send-command \
    --instance-ids $(aws ec2 describe-instances --filters "Name=public-ip,Values=13.51.48.21" --query 'Reservations[0].Instances[0].InstanceId' --output text) \
    --document-name "AWS-RunShellScript" \
    --parameters 'commands=[
        "sudo yum update -y",
        "sudo yum install -y nodejs npm",
        "sudo npm install -g pm2",
        "sudo mkdir -p /opt/vaultsphere",
        "sudo chown ec2-user:ec2-user /opt/vaultsphere",
        "cd /opt/vaultsphere",
        "aws s3 cp s3://vaultsphere-frontend-2024-vats/backend-deploy.tar.gz .",
        "tar -xzf backend-deploy.tar.gz",
        "rm backend-deploy.tar.gz",
        "npm install",
        "echo \"NODE_ENV=production\" > .env",
        "echo \"PORT=5001\" >> .env",
        "echo \"DB_HOST=localhost\" >> .env",
        "echo \"DB_PORT=5432\" >> .env",
        "echo \"DB_NAME=vaultsphere\" >> .env",
        "echo \"DB_USER=vaultsphere_user\" >> .env",
        "echo \"DB_PASSWORD=1234\" >> .env",
        "echo \"JWT_SECRET=your-super-secret-jwt-key-change-in-production\" >> .env",
        "pm2 delete vaultsphere-backend 2>/dev/null || true",
        "pm2 start server.js --name vaultsphere-backend",
        "pm2 save",
        "echo \"Backend deployed successfully!\""
    ]'

# Step 4: Clean up
echo "🧹 Cleaning up..."
rm backend-deploy.tar.gz
aws s3 rm s3://vaultsphere-frontend-2024-vats/backend-deploy.tar.gz

echo "🎉 Manual deployment completed!"
echo "🔗 API URL: http://13.51.48.21:5001"
