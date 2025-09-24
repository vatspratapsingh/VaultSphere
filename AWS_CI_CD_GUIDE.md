# 🚀 AWS & CI/CD Pipeline Guide - VaultSphere

## 📋 Overview
Complete guide to AWS services and CI/CD pipeline implementation in the VaultSphere multi-tenant SaaS platform.

## 🏗️ AWS Architecture

```
Frontend (React) → S3 → CloudFront
Backend (Node.js) → EC2 → VPC
Database (PostgreSQL) → Supabase
```

## ☁️ AWS Services Used

### 1. **Amazon S3** - Frontend Hosting
- **Purpose**: Static website hosting for React app
- **URL**: `http://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com`
- **Benefits**: Cost-effective, scalable, global availability

### 2. **Amazon EC2** - Backend Server
- **Purpose**: Run Node.js API server
- **URL**: `http://13.51.48.21:5001`
- **Benefits**: Flexible, scalable, secure

### 3. **Amazon VPC** - Network Security
- **Purpose**: Isolated network environment
- **Security Groups**: Control traffic flow
- **Benefits**: Network isolation, security

### 4. **AWS Systems Manager (SSM)** - Server Management
- **Purpose**: Secure server access without SSH keys
- **Benefits**: Secure, auditable, no key management

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: vaultsphere_test
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: cd backend && npm ci
    - name: Run tests
      run: cd backend && npm test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
    - name: Build frontend
      run: cd frontend && npm run build
    - name: Run tests
      run: cd frontend && npm test -- --watchAll=false
```

### What the Pipeline Does:
1. **Triggers**: On push to main branch or PR
2. **Backend Testing**: Spins up PostgreSQL, runs `test-cicd.js`
3. **Frontend Testing**: Builds and tests React app
4. **Quality Gates**: Fails if any test fails

## 🚀 Deployment Commands

### Frontend Deployment (S3)
```bash
cd frontend
npm run build
aws s3 sync build/ s3://vaultsphere-frontend-2024-vats --delete
```

### Backend Deployment (EC2)
```bash
# Using deployment script
./scripts/deploy-backend.sh

# Or with SSM
aws ssm send-command \
  --instance-ids i-1234567890abcdef0 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /home/ec2-user/vaultsphere-backend && git pull && npm install && pm2 restart all"]'
```

## 🏗️ Infrastructure as Code (Terraform)

### Key Resources:
- **VPC**: Network isolation
- **EC2**: Backend server
- **S3**: Frontend hosting
- **Security Groups**: Traffic control
- **Internet Gateway**: Public access

### Terraform Commands:
```bash
terraform init
terraform plan
terraform apply
terraform destroy
```

## 🔒 Security Best Practices

### 1. IAM Policies
- Principle of least privilege
- Separate roles for different services
- Use GitHub Secrets for sensitive data

### 2. Security Groups
```hcl
resource "aws_security_group" "backend_sg" {
  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### 3. Environment Variables
```bash
# GitHub Secrets
AWS_ACCESS_KEY_ID: AKIA...
AWS_SECRET_ACCESS_KEY: ...
EC2_INSTANCE_ID: i-1234567890abcdef0
DATABASE_URL: postgresql://...
JWT_SECRET: your-super-secret-key
```

## 📊 Monitoring & Testing

### CI/CD Test Script (`backend/test-cicd.js`)
```javascript
// Tests:
// 1. Database connection
// 2. Environment variables
// 3. Test accounts
// 4. API endpoints

async function testDatabaseConnection() {
  const db = require('./config/database');
  const result = await db.query('SELECT NOW() as current_time');
  console.log('✅ Database connection test: PASSED');
}
```

### Run Tests Locally:
```bash
cd backend
node test-cicd.js
```

## 🎯 Key Benefits

### AWS Services:
- **S3**: Cost-effective static hosting
- **EC2**: Flexible compute resources
- **VPC**: Secure network isolation
- **SSM**: Secure server management

### CI/CD Pipeline:
- **Automated Testing**: Every push/PR
- **Quality Gates**: Prevents bad deployments
- **Fast Feedback**: Immediate test results
- **Consistent Environment**: Same tests everywhere

## 🚀 Next Steps for Production

1. **HTTPS**: Add AWS Certificate Manager
2. **CDN**: Implement CloudFront
3. **Monitoring**: Add CloudWatch
4. **Auto-scaling**: Configure Auto Scaling Groups
5. **Database**: Migrate to RDS
6. **Security**: Add MFA and advanced features

## 📚 Resources

- [AWS Documentation](https://docs.aws.amazon.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

---

**VaultSphere** - A production-ready multi-tenant SaaS platform with modern cloud architecture! 🚀
