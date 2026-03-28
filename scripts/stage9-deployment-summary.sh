#!/bin/bash

# VaultSphere Stage 9: Scaling & Performance Deployment Summary
# This script provides a comprehensive overview of the deployed infrastructure

set -e

echo "🚀 VaultSphere Stage 9: Scaling & Performance Infrastructure Summary"
echo "=================================================================="
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Generating comprehensive deployment summary..."
echo

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 INFRASTRUCTURE OVERVIEW${NC}"
echo "================================"
echo

# ECR Repository
echo -e "${GREEN}🐳 Container Registry (ECR)${NC}"
echo "Repository: 687450791196.dkr.ecr.eu-north-1.amazonaws.com/vaultsphere-backend"
aws ecr describe-repositories --repository-names vaultsphere-backend --query 'repositories[0].{Name:repositoryName,URI:repositoryUri,CreatedAt:createdAt}' --output table
echo

# ECS Cluster
echo -e "${GREEN}🏗️ ECS Cluster${NC}"
aws ecs describe-clusters --clusters vaultsphere-cluster --query 'clusters[0].{Name:clusterName,Status:status,ActiveServices:activeServicesCount,RunningTasks:runningTasksCount,PendingTasks:pendingTasksCount}' --output table
echo

# ECS Service
echo -e "${GREEN}🔄 ECS Service${NC}"
aws ecs describe-services --cluster vaultsphere-cluster --services vaultsphere-backend-service --query 'services[0].{Name:serviceName,Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' --output table
echo

# Load Balancer
echo -e "${GREEN}⚖️ Application Load Balancer${NC}"
aws elbv2 describe-load-balancers --names vaultsphere-alb --query 'LoadBalancers[0].{Name:LoadBalancerName,DNSName:DNSName,State:State.Code,Type:Type,Scheme:Scheme}' --output table
echo

# Target Group Health
echo -e "${GREEN}🎯 Target Group Health${NC}"
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --names vaultsphere-backend-tg --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --query 'TargetHealthDescriptions[*].{Target:Target.Id,Port:Target.Port,Health:TargetHealth.State}' --output table
echo

# Auto Scaling
echo -e "${GREEN}📈 Auto Scaling Configuration${NC}"
aws application-autoscaling describe-scalable-targets --service-namespace ecs --resource-ids service/vaultsphere-cluster/vaultsphere-backend-service --query 'ScalableTargets[0].{ResourceId:ResourceId,MinCapacity:MinCapacity,MaxCapacity:MaxCapacity,RoleARN:RoleARN}' --output table
echo

echo -e "${GREEN}📊 Auto Scaling Policies${NC}"
aws application-autoscaling describe-scaling-policies --service-namespace ecs --resource-id service/vaultsphere-cluster/vaultsphere-backend-service --query 'ScalingPolicies[*].{PolicyName:PolicyName,PolicyType:PolicyType,TargetValue:TargetTrackingScalingPolicyConfiguration.TargetValue,MetricType:TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType}' --output table
echo

# CloudFront Distribution
echo -e "${GREEN}🌐 CloudFront CDN Distribution${NC}"
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`VaultSphere Production CDN Distribution`].{Id:Id,DomainName:DomainName,Status:Status,PriceClass:PriceClass,Enabled:Enabled}' --output table
echo

# CloudWatch Alarms
echo -e "${GREEN}🚨 CloudWatch Alarms${NC}"
aws cloudwatch describe-alarms --alarm-names "VaultSphere-HighCPU" "VaultSphere-HighMemory" --query 'MetricAlarms[*].{AlarmName:AlarmName,StateValue:StateValue,MetricName:MetricName,Threshold:Threshold}' --output table
echo

echo -e "${BLUE}🔗 ACCESS ENDPOINTS${NC}"
echo "================================"
echo

# Get ALB DNS name
ALB_DNS=$(aws elbv2 describe-load-balancers --names vaultsphere-alb --query 'LoadBalancers[0].DNSName' --output text)
echo -e "${GREEN}Application Load Balancer:${NC} http://$ALB_DNS"

# Get CloudFront domain
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`VaultSphere Production CDN Distribution`].DomainName' --output text)
echo -e "${GREEN}CloudFront CDN:${NC} https://$CLOUDFRONT_DOMAIN"
echo

echo -e "${BLUE}📋 DEPLOYMENT DETAILS${NC}"
echo "================================"
echo

echo -e "${GREEN}Container Configuration:${NC}"
echo "• CPU: 1024 units (1 vCPU)"
echo "• Memory: 2048 MB (2 GB)"
echo "• Health Check: /health endpoint"
echo "• Logging: CloudWatch Logs (/ecs/vaultsphere-backend)"
echo

echo -e "${GREEN}Auto Scaling Configuration:${NC}"
echo "• Min Capacity: 3 instances"
echo "• Max Capacity: 20 instances"
echo "• CPU Target: 70% utilization"
echo "• Memory Target: 80% utilization"
echo "• Scale-out Cooldown: 5 minutes"
echo "• Scale-in Cooldown: 10 minutes"
echo

echo -e "${GREEN}Load Balancer Configuration:${NC}"
echo "• Health Check Path: /health"
echo "• Health Check Interval: 30 seconds"
echo "• Healthy Threshold: 2 consecutive checks"
echo "• Unhealthy Threshold: 5 consecutive checks"
echo "• Timeout: 5 seconds"
echo

echo -e "${GREEN}CDN Configuration:${NC}"
echo "• Global Distribution: All edge locations"
echo "• HTTPS Redirect: Enabled"
echo "• Compression: Enabled for static content"
echo "• API Caching: Disabled (/api/* paths)"
echo "• Static Caching: 24 hours (/static/* paths)"
echo "• Access Logging: Enabled (S3: vaultsphere-cloudfront-logs)"
echo

echo -e "${BLUE}🔧 OPERATIONAL COMMANDS${NC}"
echo "================================"
echo

echo -e "${GREEN}Monitor ECS Service:${NC}"
echo "aws ecs describe-services --cluster vaultsphere-cluster --services vaultsphere-backend-service"
echo

echo -e "${GREEN}View Container Logs:${NC}"
echo "aws logs tail /ecs/vaultsphere-backend --follow"
echo

echo -e "${GREEN}Check Auto Scaling Activity:${NC}"
echo "aws application-autoscaling describe-scaling-activities --service-namespace ecs --resource-id service/vaultsphere-cluster/vaultsphere-backend-service"
echo

echo -e "${GREEN}Monitor CloudWatch Metrics:${NC}"
echo "aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization --dimensions Name=ServiceName,Value=vaultsphere-backend-service Name=ClusterName,Value=vaultsphere-cluster --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) --end-time $(date -u +%Y-%m-%dT%H:%M:%S) --period 300 --statistics Average"
echo

echo -e "${GREEN}Update Service (Rolling Deployment):${NC}"
echo "aws ecs update-service --cluster vaultsphere-cluster --service vaultsphere-backend-service --force-new-deployment"
echo

echo -e "${BLUE}🎯 PERFORMANCE TESTING${NC}"
echo "================================"
echo

echo -e "${GREEN}Load Test ALB Directly:${NC}"
echo "curl -H 'Host: vaultsphere.com' http://$ALB_DNS/health"
echo

echo -e "${GREEN}Load Test via CloudFront:${NC}"
echo "curl https://$CLOUDFRONT_DOMAIN/health"
echo

echo -e "${GREEN}Stress Test (requires Apache Bench):${NC}"
echo "ab -n 1000 -c 10 http://$ALB_DNS/health"
echo

echo -e "${BLUE}📊 COST OPTIMIZATION${NC}"
echo "================================"
echo

echo -e "${GREEN}Current Configuration Cost Estimate (Monthly):${NC}"
echo "• ECS Fargate (3-20 instances): ~\$50-300"
echo "• Application Load Balancer: ~\$20"
echo "• CloudFront (1TB transfer): ~\$85"
echo "• CloudWatch Logs & Metrics: ~\$10"
echo "• ECR Storage: ~\$5"
echo "• Total Estimated: ~\$170-420/month"
echo

echo -e "${YELLOW}💡 Optimization Tips:${NC}"
echo "• Use Fargate Spot for non-critical workloads (50% cost reduction)"
echo "• Implement intelligent caching to reduce origin requests"
echo "• Monitor and adjust auto-scaling thresholds based on actual usage"
echo "• Use CloudWatch Insights for log analysis to reduce log retention costs"
echo

echo -e "${GREEN}✅ Stage 9 Deployment Complete!${NC}"
echo "================================"
echo "Your VaultSphere application is now running with:"
echo "• Enterprise-grade container orchestration"
echo "• Intelligent auto-scaling (3-20 instances)"
echo "• Global CDN distribution"
echo "• Comprehensive monitoring and alerting"
echo "• Production-ready load balancing"
echo
echo "🌟 Ready for production workloads with automatic scaling!"
echo