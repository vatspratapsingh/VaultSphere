# AWS App Runner Deployment Guide

## Prerequisites
- AWS CLI installed and configured
- Docker installed
- AWS account with appropriate permissions

## Step 1: Create ECR Repository
```bash
aws ecr create-repository --repository-name vaultsphere-backend --region us-east-1
```

## Step 2: Get your AWS Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

## Step 3: Build and Push Docker Image
```bash
# Build the image
docker build -t vaultsphere-backend .

# Get your AWS account ID (replace with your actual account ID)
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Tag the image
docker tag vaultsphere-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/vaultsphere-backend:latest

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Push the image
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/vaultsphere-backend:latest
```

## Step 4: Create App Runner Service
1. Go to AWS Console → App Runner
2. Click "Create service"
3. Choose "Container registry"
4. Select "Amazon ECR"
5. Choose your repository: `vaultsphere-backend`
6. Set service name: `vaultsphere-backend`
7. Configure environment variables:
   - `NODE_ENV=production`
   - `PORT=5001`
   - Add your database connection string
8. Click "Create & deploy"

## Step 5: Update Frontend
Once deployed, update your frontend environment variable:
```bash
# In your frontend directory, create .env file
echo "REACT_APP_API_URL=https://your-app-runner-url.amazonaws.com/api" > .env
```

## Step 6: Redeploy Frontend
```bash
cd ../frontend
npm run build
aws s3 sync build/ s3://vaultsphere-frontend-2024-vats --delete
```

## Environment Variables Needed
Make sure to set these in your App Runner service:
- `DATABASE_URL` - Your PostgreSQL connection string
- `JWT_SECRET` - Your JWT secret key
- `NODE_ENV=production`
- `PORT=5001`
