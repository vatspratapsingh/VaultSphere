#!/bin/bash

# VaultSphere Backend Deployment Script - Fast Version
set -e

# Configuration
EC2_IP="13.51.48.21"
SSH_KEY="~/.ssh/vaultsphere_key_new"
REMOTE_USER="ec2-user"

echo "🚀 Starting Fast Backend Deployment..."
echo "📍 Target: $EC2_IP"

# Step 1: Create a clean deployment package
echo "📦 Creating deployment package..."
cd backend
tar --exclude='node_modules' --exclude='*.log' -czf ../backend-deploy.tar.gz .
cd ..

# Step 2: Upload and deploy
echo "📤 Uploading to EC2..."
scp -i $SSH_KEY backend-deploy.tar.gz $REMOTE_USER@$EC2_IP:/tmp/

echo "🔧 Deploying on EC2..."
ssh -i $SSH_KEY $REMOTE_USER@$EC2_IP << 'EOF'
# Clean up previous deployment
sudo rm -rf /opt/vaultsphere
sudo mkdir -p /opt/vaultsphere
sudo chown ec2-user:ec2-user /opt/vaultsphere

# Extract new deployment
cd /opt/vaultsphere
tar -xzf /tmp/backend-deploy.tar.gz
rm /tmp/backend-deploy.tar.gz

# Install dependencies
npm install

# Create environment file
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vaultsphere
DB_USER=vaultsphere_user
DB_PASSWORD=vaultsphere_pass
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENVEOF

# Start with PM2
pm2 delete vaultsphere-backend 2>/dev/null || true
pm2 start server.js --name "vaultsphere-backend"
pm2 save

echo "✅ Backend deployed successfully!"
EOF

# Clean up local files
rm backend-deploy.tar.gz

echo "🎉 Backend deployment completed!"
echo "🔗 API URL: http://$EC2_IP:5001"
