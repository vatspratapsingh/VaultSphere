const AWS = require('aws-sdk');
const { logger } = require('./logger');

// Configure AWS SNS
const sns = new AWS.SNS({
  region: process.env.AWS_REGION || 'eu-north-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

/**
 * Alert severity levels
 */
const SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Alert types
 */
const ALERT_TYPES = {
  SECURITY: 'SECURITY',
  PERFORMANCE: 'PERFORMANCE',
  ERROR: 'ERROR',
  SYSTEM: 'SYSTEM',
  DATABASE: 'DATABASE'
};

class AlertManager {
  constructor() {
    this.enabled = process.env.ALERTS_ENABLED === 'true';
    this.snsTopicArn = process.env.SNS_TOPIC_ARN;
    this.alertCooldowns = new Map(); // Prevent spam
    this.alertCounts = new Map(); // Track alert frequency
  }

  /**
   * Send an alert
   */
  async sendAlert(type, severity, title, message, metadata = {}) {
    if (!this.enabled) {
      logger.debug('Alerts disabled, skipping alert', { type, severity, title });
      return;
    }

    try {
      // Check cooldown to prevent spam
      const cooldownKey = `${type}-${title}`;
      if (this.isInCooldown(cooldownKey, severity)) {
        logger.debug('Alert in cooldown, skipping', { type, title });
        return;
      }

      // Increment alert count
      this.incrementAlertCount(cooldownKey);

      const alertData = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        application: 'VaultSphere',
        type,
        severity,
        title,
        message,
        metadata,
        alertCount: this.alertCounts.get(cooldownKey) || 1
      };

      // Send to SNS if configured
      if (this.snsTopicArn) {
        await this.sendSNSAlert(alertData);
      }

      // Log the alert
      logger.warn('Alert Triggered', alertData);

      // Set cooldown
      this.setCooldown(cooldownKey, severity);

    } catch (error) {
      logger.error('Failed to send alert', {
        error: error.message,
        type,
        severity,
        title
      });
    }
  }

  /**
   * Send alert via SNS
   */
  async sendSNSAlert(alertData) {
    const subject = `[${alertData.severity}] ${alertData.application} - ${alertData.title}`;
    const message = JSON.stringify(alertData, null, 2);

    const params = {
      TopicArn: this.snsTopicArn,
      Subject: subject,
      Message: message,
      MessageAttributes: {
        severity: {
          DataType: 'String',
          StringValue: alertData.severity
        },
        type: {
          DataType: 'String',
          StringValue: alertData.type
        },
        environment: {
          DataType: 'String',
          StringValue: alertData.environment
        }
      }
    };

    await sns.publish(params).promise();
    logger.info('SNS alert sent', { subject, topicArn: this.snsTopicArn });
  }

  /**
   * Check if alert is in cooldown period
   */
  isInCooldown(key, severity) {
    const cooldownTime = this.getCooldownTime(severity);
    const lastAlert = this.alertCooldowns.get(key);
    
    if (!lastAlert) return false;
    
    return (Date.now() - lastAlert) < cooldownTime;
  }

  /**
   * Set cooldown for alert
   */
  setCooldown(key, severity) {
    this.alertCooldowns.set(key, Date.now());
    
    // Clean up old cooldowns after they expire
    setTimeout(() => {
      this.alertCooldowns.delete(key);
    }, this.getCooldownTime(severity));
  }

  /**
   * Get cooldown time based on severity
   */
  getCooldownTime(severity) {
    switch (severity) {
      case SEVERITY.CRITICAL: return 5 * 60 * 1000; // 5 minutes
      case SEVERITY.HIGH: return 15 * 60 * 1000; // 15 minutes
      case SEVERITY.MEDIUM: return 30 * 60 * 1000; // 30 minutes
      case SEVERITY.LOW: return 60 * 60 * 1000; // 1 hour
      default: return 30 * 60 * 1000; // 30 minutes
    }
  }

  /**
   * Increment alert count
   */
  incrementAlertCount(key) {
    const count = this.alertCounts.get(key) || 0;
    this.alertCounts.set(key, count + 1);
    
    // Reset count after 24 hours
    setTimeout(() => {
      this.alertCounts.delete(key);
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Predefined alert methods for common scenarios
   */
  async securityAlert(title, message, metadata = {}) {
    await this.sendAlert(
      ALERT_TYPES.SECURITY,
      SEVERITY.HIGH,
      title,
      message,
      metadata
    );
  }

  async criticalError(title, message, metadata = {}) {
    await this.sendAlert(
      ALERT_TYPES.ERROR,
      SEVERITY.CRITICAL,
      title,
      message,
      metadata
    );
  }

  async performanceAlert(title, message, metadata = {}) {
    await this.sendAlert(
      ALERT_TYPES.PERFORMANCE,
      SEVERITY.MEDIUM,
      title,
      message,
      metadata
    );
  }

  async systemAlert(title, message, severity = SEVERITY.MEDIUM, metadata = {}) {
    await this.sendAlert(
      ALERT_TYPES.SYSTEM,
      severity,
      title,
      message,
      metadata
    );
  }

  async databaseAlert(title, message, severity = SEVERITY.HIGH, metadata = {}) {
    await this.sendAlert(
      ALERT_TYPES.DATABASE,
      severity,
      title,
      message,
      metadata
    );
  }

  /**
   * Create SNS topic for alerts
   */
  async createSNSTopic() {
    if (!this.enabled) return;

    try {
      const topicName = `VaultSphere-Alerts-${process.env.NODE_ENV || 'development'}`;
      
      const createParams = {
        Name: topicName,
        Attributes: {
          DisplayName: 'VaultSphere Application Alerts'
        }
      };

      const result = await sns.createTopic(createParams).promise();
      logger.info('SNS topic created', { topicArn: result.TopicArn });
      
      return result.TopicArn;
    } catch (error) {
      logger.error('Failed to create SNS topic', { error: error.message });
      throw error;
    }
  }

  /**
   * Subscribe email to SNS topic
   */
  async subscribeEmail(email, topicArn = null) {
    if (!this.enabled) return;

    const arn = topicArn || this.snsTopicArn;
    if (!arn) {
      throw new Error('SNS Topic ARN not configured');
    }

    try {
      const params = {
        TopicArn: arn,
        Protocol: 'email',
        Endpoint: email
      };

      const result = await sns.subscribe(params).promise();
      logger.info('Email subscribed to alerts', { email, subscriptionArn: result.SubscriptionArn });
      
      return result.SubscriptionArn;
    } catch (error) {
      logger.error('Failed to subscribe email to alerts', { error: error.message, email });
      throw error;
    }
  }

  /**
   * Test alert system
   */
  async testAlert() {
    await this.sendAlert(
      ALERT_TYPES.SYSTEM,
      SEVERITY.LOW,
      'Alert System Test',
      'This is a test alert to verify the alerting system is working correctly.',
      {
        testTime: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      }
    );
  }
}

// Create singleton instance
const alertManager = new AlertManager();

// Export constants and instance
module.exports = {
  alertManager,
  SEVERITY,
  ALERT_TYPES,
  AlertManager
};