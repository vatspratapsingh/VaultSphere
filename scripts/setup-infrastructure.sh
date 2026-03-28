#!/bin/bash

# VaultSphere Infrastructure Setup Script
# This script creates all necessary AWS resources for VaultSphere deployment

set -e

# Configuration
AWS_REGION=${AWS_REGION:-"eu-north-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"123456789012"}
PROJECT_NAME="vaultsphere"
ENVIRONMENT=${ENVIRONMENT:-"production"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if jq is installed
    if ! command -v jq &> /dev/null; then
        log_error "jq is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials are not configured properly."
        exit 1
    fi
    
    # Get actual account ID
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_info "Using AWS Account ID: ${AWS_ACCOUNT_ID}"
    
    log_success "All prerequisites are met."
}

# Create VPC and networking
create_vpc() {
    log_info "Creating VPC and networking resources..."
    
    # Create VPC
    VPC_ID=$(aws ec2 create-vpc \
        --cidr-block 10.0.0.0/16 \
        --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${PROJECT_NAME}-vpc},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'Vpc.VpcId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-vpcs \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-vpc" \
            --query 'Vpcs[0].VpcId' \
            --output text \
            --region ${AWS_REGION})
    
    log_info "VPC ID: ${VPC_ID}"
    
    # Enable DNS hostnames
    aws ec2 modify-vpc-attribute \
        --vpc-id ${VPC_ID} \
        --enable-dns-hostnames \
        --region ${AWS_REGION}
    
    # Create Internet Gateway
    IGW_ID=$(aws ec2 create-internet-gateway \
        --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${PROJECT_NAME}-igw},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'InternetGateway.InternetGatewayId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-internet-gateways \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-igw" \
            --query 'InternetGateways[0].InternetGatewayId' \
            --output text \
            --region ${AWS_REGION})
    
    # Attach Internet Gateway to VPC
    aws ec2 attach-internet-gateway \
        --internet-gateway-id ${IGW_ID} \
        --vpc-id ${VPC_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Create public subnets
    SUBNET_1_ID=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.1.0/24 \
        --availability-zone ${AWS_REGION}a \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-1},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-subnets \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-public-subnet-1" \
            --query 'Subnets[0].SubnetId' \
            --output text \
            --region ${AWS_REGION})
    
    SUBNET_2_ID=$(aws ec2 create-subnet \
        --vpc-id ${VPC_ID} \
        --cidr-block 10.0.2.0/24 \
        --availability-zone ${AWS_REGION}b \
        --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-subnet-2},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'Subnet.SubnetId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-subnets \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-public-subnet-2" \
            --query 'Subnets[0].SubnetId' \
            --output text \
            --region ${AWS_REGION})
    
    # Enable auto-assign public IP
    aws ec2 modify-subnet-attribute \
        --subnet-id ${SUBNET_1_ID} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}
    
    aws ec2 modify-subnet-attribute \
        --subnet-id ${SUBNET_2_ID} \
        --map-public-ip-on-launch \
        --region ${AWS_REGION}
    
    # Create route table
    ROUTE_TABLE_ID=$(aws ec2 create-route-table \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${PROJECT_NAME}-public-rt},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'RouteTable.RouteTableId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-route-tables \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-public-rt" \
            --query 'RouteTables[0].RouteTableId' \
            --output text \
            --region ${AWS_REGION})
    
    # Create route to Internet Gateway
    aws ec2 create-route \
        --route-table-id ${ROUTE_TABLE_ID} \
        --destination-cidr-block 0.0.0.0/0 \
        --gateway-id ${IGW_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Associate subnets with route table
    aws ec2 associate-route-table \
        --subnet-id ${SUBNET_1_ID} \
        --route-table-id ${ROUTE_TABLE_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws ec2 associate-route-table \
        --subnet-id ${SUBNET_2_ID} \
        --route-table-id ${ROUTE_TABLE_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    log_success "VPC and networking resources created successfully."
    
    # Export variables for other functions
    export VPC_ID SUBNET_1_ID SUBNET_2_ID
}

# Create security groups
create_security_groups() {
    log_info "Creating security groups..."
    
    # ALB Security Group
    ALB_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-alb-sg \
        --description "Security group for ${PROJECT_NAME} Application Load Balancer" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-alb-sg},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'GroupId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" \
            --query 'SecurityGroups[0].GroupId' \
            --output text \
            --region ${AWS_REGION})
    
    # Backend Security Group
    BACKEND_SG_ID=$(aws ec2 create-security-group \
        --group-name ${PROJECT_NAME}-backend-sg \
        --description "Security group for ${PROJECT_NAME} backend containers" \
        --vpc-id ${VPC_ID} \
        --tag-specifications "ResourceType=security-group,Tags=[{Key=Name,Value=${PROJECT_NAME}-backend-sg},{Key=Environment,Value=${ENVIRONMENT}}]" \
        --query 'GroupId' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=${PROJECT_NAME}-backend-sg" \
            --query 'SecurityGroups[0].GroupId' \
            --output text \
            --region ${AWS_REGION})
    
    # ALB Security Group Rules
    aws ec2 authorize-security-group-ingress \
        --group-id ${ALB_SG_ID} \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws ec2 authorize-security-group-ingress \
        --group-id ${ALB_SG_ID} \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Backend Security Group Rules
    aws ec2 authorize-security-group-ingress \
        --group-id ${BACKEND_SG_ID} \
        --protocol tcp \
        --port 5001 \
        --source-group ${ALB_SG_ID} \
        --region ${AWS_REGION} 2>/dev/null || true
    
    log_success "Security groups created successfully."
    
    # Export variables
    export ALB_SG_ID BACKEND_SG_ID
}

# Create IAM roles
create_iam_roles() {
    log_info "Creating IAM roles..."
    
    # ECS Task Execution Role
    cat > /tmp/ecs-task-execution-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
    
    aws iam create-role \
        --role-name ecsTaskExecutionRole \
        --assume-role-policy-document file:///tmp/ecs-task-execution-trust-policy.json \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws iam attach-role-policy \
        --role-name ecsTaskExecutionRole \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # VaultSphere Task Role
    cat > /tmp/vaultsphere-task-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT_ID}:secret:vaultsphere/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": [
        "arn:aws:sns:${AWS_REGION}:${AWS_ACCOUNT_ID}:VaultSphere-*"
      ]
    }
  ]
}
EOF
    
    aws iam create-role \
        --role-name vaultsphere-task-role \
        --assume-role-policy-document file:///tmp/ecs-task-execution-trust-policy.json \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws iam put-role-policy \
        --role-name vaultsphere-task-role \
        --policy-name VaultSphereTaskPolicy \
        --policy-document file:///tmp/vaultsphere-task-policy.json \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Auto Scaling Role
    aws iam create-role \
        --role-name application-autoscaling-ecs-service \
        --assume-role-policy-document '{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "application-autoscaling.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        }' \
        --region ${AWS_REGION} 2>/dev/null || true
    
    aws iam attach-role-policy \
        --role-name application-autoscaling-ecs-service \
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSServiceRolePolicy \
        --region ${AWS_REGION} 2>/dev/null || true
    
    log_success "IAM roles created successfully."
}

# Create ECR repository
create_ecr_repository() {
    log_info "Creating ECR repository..."
    
    aws ecr create-repository \
        --repository-name ${PROJECT_NAME}-backend \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "ECR repository already exists."
    
    # Set lifecycle policy
    cat > /tmp/ecr-lifecycle-policy.json << EOF
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "tagged",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "Delete untagged images older than 1 day",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 1
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF
    
    aws ecr put-lifecycle-policy \
        --repository-name ${PROJECT_NAME}-backend \
        --lifecycle-policy-text file:///tmp/ecr-lifecycle-policy.json \
        --region ${AWS_REGION} 2>/dev/null || true
    
    log_success "ECR repository created successfully."
}

# Create ECS cluster
create_ecs_cluster() {
    log_info "Creating ECS cluster..."
    
    aws ecs create-cluster \
        --cluster-name ${PROJECT_NAME}-cluster \
        --capacity-providers FARGATE \
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
        --tags key=Environment,value=${ENVIRONMENT} key=Project,value=${PROJECT_NAME} \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "ECS cluster already exists."
    
    log_success "ECS cluster created successfully."
}

# Create Application Load Balancer
create_load_balancer() {
    log_info "Creating Application Load Balancer..."
    
    # Create ALB
    ALB_ARN=$(aws elbv2 create-load-balancer \
        --name ${PROJECT_NAME}-alb \
        --subnets ${SUBNET_1_ID} ${SUBNET_2_ID} \
        --security-groups ${ALB_SG_ID} \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws elbv2 describe-load-balancers \
            --names ${PROJECT_NAME}-alb \
            --query 'LoadBalancers[0].LoadBalancerArn' \
            --output text \
            --region ${AWS_REGION})
    
    # Create target group
    TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
        --name ${PROJECT_NAME}-backend-tg \
        --protocol HTTP \
        --port 5001 \
        --vpc-id ${VPC_ID} \
        --target-type ip \
        --health-check-protocol HTTP \
        --health-check-path /api/health \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --matcher HttpCode=200 \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws elbv2 describe-target-groups \
            --names ${PROJECT_NAME}-backend-tg \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text \
            --region ${AWS_REGION})
    
    # Create HTTP listener (redirect to HTTPS)
    aws elbv2 create-listener \
        --load-balancer-arn ${ALB_ARN} \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
        --region ${AWS_REGION} 2>/dev/null || true
    
    # Create HTTPS listener (if certificate is available)
    # Note: You'll need to create an SSL certificate in ACM first
    log_warning "HTTPS listener not created. Please create an SSL certificate in ACM and update the listener manually."
    
    log_success "Application Load Balancer created successfully."
    
    # Export variables
    export ALB_ARN TARGET_GROUP_ARN
}

# Create CloudWatch log group
create_cloudwatch_logs() {
    log_info "Creating CloudWatch log groups..."
    
    aws logs create-log-group \
        --log-group-name /ecs/${PROJECT_NAME}-backend \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "CloudWatch log group already exists."
    
    # Set retention policy
    aws logs put-retention-policy \
        --log-group-name /ecs/${PROJECT_NAME}-backend \
        --retention-in-days 30 \
        --region ${AWS_REGION} 2>/dev/null || true
    
    log_success "CloudWatch log groups created successfully."
}

# Create SNS topic for alerts
create_sns_topic() {
    log_info "Creating SNS topic for alerts..."
    
    SNS_TOPIC_ARN=$(aws sns create-topic \
        --name VaultSphere-Alerts \
        --attributes DisplayName="VaultSphere Alerts" \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --query 'TopicArn' \
        --output text \
        --region ${AWS_REGION} 2>/dev/null || \
        aws sns list-topics \
            --query 'Topics[?contains(TopicArn, `VaultSphere-Alerts`)].TopicArn' \
            --output text \
            --region ${AWS_REGION})
    
    log_success "SNS topic created successfully: ${SNS_TOPIC_ARN}"
    
    # Export variable
    export SNS_TOPIC_ARN
}

# Create Secrets Manager secrets
create_secrets() {
    log_info "Creating Secrets Manager secrets..."
    
    # Database secret
    aws secretsmanager create-secret \
        --name vaultsphere/database \
        --description "Database credentials for VaultSphere" \
        --secret-string '{"DATABASE_URL":"postgresql://username:password@host:5432/database"}' \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "Database secret already exists."
    
    # JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    aws secretsmanager create-secret \
        --name vaultsphere/jwt \
        --description "JWT secret for VaultSphere" \
        --secret-string "{\"JWT_SECRET\":\"${JWT_SECRET}\"}" \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "JWT secret already exists."
    
    # Application secrets
    aws secretsmanager create-secret \
        --name vaultsphere/application \
        --description "Application secrets for VaultSphere" \
        --secret-string "{\"SNS_TOPIC_ARN\":\"${SNS_TOPIC_ARN}\"}" \
        --tags Key=Environment,Value=${ENVIRONMENT} Key=Project,Value=${PROJECT_NAME} \
        --region ${AWS_REGION} 2>/dev/null || \
        log_info "Application secret already exists."
    
    log_success "Secrets Manager secrets created successfully."
}

# Generate deployment configuration
generate_deployment_config() {
    log_info "Generating deployment configuration..."
    
    # Update task definition with actual values
    sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/REGION/${AWS_REGION}/g" infrastructure/ecs-task-definition.json > /tmp/ecs-task-definition-updated.json
    
    # Update service definition with actual values
    sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/REGION/${AWS_REGION}/g; s/subnet-12345678/${SUBNET_1_ID}/g; s/subnet-87654321/${SUBNET_2_ID}/g; s/sg-vaultsphere-backend/${BACKEND_SG_ID}/g" infrastructure/ecs-service.json > /tmp/ecs-service-updated.json
    
    # Update ALB configuration
    sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/REGION/${AWS_REGION}/g; s/vpc-12345678/${VPC_ID}/g; s/subnet-12345678/${SUBNET_1_ID}/g; s/subnet-87654321/${SUBNET_2_ID}/g; s/sg-vaultsphere-alb/${ALB_SG_ID}/g" infrastructure/alb-config.json > /tmp/alb-config-updated.json
    
    # Create environment file
    cat > .env.production << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=5001

# AWS Configuration
AWS_REGION=${AWS_REGION}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}

# Security
SSL_ENABLED=true
SECRETS_MANAGER_ENABLED=true
MFA_REQUIRED=true

# Monitoring
CLOUDWATCH_ENABLED=true
ALERTS_ENABLED=true
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
AUTH_RATE_LIMIT_MAX=10
PASSWORD_RESET_RATE_LIMIT_MAX=3

# Database (will be overridden by Secrets Manager)
DB_SECRET_NAME=vaultsphere/database

# JWT (will be overridden by Secrets Manager)
JWT_SECRET_NAME=vaultsphere/jwt

# Application (will be overridden by Secrets Manager)
APP_SECRET_NAME=vaultsphere/application

# CloudWatch
CLOUDWATCH_LOG_GROUP=/ecs/${PROJECT_NAME}-backend
CLOUDWATCH_LOG_STREAM=backend

# SNS
SNS_TOPIC_ARN=${SNS_TOPIC_ARN}
EOF
    
    log_success "Deployment configuration generated successfully."
}

# Print summary
print_summary() {
    log_success "Infrastructure setup completed successfully!"
    echo ""
    echo "📋 Summary of created resources:"
    echo "  🌐 VPC ID: ${VPC_ID}"
    echo "  🔒 ALB Security Group: ${ALB_SG_ID}"
    echo "  🔒 Backend Security Group: ${BACKEND_SG_ID}"
    echo "  ⚖️  Load Balancer ARN: ${ALB_ARN}"
    echo "  🎯 Target Group ARN: ${TARGET_GROUP_ARN}"
    echo "  📧 SNS Topic ARN: ${SNS_TOPIC_ARN}"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Update database credentials in Secrets Manager:"
    echo "     aws secretsmanager update-secret --secret-id vaultsphere/database --secret-string '{\"DATABASE_URL\":\"your-actual-database-url\"}'"
    echo ""
    echo "  2. Create SSL certificate in ACM and update ALB listener"
    echo ""
    echo "  3. Deploy the application:"
    echo "     ./scripts/deploy.sh"
    echo ""
    echo "  4. Configure auto-scaling:"
    echo "     aws application-autoscaling register-scalable-target --cli-input-json file://infrastructure/auto-scaling.json"
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/ecs-task-execution-trust-policy.json
    rm -f /tmp/vaultsphere-task-policy.json
    rm -f /tmp/ecr-lifecycle-policy.json
    rm -f /tmp/ecs-task-definition-updated.json
    rm -f /tmp/ecs-service-updated.json
    rm -f /tmp/alb-config-updated.json
}

# Main function
main() {
    log_info "Starting VaultSphere infrastructure setup..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    create_vpc
    create_security_groups
    create_iam_roles
    create_ecr_repository
    create_ecs_cluster
    create_load_balancer
    create_cloudwatch_logs
    create_sns_topic
    create_secrets
    generate_deployment_config
    print_summary
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "vpc")
        check_prerequisites
        create_vpc
        ;;
    "security")
        check_prerequisites
        create_security_groups
        ;;
    "iam")
        create_iam_roles
        ;;
    "ecr")
        create_ecr_repository
        ;;
    "ecs")
        create_ecs_cluster
        ;;
    "alb")
        check_prerequisites
        create_vpc
        create_security_groups
        create_load_balancer
        ;;
    "logs")
        create_cloudwatch_logs
        ;;
    "sns")
        create_sns_topic
        ;;
    "secrets")
        create_secrets
        ;;
    *)
        echo "Usage: $0 {setup|vpc|security|iam|ecr|ecs|alb|logs|sns|secrets}"
        echo "  setup    - Create all infrastructure (default)"
        echo "  vpc      - Create VPC and networking only"
        echo "  security - Create security groups only"
        echo "  iam      - Create IAM roles only"
        echo "  ecr      - Create ECR repository only"
        echo "  ecs      - Create ECS cluster only"
        echo "  alb      - Create Application Load Balancer only"
        echo "  logs     - Create CloudWatch log groups only"
        echo "  sns      - Create SNS topic only"
        echo "  secrets  - Create Secrets Manager secrets only"
        exit 1
        ;;
esac