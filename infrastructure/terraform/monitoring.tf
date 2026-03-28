# SNS Topic for Monitoring Alerts
resource "aws_sns_topic" "monitoring_alerts" {
  name = "vaultsphere-monitoring-alerts"
}

# SNS Subscription for Email Notifications
resource "aws_sns_topic_subscription" "email_alert" {
  topic_arn = aws_sns_topic.monitoring_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Log Groups for Multi-tenant isolation
resource "aws_cloudwatch_log_group" "log_groups" {
  for_each          = toset(["api", "auth", "ml"])
  name              = "/vaultsphere/${each.key}"
  retention_in_days = 30
}

# CPU Usage Alarm (> 90% for 5 mins)
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "High_CPU_Utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "90"
  alarm_description   = "CPU usage exceeds 90% for 5 minutes"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

# Memory Usage Alarm (> 85% for 5 mins)
resource "aws_cloudwatch_metric_alarm" "mem_high" {
  alarm_name          = "High_Memory_Utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "5"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "60"
  statistic           = "Average"
  threshold           = "85"
  alarm_description   = "Memory usage exceeds 85% for 5 minutes"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
}

# Error Rate Alarm (> 5% in 10-minute window)
resource "aws_cloudwatch_metric_alarm" "error_rate_high" {
  alarm_name          = "High_API_Error_Rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXErrorRate"
  namespace           = "VaultSphere/Metrics"
  period              = "600"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "API 5XX error rate exceeds 5% in 10 minutes"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
}

# DB Connection Exhaustion Alarm
resource "aws_cloudwatch_metric_alarm" "db_connections" {
  alarm_name          = "DB_Connection_Exhaustion"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = "60"
  statistic           = "Maximum"
  threshold           = var.db_max_connections * 0.9
  alarm_description   = "DB connection pool is near exhaustion (> 90%)"
  alarm_actions       = [aws_sns_topic.monitoring_alerts.arn]
  
  dimensions = {
    DBInstanceIdentifier = var.db_instance_id
  }
}
