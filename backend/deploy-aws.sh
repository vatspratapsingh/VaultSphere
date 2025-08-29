#!/bin/bash

# AWS App Runner deployment script for VaultSphere Backend

echo "🚀 Deploying VaultSphere Backend to AWS App Runner..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install it first."
    exit 1
fi

# Set variables
APP_NAME="vaultsphere-backend"
REGION="us-east-1"
ECR_REPOSITORY="vaultsphere-backend"

echo "📦 Building Docker image..."
docker build -t $ECR_REPOSITORY .

echo "🏷️ Tagging image..."
docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

echo "📤 Pushing image to ECR..."
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$ECR_REPOSITORY:latest

echo "✅ Deployment completed!"
echo "🌐 Your backend will be available at: https://your-app-runner-url.amazonaws.com"
echo "📝 Don't forget to update your frontend environment variables with the new backend URL"
