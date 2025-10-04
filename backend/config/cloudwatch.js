const AWS = require('aws-sdk');
const { logger } = require('./logger');

// Configure AWS CloudWatch
const cloudwatch = new AWS.CloudWatch({
  region: process.env.AWS_REGION || 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// CloudWatch namespace for our application
const NAMESPACE = 'VaultSphere/Backend';

/**
 * Send custom metrics to CloudWatch
 */
class CloudWatchMetrics {
  constructor() {
    this.enabled = process.env.CLOUDWATCH_ENABLED === 'true';
    this.batchMetrics = [];
    this.batchTimer = null;
  }

  /**
   * Put a single metric to CloudWatch
   */
  async putMetric(metricName, value, unit = 'Count', dimensions = []) {
    if (!this.enabled) {
      logger.debug('CloudWatch disabled, skipping metric', { metricName, value });
      return;
    }

    try {
      const params = {
        Namespace: NAMESPACE,
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
          Dimensions: dimensions
        }]
      };

      await cloudwatch.putMetricData(params).promise();
      logger.debug('CloudWatch metric sent', { metricName, value, unit });
    } catch (error) {
      logger.error('Failed to send CloudWatch metric', {
        error: error.message,
        metricName,
        value
      });
    }
  }

  /**
   * Batch metrics for efficient sending
   */
  addToBatch(metricName, value, unit = 'Count', dimensions = []) {
    if (!this.enabled) return;

    this.batchMetrics.push({
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: dimensions
    });

    // Send batch when it reaches 20 metrics (CloudWatch limit)
    if (this.batchMetrics.length >= 20) {
      this.sendBatch();
    } else {
      // Set timer to send batch after 30 seconds
      if (this.batchTimer) clearTimeout(this.batchTimer);
      this.batchTimer = setTimeout(() => this.sendBatch(), 30000);
    }
  }

  /**
   * Send batched metrics to CloudWatch
   */
  async sendBatch() {
    if (!this.enabled || this.batchMetrics.length === 0) return;

    try {
      const params = {
        Namespace: NAMESPACE,
        MetricData: this.batchMetrics.splice(0, 20) // Take up to 20 metrics
      };

      await cloudwatch.putMetricData(params).promise();
      logger.debug('CloudWatch batch metrics sent', { count: params.MetricData.length });

      // If there are more metrics, send them
      if (this.batchMetrics.length > 0) {
        setTimeout(() => this.sendBatch(), 1000);
      }
    } catch (error) {
      logger.error('Failed to send CloudWatch batch metrics', {
        error: error.message,
        count: this.batchMetrics.length
      });
    }

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Application-specific metrics
   */
  async recordLogin(success = true, mfaUsed = false) {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
    ];

    if (success) {
      this.addToBatch('LoginSuccess', 1, 'Count', dimensions);
      if (mfaUsed) {
        this.addToBatch('MFALogin', 1, 'Count', dimensions);
      }
    } else {
      this.addToBatch('LoginFailure', 1, 'Count', dimensions);
    }
  }

  async recordAPICall(endpoint, method, statusCode, duration) {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
      { Name: 'Endpoint', Value: endpoint },
      { Name: 'Method', Value: method },
      { Name: 'StatusCode', Value: statusCode.toString() }
    ];

    this.addToBatch('APICall', 1, 'Count', dimensions);
    this.addToBatch('ResponseTime', duration, 'Milliseconds', dimensions);

    // Record error rates
    if (statusCode >= 400) {
      this.addToBatch('APIError', 1, 'Count', dimensions);
    }
  }

  async recordSecurityEvent(eventType, severity = 'Medium') {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
      { Name: 'EventType', Value: eventType },
      { Name: 'Severity', Value: severity }
    ];

    this.addToBatch('SecurityEvent', 1, 'Count', dimensions);
  }

  async recordDatabaseQuery(operation, duration, success = true) {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
      { Name: 'Operation', Value: operation }
    ];

    this.addToBatch('DatabaseQuery', 1, 'Count', dimensions);
    this.addToBatch('DatabaseQueryTime', duration, 'Milliseconds', dimensions);

    if (!success) {
      this.addToBatch('DatabaseError', 1, 'Count', dimensions);
    }
  }

  async recordSystemMetrics() {
    const memUsage = process.memoryUsage();
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
    ];

    // Memory metrics
    this.addToBatch('MemoryUsage.RSS', memUsage.rss / 1024 / 1024, 'Megabytes', dimensions);
    this.addToBatch('MemoryUsage.HeapUsed', memUsage.heapUsed / 1024 / 1024, 'Megabytes', dimensions);
    this.addToBatch('MemoryUsage.HeapTotal', memUsage.heapTotal / 1024 / 1024, 'Megabytes', dimensions);

    // Process uptime
    this.addToBatch('ProcessUptime', process.uptime(), 'Seconds', dimensions);
  }

  /**
   * Create CloudWatch alarms
   */
  async createAlarms() {
    if (!this.enabled) return;

    const alarms = [
      {
        AlarmName: 'VaultSphere-HighErrorRate',
        AlarmDescription: 'High error rate detected',
        MetricName: 'APIError',
        Namespace: NAMESPACE,
        Statistic: 'Sum',
        Period: 300, // 5 minutes
        EvaluationPeriods: 2,
        Threshold: 10,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
        ]
      },
      {
        AlarmName: 'VaultSphere-HighResponseTime',
        AlarmDescription: 'High response time detected',
        MetricName: 'ResponseTime',
        Namespace: NAMESPACE,
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 5000, // 5 seconds
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
        ]
      },
      {
        AlarmName: 'VaultSphere-SecurityEvents',
        AlarmDescription: 'Multiple security events detected',
        MetricName: 'SecurityEvent',
        Namespace: NAMESPACE,
        Statistic: 'Sum',
        Period: 300,
        EvaluationPeriods: 1,
        Threshold: 5,
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
        ]
      },
      {
        AlarmName: 'VaultSphere-HighMemoryUsage',
        AlarmDescription: 'High memory usage detected',
        MetricName: 'MemoryUsage.RSS',
        Namespace: NAMESPACE,
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 512, // 512 MB
        ComparisonOperator: 'GreaterThanThreshold',
        Dimensions: [
          { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
        ]
      }
    ];

    for (const alarm of alarms) {
      try {
        await cloudwatch.putMetricAlarm(alarm).promise();
        logger.info('CloudWatch alarm created', { alarmName: alarm.AlarmName });
      } catch (error) {
        logger.error('Failed to create CloudWatch alarm', {
          error: error.message,
          alarmName: alarm.AlarmName
        });
      }
    }
  }

  /**
   * Cleanup on shutdown
   */
  async shutdown() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    // Send any remaining metrics
    if (this.batchMetrics.length > 0) {
      await this.sendBatch();
    }
  }
}

// Create singleton instance
const metrics = new CloudWatchMetrics();

// Start system metrics collection
if (metrics.enabled) {
  setInterval(() => {
    metrics.recordSystemMetrics();
  }, 60000); // Every minute

  // Create alarms on startup (only in production)
  if (process.env.NODE_ENV === 'production') {
    setTimeout(() => {
      metrics.createAlarms();
    }, 5000); // Wait 5 seconds after startup
  }
}

module.exports = {
  metrics,
  CloudWatchMetrics
};