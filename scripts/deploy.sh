#!/bin/bash

# VaultSphere Deployment Script
# This script handles the complete deployment process for VaultSphere

set -e

# Configuration
AWS_REGION=${AWS_REGION:-"eu-north-1"}
AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID:-"123456789012"}
ECR_REPOSITORY="vaultsphere-backend"
ECS_CLUSTER="vaultsphere-cluster"
ECS_SERVICE="vaultsphere-backend-service"
IMAGE_TAG=${IMAGE_TAG:-"latest"}

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
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install it first."
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
    
    log_success "All prerequisites are met."
}

# Build Docker image
build_image() {
    log_info "Building Docker image..."
    
    cd backend
    
    # Build the image
    docker build -t ${ECR_REPOSITORY}:${IMAGE_TAG} .
    
    # Tag for ECR
    docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}
    
    cd ..
    
    log_success "Docker image built successfully."
}

# Push image to ECR
push_to_ecr() {
    log_info "Pushing image to ECR..."
    
    # Login to ECR
    aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    
    # Create repository if it doesn't exist
    aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null || \
    aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
    
    # Push the image
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:${IMAGE_TAG}
    
    log_success "Image pushed to ECR successfully."
}

# Create ECS cluster if it doesn't exist
create_cluster() {
    log_info "Checking ECS cluster..."
    
    if ! aws ecs describe-clusters --clusters ${ECS_CLUSTER} --region ${AWS_REGION} &> /dev/null; then
        log_info "Creating ECS cluster..."
        aws ecs create-cluster --cluster-name ${ECS_CLUSTER} --region ${AWS_REGION}
        log_success "ECS cluster created successfully."
    else
        log_info "ECS cluster already exists."
    fi
}

# Register task definition
register_task_definition() {
    log_info "Registering ECS task definition..."
    
    # Update task definition with current image
    sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/REGION/${AWS_REGION}/g" infrastructure/ecs-task-definition.json > /tmp/task-definition.json
    
    # Register the task definition
    aws ecs register-task-definition --cli-input-json file:///tmp/task-definition.json --region ${AWS_REGION}
    
    log_success "Task definition registered successfully."
}

# Create or update ECS service
deploy_service() {
    log_info "Deploying ECS service..."
    
    # Check if service exists
    if aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION} | jq -r '.services[0].status' | grep -q "ACTIVE"; then
        log_info "Updating existing service..."
        aws ecs update-service --cluster ${ECS_CLUSTER} --service ${ECS_SERVICE} --task-definition vaultsphere-backend --region ${AWS_REGION}
    else
        log_info "Creating new service..."
        # Update service definition with current values
        sed "s/ACCOUNT_ID/${AWS_ACCOUNT_ID}/g; s/REGION/${AWS_REGION}/g" infrastructure/ecs-service.json > /tmp/service-definition.json
        aws ecs create-service --cli-input-json file:///tmp/service-definition.json --region ${AWS_REGION}
    fi
    
    log_success "ECS service deployed successfully."
}

# Wait for deployment to complete
wait_for_deployment() {
    log_info "Waiting for deployment to complete..."
    
    aws ecs wait services-stable --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}
    
    log_success "Deployment completed successfully."
}

# Setup auto-scaling
setup_autoscaling() {
    log_info "Setting up auto-scaling..."
    
    # Register scalable target
    aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --resource-id service/${ECS_CLUSTER}/${ECS_SERVICE} \
        --scalable-dimension ecs:service:DesiredCount \
        --min-capacity 2 \
        --max-capacity 10 \
        --region ${AWS_REGION} || log_warning "Scalable target may already exist"
    
    # Create scaling policies
    aws application-autoscaling put-scaling-policy \
        --policy-name ${ECS_SERVICE}-cpu-scaling \
        --service-namespace ecs \
        --resource-id service/${ECS_CLUSTER}/${ECS_SERVICE} \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration file://infrastructure/auto-scaling.json \
        --region ${AWS_REGION} || log_warning "Scaling policy may already exist"
    
    log_success "Auto-scaling configured successfully."
}

# Health check
health_check() {
    log_info "Performing health check..."
    
    # Get service endpoint
    LOAD_BALANCER_DNS=$(aws elbv2 describe-load-balancers --names vaultsphere-alb --region ${AWS_REGION} --query 'LoadBalancers[0].DNSName' --output text 2>/dev/null || echo "")
    
    if [ -n "$LOAD_BALANCER_DNS" ]; then
        log_info "Testing health endpoint: https://${LOAD_BALANCER_DNS}/api/health"
        
        # Wait a bit for the service to be ready
        sleep 30
        
        # Test health endpoint
        if curl -f -s "https://${LOAD_BALANCER_DNS}/api/health" > /dev/null; then
            log_success "Health check passed!"
        else
            log_warning "Health check failed. Service may still be starting up."
        fi
    else
        log_warning "Load balancer not found. Skipping health check."
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/task-definition.json /tmp/service-definition.json
}

# Main deployment function
main() {
    log_info "Starting VaultSphere deployment..."
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    check_prerequisites
    build_image
    push_to_ecr
    create_cluster
    register_task_definition
    deploy_service
    wait_for_deployment
    setup_autoscaling
    health_check
    
    log_success "VaultSphere deployment completed successfully!"
    log_info "Your application should be available at the load balancer endpoint."
}

# Handle script arguments
case "${1:-deploy}" in
    "build")
        check_prerequisites
        build_image
        ;;
    "push")
        check_prerequisites
        push_to_ecr
        ;;
    "deploy")
        main
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Usage: $0 {build|push|deploy|health}"
        echo "  build  - Build Docker image only"
        echo "  push   - Push image to ECR only"
        echo "  deploy - Full deployment (default)"
        echo "  health - Health check only"
        exit 1
        ;;
esac