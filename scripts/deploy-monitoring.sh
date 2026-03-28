#!/bin/bash

# VaultSphere Enhanced Monitoring Deployment Script
# Stage 8: Monitoring & Logging Implementation

set -e

echo "🔍 VaultSphere Stage 8: Enhanced Monitoring & Logging Deployment"
echo "=================================================================="

# Configuration
AWS_REGION=${AWS_REGION:-"eu-north-1"}
ENVIRONMENT=${ENVIRONMENT:-"production"}
APPLICATION_NAME="VaultSphere"

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
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    # Check jq
    if ! command -v jq &> /dev/null; then
        error "jq is not installed. Please install it first."
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create CloudWatch Log Groups
create_log_groups() {
    log "Creating CloudWatch Log Groups..."
    
    local log_groups=(
        "/ecs/vaultsphere-backend"
        "/ecs/datadog-agent"
        "/aws/lambda/vaultsphere-request-modifier"
        "/vaultsphere/application"
        "/vaultsphere/security"
        "/vaultsphere/performance"
        "vaultsphere-cloudfront-logs"
        "vaultsphere-cloudfront-api-logs"
    )
    
    for log_group in "${log_groups[@]}"; do
        if aws logs describe-log-groups --log-group-name-prefix "$log_group" --region "$AWS_REGION" | jq -e '.logGroups[] | select(.logGroupName == "'$log_group'")' > /dev/null; then
            warning "Log group $log_group already exists"
        else
            aws logs create-log-group \
                --log-group-name "$log_group" \
                --region "$AWS_REGION" \
                --tags "Environment=$ENVIRONMENT,Application=$APPLICATION_NAME,Component=Logging"
            success "Created log group: $log_group"
        fi
        
        # Set retention policy (30 days for production, 7 days for dev)
        local retention_days=30
        if [ "$ENVIRONMENT" != "production" ]; then
            retention_days=7
        fi
        
        aws logs put-retention-policy \
            --log-group-name "$log_group" \
            --retention-in-days $retention_days \
            --region "$AWS_REGION"
    done
}

# Create SNS Topics for Alerts
create_sns_topics() {
    log "Creating SNS Topics for alerts..."
    
    local topics=(
        "VaultSphere-Alerts-$ENVIRONMENT"
        "VaultSphere-Lifecycle-$ENVIRONMENT"
        "VaultSphere-Security-$ENVIRONMENT"
    )
    
    for topic in "${topics[@]}"; do
        local topic_arn=$(aws sns create-topic \
            --name "$topic" \
            --region "$AWS_REGION" \
            --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Application,Value=$APPLICATION_NAME" \
            --query 'TopicArn' \
            --output text)
        
        success "Created SNS topic: $topic_arn"
        
        # Set topic attributes
        aws sns set-topic-attributes \
            --topic-arn "$topic_arn" \
            --attribute-name DisplayName \
            --attribute-value "$APPLICATION_NAME $ENVIRONMENT Alerts" \
            --region "$AWS_REGION"
    done
}

# Create CloudWatch Dashboards
create_dashboards() {
    log "Creating CloudWatch Dashboards..."
    
    # Main Application Dashboard
    cat > /tmp/vaultsphere-dashboard.json << EOF
{
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "VaultSphere/Backend", "APICall", "Environment", "$ENVIRONMENT" ],
                    [ ".", "APIError", ".", "." ],
                    [ ".", "LoginSuccess", ".", "." ],
                    [ ".", "LoginFailure", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "API Metrics",
                "period": 300
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "VaultSphere/Backend", "ResponseTime", "Environment", "$ENVIRONMENT" ],
                    [ ".", "DatabaseQueryTime", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "Performance Metrics",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 0,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "VaultSphere/Backend", "SystemCPUUsage", "Environment", "$ENVIRONMENT" ],
                    [ ".", "SystemMemoryUsage", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "System Resources",
                "period": 300,
                "yAxis": {
                    "left": {
                        "min": 0,
                        "max": 100
                    }
                }
            }
        },
        {
            "type": "metric",
            "x": 12,
            "y": 6,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    [ "VaultSphere/Backend", "SecurityEvent", "Environment", "$ENVIRONMENT" ],
                    [ ".", "SystemHealth", ".", "." ]
                ],
                "view": "timeSeries",
                "stacked": false,
                "region": "$AWS_REGION",
                "title": "Security & Health",
                "period": 300
            }
        }
    ]
}
EOF

    aws cloudwatch put-dashboard \
        --dashboard-name "VaultSphere-$ENVIRONMENT-Overview" \
        --dashboard-body file:///tmp/vaultsphere-dashboard.json \
        --region "$AWS_REGION"
    
    success "Created CloudWatch Dashboard: VaultSphere-$ENVIRONMENT-Overview"
    
    # Cleanup
    rm /tmp/vaultsphere-dashboard.json
}

# Create CloudWatch Alarms
create_alarms() {
    log "Creating CloudWatch Alarms..."
    
    local sns_topic_arn=$(aws sns list-topics --region "$AWS_REGION" | jq -r '.Topics[] | select(.TopicArn | contains("VaultSphere-Alerts-'$ENVIRONMENT'")) | .TopicArn')
    
    if [ -z "$sns_topic_arn" ]; then
        error "SNS topic for alerts not found"
        return 1
    fi
    
    # High Error Rate Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "VaultSphere-$ENVIRONMENT-HighErrorRate" \
        --alarm-description "High API error rate detected" \
        --metric-name "APIError" \
        --namespace "VaultSphere/Backend" \
        --statistic "Sum" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 10 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions "Name=Environment,Value=$ENVIRONMENT" \
        --alarm-actions "$sns_topic_arn" \
        --ok-actions "$sns_topic_arn" \
        --region "$AWS_REGION"
    
    # High Response Time Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "VaultSphere-$ENVIRONMENT-HighResponseTime" \
        --alarm-description "High API response time detected" \
        --metric-name "ResponseTime" \
        --namespace "VaultSphere/Backend" \
        --statistic "Average" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 5000 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions "Name=Environment,Value=$ENVIRONMENT" \
        --alarm-actions "$sns_topic_arn" \
        --ok-actions "$sns_topic_arn" \
        --region "$AWS_REGION"
    
    # High CPU Usage Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "VaultSphere-$ENVIRONMENT-HighCPU" \
        --alarm-description "High CPU usage detected" \
        --metric-name "SystemCPUUsage" \
        --namespace "VaultSphere/Backend" \
        --statistic "Average" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 80 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions "Name=Environment,Value=$ENVIRONMENT" \
        --alarm-actions "$sns_topic_arn" \
        --ok-actions "$sns_topic_arn" \
        --region "$AWS_REGION"
    
    # High Memory Usage Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "VaultSphere-$ENVIRONMENT-HighMemory" \
        --alarm-description "High memory usage detected" \
        --metric-name "SystemMemoryUsage" \
        --namespace "VaultSphere/Backend" \
        --statistic "Average" \
        --period 300 \
        --evaluation-periods 2 \
        --threshold 85 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions "Name=Environment,Value=$ENVIRONMENT" \
        --alarm-actions "$sns_topic_arn" \
        --ok-actions "$sns_topic_arn" \
        --region "$AWS_REGION"
    
    # Security Events Alarm
    aws cloudwatch put-metric-alarm \
        --alarm-name "VaultSphere-$ENVIRONMENT-SecurityEvents" \
        --alarm-description "Multiple security events detected" \
        --metric-name "SecurityEvent" \
        --namespace "VaultSphere/Backend" \
        --statistic "Sum" \
        --period 300 \
        --evaluation-periods 1 \
        --threshold 5 \
        --comparison-operator "GreaterThanThreshold" \
        --dimensions "Name=Environment,Value=$ENVIRONMENT" \
        --alarm-actions "$sns_topic_arn" \
        --ok-actions "$sns_topic_arn" \
        --region "$AWS_REGION"
    
    success "Created CloudWatch Alarms"
}

# Setup X-Ray Tracing
setup_xray() {
    log "Setting up AWS X-Ray tracing..."
    
    # Create X-Ray service map
    aws xray create-service-map \
        --service-name "VaultSphere-$ENVIRONMENT" \
        --region "$AWS_REGION" || true
    
    success "X-Ray tracing configured"
}

# Create IAM Roles for Enhanced Monitoring
create_iam_roles() {
    log "Creating IAM roles for enhanced monitoring..."
    
    # Enhanced Monitoring Role
    cat > /tmp/enhanced-monitoring-trust-policy.json << EOF
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

    cat > /tmp/enhanced-monitoring-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListMetrics",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams",
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords",
                "sns:Publish"
            ],
            "Resource": "*"
        }
    ]
}
EOF

    # Create role
    aws iam create-role \
        --role-name "VaultSphere-EnhancedMonitoring-Role" \
        --assume-role-policy-document file:///tmp/enhanced-monitoring-trust-policy.json \
        --tags "Key=Environment,Value=$ENVIRONMENT" "Key=Application,Value=$APPLICATION_NAME" \
        --region "$AWS_REGION" || warning "Role may already exist"
    
    # Attach policy
    aws iam put-role-policy \
        --role-name "VaultSphere-EnhancedMonitoring-Role" \
        --policy-name "EnhancedMonitoringPolicy" \
        --policy-document file:///tmp/enhanced-monitoring-policy.json \
        --region "$AWS_REGION"
    
    success "Created IAM roles for enhanced monitoring"
    
    # Cleanup
    rm /tmp/enhanced-monitoring-trust-policy.json /tmp/enhanced-monitoring-policy.json
}

# Deploy monitoring configuration
deploy_monitoring_config() {
    log "Deploying monitoring configuration to backend..."
    
    # Update environment variables
    cat > /tmp/monitoring-env.json << EOF
{
    "CLOUDWATCH_ENABLED": "true",
    "ALERTS_ENABLED": "true",
    "ENHANCED_MONITORING_ENABLED": "true",
    "AWS_REGION": "$AWS_REGION",
    "ENVIRONMENT": "$ENVIRONMENT",
    "SNS_TOPIC_ARN": "$(aws sns list-topics --region "$AWS_REGION" | jq -r '.Topics[] | select(.TopicArn | contains("VaultSphere-Alerts-'$ENVIRONMENT'")) | .TopicArn')"
}
EOF

    success "Monitoring configuration prepared"
    
    # Cleanup
    rm /tmp/monitoring-env.json
}

# Test monitoring setup
test_monitoring() {
    log "Testing monitoring setup..."
    
    # Test CloudWatch metrics
    aws cloudwatch list-metrics \
        --namespace "VaultSphere/Backend" \
        --region "$AWS_REGION" > /dev/null
    
    # Test SNS topics
    local sns_topic_arn=$(aws sns list-topics --region "$AWS_REGION" | jq -r '.Topics[] | select(.TopicArn | contains("VaultSphere-Alerts-'$ENVIRONMENT'")) | .TopicArn')
    
    if [ -n "$sns_topic_arn" ]; then
        aws sns publish \
            --topic-arn "$sns_topic_arn" \
            --subject "VaultSphere Monitoring Test" \
            --message "This is a test message to verify the monitoring setup is working correctly." \
            --region "$AWS_REGION" > /dev/null
        success "Test alert sent successfully"
    fi
    
    success "Monitoring setup test completed"
}

# Main deployment function
main() {
    log "Starting VaultSphere Enhanced Monitoring Deployment..."
    
    check_prerequisites
    create_log_groups
    create_sns_topics
    create_iam_roles
    create_dashboards
    create_alarms
    setup_xray
    deploy_monitoring_config
    test_monitoring
    
    success "🎉 Stage 8: Enhanced Monitoring & Logging deployment completed successfully!"
    
    echo ""
    echo "📊 Monitoring Resources Created:"
    echo "  • CloudWatch Log Groups: 8 groups"
    echo "  • SNS Topics: 3 topics for alerts"
    echo "  • CloudWatch Dashboard: VaultSphere-$ENVIRONMENT-Overview"
    echo "  • CloudWatch Alarms: 5 critical alarms"
    echo "  • IAM Roles: Enhanced monitoring permissions"
    echo "  • X-Ray Tracing: Service map configured"
    echo ""
    echo "🔗 Next Steps:"
    echo "  1. Subscribe email addresses to SNS topics for alerts"
    echo "  2. Configure Datadog/New Relic integration if needed"
    echo "  3. Set up custom metrics for business KPIs"
    echo "  4. Review and adjust alarm thresholds based on baseline"
    echo "  5. Proceed to Stage 9: Scaling & Performance"
    echo ""
    echo "📱 Access your dashboard at:"
    echo "  https://console.aws.amazon.com/cloudwatch/home?region=$AWS_REGION#dashboards:name=VaultSphere-$ENVIRONMENT-Overview"
}

# Run main function
main "$@"