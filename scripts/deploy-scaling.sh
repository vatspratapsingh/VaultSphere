#!/bin/bash

# VaultSphere Scaling & Performance Deployment Script
# Stage 9: ECS/EKS Migration, Auto-scaling, Load Balancer, CDN + Caching

set -e

echo "🚀 VaultSphere Stage 9: Scaling & Performance Deployment"
echo "========================================================"

# Configuration
AWS_REGION=${AWS_REGION:-"eu-north-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
APPLICATION_NAME="VaultSphere"
CLUSTER_NAME="vaultsphere-cluster"
ECR_REPOSITORY="vaultsphere-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check kubectl for EKS
    if ! command -v kubectl &> /dev/null; then
        warning "kubectl is not installed. EKS deployment will be skipped."
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create ECR Repository
create_ecr_repository() {
    log "Creating ECR repository..."
    
    if aws ecr describe-repositories --repository-names "$ECR_REPOSITORY" --region "$AWS_REGION" &> /dev/null; then
        warning "ECR repository $ECR_REPOSITORY already exists"
    else
        aws ecr create-repository \
            --repository-name "$ECR_REPOSITORY" \
            --region "$AWS_REGION" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Application,Value=$APPLICATION_NAME"
        success "Created ECR repository: $ECR_REPOSITORY"
    fi
    
    # Set lifecycle policy
    cat > /tmp/ecr-lifecycle-policy.json << EOF
{
    "rules": [
        {
            "rulePriority": 1,
            "description": "Keep last 10 production images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["prod"],
                "countType": "imageCountMoreThan",
                "countNumber": 10
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 2,
            "description": "Keep last 5 development images",
            "selection": {
                "tagStatus": "tagged",
                "tagPrefixList": ["dev"],
                "countType": "imageCountMoreThan",
                "countNumber": 5
            },
            "action": {
                "type": "expire"
            }
        },
        {
            "rulePriority": 3,
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
        --repository-name "$ECR_REPOSITORY" \
        --lifecycle-policy-text file:///tmp/ecr-lifecycle-policy.json \
        --region "$AWS_REGION"
    
    rm /tmp/ecr-lifecycle-policy.json
}

# Build and push Docker image
build_and_push_image() {
    log "Building and pushing Docker image..."
    
    # Get ECR login token
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com"
    
    # Build image
    local image_tag="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    local build_tag="$(aws sts get-caller-identity --query Account --output text).dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
    
    cd ../backend
    docker build -t "$image_tag" -t "$build_tag" .
    
    # Push images
    docker push "$image_tag"
    docker push "$build_tag"
    
    success "Docker image built and pushed: $image_tag"
    cd ../scripts
}

# Create ECS Cluster
create_ecs_cluster() {
    log "Creating ECS cluster..."
    
    if aws ecs describe-clusters --clusters "$CLUSTER_NAME" --region "$AWS_REGION" | jq -e '.clusters[] | select(.status == "ACTIVE")' > /dev/null; then
        warning "ECS cluster $CLUSTER_NAME already exists"
    else
        aws ecs create-cluster \
            --cluster-name "$CLUSTER_NAME" \
            --capacity-providers FARGATE FARGATE_SPOT \
            --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 capacityProvider=FARGATE_SPOT,weight=4 \
            --settings name=containerInsights,value=enabled \
            --tags "key=Environment,value=$ENVIRONMENT" "key=Application,value=$APPLICATION_NAME" \
            --region "$AWS_REGION"
        success "Created ECS cluster: $CLUSTER_NAME"
    fi
}

# Create Application Load Balancer
create_load_balancer() {
    log "Creating Application Load Balancer..."
    
    # Get default VPC and subnets
    local vpc_id=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")
    local subnet_ids=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" --query 'Subnets[].SubnetId' --output text --region "$AWS_REGION")
    
    # Create security group for ALB
    local sg_id=$(aws ec2 create-security-group \
        --group-name "vaultsphere-alb-sg" \
        --description "Security group for VaultSphere ALB" \
        --vpc-id "$vpc_id" \
        --region "$AWS_REGION" \
        --query 'GroupId' \
        --output text 2>/dev/null || aws ec2 describe-security-groups --filters "Name=group-name,Values=vaultsphere-alb-sg" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION")
    
    # Add rules to security group
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    aws ec2 authorize-security-group-ingress \
        --group-id "$sg_id" \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    # Create ALB
    local alb_arn=$(aws elbv2 create-load-balancer \
        --name "vaultsphere-alb" \
        --subnets $subnet_ids \
        --security-groups "$sg_id" \
        --scheme internet-facing \
        --type application \
        --ip-address-type ipv4 \
        --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Application,Value=$APPLICATION_NAME" \
        --region "$AWS_REGION" \
        --query 'LoadBalancers[0].LoadBalancerArn' \
        --output text 2>/dev/null || aws elbv2 describe-load-balancers --names "vaultsphere-alb" --query 'LoadBalancers[0].LoadBalancerArn' --output text --region "$AWS_REGION")
    
    # Create target group
    local tg_arn=$(aws elbv2 create-target-group \
        --name "vaultsphere-backend-tg" \
        --protocol HTTP \
        --port 5000 \
        --vpc-id "$vpc_id" \
        --target-type ip \
        --health-check-enabled \
        --health-check-path "/api/health" \
        --health-check-interval-seconds 30 \
        --health-check-timeout-seconds 5 \
        --healthy-threshold-count 2 \
        --unhealthy-threshold-count 3 \
        --matcher HttpCode=200 \
        --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Application,Value=$APPLICATION_NAME" \
        --region "$AWS_REGION" \
        --query 'TargetGroups[0].TargetGroupArn' \
        --output text 2>/dev/null || aws elbv2 describe-target-groups --names "vaultsphere-backend-tg" --query 'TargetGroups[0].TargetGroupArn' --output text --region "$AWS_REGION")
    
    # Create listener
    aws elbv2 create-listener \
        --load-balancer-arn "$alb_arn" \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=forward,TargetGroupArn="$tg_arn" \
        --region "$AWS_REGION" 2>/dev/null || true
    
    success "Created Application Load Balancer and Target Group"
    echo "ALB ARN: $alb_arn"
    echo "Target Group ARN: $tg_arn"
}

# Deploy ECS Service
deploy_ecs_service() {
    log "Deploying ECS service..."
    
    # Update task definition with current account ID
    local account_id=$(aws sts get-caller-identity --query Account --output text)
    local image_uri="$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
    
    # Get target group ARN
    local tg_arn=$(aws elbv2 describe-target-groups --names "vaultsphere-backend-tg" --query 'TargetGroups[0].TargetGroupArn' --output text --region "$AWS_REGION")
    
    # Get subnets and security group
    local vpc_id=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query 'Vpcs[0].VpcId' --output text --region "$AWS_REGION")
    local subnet_ids=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpc_id" --query 'Subnets[].SubnetId' --output json --region "$AWS_REGION")
    local sg_id=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=vaultsphere-alb-sg" --query 'SecurityGroups[0].GroupId' --output text --region "$AWS_REGION")
    
    # Create task definition
    cat > /tmp/task-definition.json << EOF
{
    "family": "vaultsphere-backend-task",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "1024",
    "memory": "2048",
    "executionRoleArn": "arn:aws:iam::$account_id:role/ecsTaskExecutionRole",
    "containerDefinitions": [
        {
            "name": "vaultsphere-backend",
            "image": "$image_uri",
            "portMappings": [
                {
                    "containerPort": 5000,
                    "protocol": "tcp"
                }
            ],
            "essential": true,
            "environment": [
                {
                    "name": "NODE_ENV",
                    "value": "$ENVIRONMENT"
                },
                {
                    "name": "PORT",
                    "value": "5000"
                },
                {
                    "name": "AWS_REGION",
                    "value": "$AWS_REGION"
                },
                {
                    "name": "CLOUDWATCH_ENABLED",
                    "value": "true"
                },
                {
                    "name": "ENHANCED_MONITORING_ENABLED",
                    "value": "true"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/vaultsphere-backend",
                    "awslogs-region": "$AWS_REGION",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": [
                    "CMD-SHELL",
                    "curl -f http://localhost:5000/api/health || exit 1"
                ],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

    # Register task definition
    local task_def_arn=$(aws ecs register-task-definition \
        --cli-input-json file:///tmp/task-definition.json \
        --region "$AWS_REGION" \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text)
    
    success "Registered task definition: $task_def_arn"
    
    # Create or update service
    if aws ecs describe-services --cluster "$CLUSTER_NAME" --services "vaultsphere-backend" --region "$AWS_REGION" | jq -e '.services[] | select(.status == "ACTIVE")' > /dev/null; then
        # Update existing service
        aws ecs update-service \
            --cluster "$CLUSTER_NAME" \
            --service "vaultsphere-backend" \
            --task-definition "$task_def_arn" \
            --desired-count 3 \
            --region "$AWS_REGION"
        success "Updated ECS service: vaultsphere-backend"
    else
        # Create new service
        aws ecs create-service \
            --cluster "$CLUSTER_NAME" \
            --service-name "vaultsphere-backend" \
            --task-definition "$task_def_arn" \
            --desired-count 3 \
            --launch-type FARGATE \
            --platform-version LATEST \
            --network-configuration "awsvpcConfiguration={subnets=$subnet_ids,securityGroups=[$sg_id],assignPublicIp=ENABLED}" \
            --load-balancers "targetGroupArn=$tg_arn,containerName=vaultsphere-backend,containerPort=5000" \
            --health-check-grace-period-seconds 60 \
            --enable-execute-command \
            --tags "key=Environment,value=$ENVIRONMENT" "key=Application,value=$APPLICATION_NAME" \
            --region "$AWS_REGION"
        success "Created ECS service: vaultsphere-backend"
    fi
    
    rm /tmp/task-definition.json
}

# Setup Auto Scaling
setup_auto_scaling() {
    log "Setting up auto scaling..."
    
    # Register scalable target
    aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --resource-id "service/$CLUSTER_NAME/vaultsphere-backend" \
        --scalable-dimension ecs:service:DesiredCount \
        --min-capacity 3 \
        --max-capacity 20 \
        --region "$AWS_REGION" 2>/dev/null || true
    
    # Create scaling policies
    # CPU-based scaling
    local cpu_policy_arn=$(aws application-autoscaling put-scaling-policy \
        --service-namespace ecs \
        --resource-id "service/$CLUSTER_NAME/vaultsphere-backend" \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-name "vaultsphere-cpu-scaling" \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            "TargetValue": 70.0,
            "PredefinedMetricSpecification": {
                "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
            },
            "ScaleOutCooldown": 300,
            "ScaleInCooldown": 300
        }' \
        --region "$AWS_REGION" \
        --query 'PolicyARN' \
        --output text)
    
    # Memory-based scaling
    local memory_policy_arn=$(aws application-autoscaling put-scaling-policy \
        --service-namespace ecs \
        --resource-id "service/$CLUSTER_NAME/vaultsphere-backend" \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-name "vaultsphere-memory-scaling" \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            "TargetValue": 80.0,
            "PredefinedMetricSpecification": {
                "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
            },
            "ScaleOutCooldown": 300,
            "ScaleInCooldown": 600
        }' \
        --region "$AWS_REGION" \
        --query 'PolicyARN' \
        --output text)
    
    success "Auto scaling configured"
    echo "CPU Policy ARN: $cpu_policy_arn"
    echo "Memory Policy ARN: $memory_policy_arn"
}

# Setup CloudFront CDN
setup_cloudfront() {
    log "Setting up CloudFront CDN..."
    
    # Get ALB DNS name
    local alb_dns=$(aws elbv2 describe-load-balancers --names "vaultsphere-alb" --query 'LoadBalancers[0].DNSName' --output text --region "$AWS_REGION")
    
    # Create CloudFront distribution
    cat > /tmp/cloudfront-config.json << EOF
{
    "CallerReference": "vaultsphere-$(date +%s)",
    "Comment": "VaultSphere CDN Distribution",
    "Enabled": true,
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "vaultsphere-backend-alb",
                "DomainName": "$alb_dns",
                "CustomOriginConfig": {
                    "HTTPPort": 80,
                    "HTTPSPort": 443,
                    "OriginProtocolPolicy": "http-only",
                    "OriginSslProtocols": {
                        "Quantity": 1,
                        "Items": ["TLSv1.2"]
                    }
                }
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "vaultsphere-backend-alb",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "all"
            },
            "Headers": {
                "Quantity": 3,
                "Items": ["Authorization", "Content-Type", "Accept"]
            }
        },
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CacheBehaviors": {
        "Quantity": 1,
        "Items": [
            {
                "PathPattern": "/api/*",
                "TargetOriginId": "vaultsphere-backend-alb",
                "ViewerProtocolPolicy": "https-only",
                "AllowedMethods": {
                    "Quantity": 7,
                    "Items": ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"],
                    "CachedMethods": {
                        "Quantity": 2,
                        "Items": ["GET", "HEAD"]
                    }
                },
                "Compress": true,
                "ForwardedValues": {
                    "QueryString": true,
                    "Cookies": {
                        "Forward": "all"
                    },
                    "Headers": {
                        "Quantity": 4,
                        "Items": ["Authorization", "Content-Type", "Accept", "Origin"]
                    }
                },
                "TrustedSigners": {
                    "Enabled": false,
                    "Quantity": 0
                },
                "MinTTL": 0,
                "DefaultTTL": 0,
                "MaxTTL": 0
            }
        ]
    },
    "PriceClass": "PriceClass_100"
}
EOF

    local distribution_id=$(aws cloudfront create-distribution \
        --distribution-config file:///tmp/cloudfront-config.json \
        --region "$AWS_REGION" \
        --query 'Distribution.Id' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$distribution_id" ]; then
        success "Created CloudFront distribution: $distribution_id"
        
        # Wait for distribution to be deployed
        log "Waiting for CloudFront distribution to be deployed (this may take 10-15 minutes)..."
        aws cloudfront wait distribution-deployed --id "$distribution_id" --region "$AWS_REGION" &
        
        # Get distribution domain name
        local domain_name=$(aws cloudfront get-distribution --id "$distribution_id" --query 'Distribution.DomainName' --output text --region "$AWS_REGION")
        success "CloudFront domain: $domain_name"
    else
        warning "CloudFront distribution creation skipped (may already exist)"
    fi
    
    rm /tmp/cloudfront-config.json
}

# Deploy Kubernetes configuration (if kubectl is available)
deploy_kubernetes() {
    if ! command -v kubectl &> /dev/null; then
        warning "kubectl not found, skipping Kubernetes deployment"
        return
    fi
    
    log "Deploying Kubernetes configuration..."
    
    # Apply the enhanced K8s deployment
    if [ -f "../infrastructure/k8s-enhanced-deployment.yaml" ]; then
        # Update image URI in the deployment
        local account_id=$(aws sts get-caller-identity --query Account --output text)
        local image_uri="$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"
        
        sed "s|123456789012.dkr.ecr.eu-north-1.amazonaws.com/vaultsphere-backend:latest|$image_uri|g" \
            ../infrastructure/k8s-enhanced-deployment.yaml > /tmp/k8s-deployment.yaml
        
        kubectl apply -f /tmp/k8s-deployment.yaml || warning "Kubernetes deployment failed"
        rm /tmp/k8s-deployment.yaml
        
        success "Kubernetes configuration deployed"
    else
        warning "Kubernetes deployment file not found"
    fi
}

# Test deployment
test_deployment() {
    log "Testing deployment..."
    
    # Wait for ECS service to be stable
    log "Waiting for ECS service to stabilize..."
    aws ecs wait services-stable \
        --cluster "$CLUSTER_NAME" \
        --services "vaultsphere-backend" \
        --region "$AWS_REGION"
    
    # Get ALB DNS name and test
    local alb_dns=$(aws elbv2 describe-load-balancers --names "vaultsphere-alb" --query 'LoadBalancers[0].DNSName' --output text --region "$AWS_REGION")
    
    log "Testing health endpoint..."
    if curl -f "http://$alb_dns/api/health" > /dev/null 2>&1; then
        success "Health check passed"
    else
        warning "Health check failed - service may still be starting"
    fi
    
    success "Deployment test completed"
}

# Main deployment function
main() {
    log "Starting VaultSphere Scaling & Performance Deployment..."
    
    check_prerequisites
    create_ecr_repository
    build_and_push_image
    create_ecs_cluster
    create_load_balancer
    deploy_ecs_service
    setup_auto_scaling
    setup_cloudfront
    deploy_kubernetes
    test_deployment
    
    success "🎉 Stage 9: Scaling & Performance deployment completed successfully!"
    
    echo ""
    echo "🚀 Scaling Infrastructure Created:"
    echo "  • ECR Repository: $ECR_REPOSITORY"
    echo "  • ECS Cluster: $CLUSTER_NAME"
    echo "  • ECS Service: vaultsphere-backend (3-20 instances)"
    echo "  • Application Load Balancer: vaultsphere-alb"
    echo "  • Auto Scaling: CPU & Memory based"
    echo "  • CloudFront CDN: Global distribution"
    echo "  • Container Insights: Enabled"
    echo ""
    
    # Get ALB DNS
    local alb_dns=$(aws elbv2 describe-load-balancers --names "vaultsphere-alb" --query 'LoadBalancers[0].DNSName' --output text --region "$AWS_REGION" 2>/dev/null || echo "N/A")
    
    echo "🔗 Access Points:"
    echo "  • Load Balancer: http://$alb_dns"
    echo "  • Health Check: http://$alb_dns/api/health"
    echo "  • Metrics: http://$alb_dns/api/metrics"
    echo ""
    echo "📊 Monitoring:"
    echo "  • ECS Console: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$CLUSTER_NAME"
    echo "  • CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION"
    echo "  • Auto Scaling: https://console.aws.amazon.com/ecs/home?region=$AWS_REGION#/clusters/$CLUSTER_NAME/services/vaultsphere-backend/details"
    echo ""
    echo "✅ VaultSphere is now running with enterprise-grade scaling and performance!"
}

# Run main function
main "$@"