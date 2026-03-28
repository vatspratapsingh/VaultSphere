#!/usr/bin/env node

/**
 * VaultSphere Monitoring Dashboard
 * 
 * This script provides a comprehensive view of the application's health,
 * performance metrics, and system status.
 */

const axios = require('axios');
const { logger } = require('../config/logger');
const { metrics } = require('../config/cloudwatch');
const { alertManager } = require('../config/alerts');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

class MonitoringDashboard {
  constructor() {
    this.healthData = {};
    this.metricsData = {};
    this.alerts = [];
  }

  /**
   * Fetch health check data
   */
  async fetchHealthData() {
    try {
      const response = await axios.get(`${BASE_URL}/api/health`, {
        timeout: 5000
      });
      this.healthData = response.data;
      return true;
    } catch (error) {
      this.healthData = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      return false;
    }
  }

  /**
   * Fetch metrics data
   */
  async fetchMetricsData() {
    try {
      const response = await axios.get(`${BASE_URL}/api/metrics`, {
        timeout: 5000
      });
      this.metricsData = this.parsePrometheusMetrics(response.data);
      return true;
    } catch (error) {
      this.metricsData = {
        error: error.message
      };
      return false;
    }
  }

  /**
   * Parse Prometheus-style metrics
   */
  parsePrometheusMetrics(metricsText) {
    const metrics = {};
    const lines = metricsText.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      
      const [metricName, value] = line.split(' ');
      if (metricName && value) {
        metrics[metricName] = parseFloat(value);
      }
    }
    
    return metrics;
  }

  /**
   * Check system thresholds and generate alerts
   */
  async checkThresholds() {
    const alerts = [];
    
    // Check memory usage
    if (this.healthData.memory) {
      const memoryUsageMB = parseInt(this.healthData.memory.rss);
      if (memoryUsageMB > 512) {
        alerts.push({
          type: 'MEMORY',
          severity: 'HIGH',
          message: `High memory usage: ${memoryUsageMB}MB`,
          threshold: '512MB'
        });
      }
    }
    
    // Check response time
    if (this.healthData.responseTime) {
      const responseTimeMs = parseInt(this.healthData.responseTime);
      if (responseTimeMs > 2000) {
        alerts.push({
          type: 'PERFORMANCE',
          severity: 'MEDIUM',
          message: `Slow health check response: ${responseTimeMs}ms`,
          threshold: '2000ms'
        });
      }
    }
    
    // Check database response time
    if (this.healthData.database && this.healthData.database.responseTime) {
      const dbResponseTimeMs = parseInt(this.healthData.database.responseTime);
      if (dbResponseTimeMs > 1000) {
        alerts.push({
          type: 'DATABASE',
          severity: 'HIGH',
          message: `Slow database response: ${dbResponseTimeMs}ms`,
          threshold: '1000ms'
        });
      }
    }
    
    // Check if service is down
    if (this.healthData.status !== 'healthy') {
      alerts.push({
        type: 'SYSTEM',
        severity: 'CRITICAL',
        message: `Service is unhealthy: ${this.healthData.error || 'Unknown error'}`,
        threshold: 'healthy'
      });
    }
    
    this.alerts = alerts;
    return alerts;
  }

  /**
   * Send alerts for threshold violations
   */
  async sendAlerts() {
    for (const alert of this.alerts) {
      try {
        await alertManager.sendAlert(
          alert.type,
          alert.severity,
          `Monitoring Alert: ${alert.type}`,
          alert.message,
          {
            threshold: alert.threshold,
            timestamp: new Date().toISOString(),
            source: 'monitoring-dashboard'
          }
        );
      } catch (error) {
        console.error('Failed to send alert:', error.message);
      }
    }
  }

  /**
   * Display dashboard in console
   */
  displayDashboard() {
    console.clear();
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    VaultSphere Monitoring Dashboard          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log();
    
    // System Status
    console.log('🖥️  SYSTEM STATUS');
    console.log('─'.repeat(60));
    console.log(`Status: ${this.getStatusIcon()} ${this.healthData.status || 'unknown'}`);
    console.log(`Uptime: ${this.formatUptime(this.healthData.uptime)}`);
    console.log(`Environment: ${this.healthData.environment || 'unknown'}`);
    console.log(`Timestamp: ${this.healthData.timestamp || 'unknown'}`);
    console.log();
    
    // Memory Usage
    if (this.healthData.memory) {
      console.log('💾 MEMORY USAGE');
      console.log('─'.repeat(60));
      console.log(`RSS: ${this.healthData.memory.rss}`);
      console.log(`Heap Total: ${this.healthData.memory.heapTotal}`);
      console.log(`Heap Used: ${this.healthData.memory.heapUsed}`);
      console.log(`External: ${this.healthData.memory.external || 'N/A'}`);
      console.log();
    }
    
    // Database Status
    if (this.healthData.database) {
      console.log('🗄️  DATABASE STATUS');
      console.log('─'.repeat(60));
      console.log(`Status: ${this.getStatusIcon(this.healthData.database.status)} ${this.healthData.database.status}`);
      console.log(`Response Time: ${this.healthData.database.responseTime}`);
      console.log();
    }
    
    // Security Features
    if (this.healthData.security) {
      console.log('🛡️  SECURITY FEATURES');
      console.log('─'.repeat(60));
      console.log(`HTTPS: ${this.getBooleanIcon(this.healthData.security.https)}`);
      console.log(`MFA: ${this.getBooleanIcon(this.healthData.security.mfa)}`);
      console.log(`Rate Limiting: ${this.getBooleanIcon(this.healthData.security.rateLimiting)}`);
      console.log(`Logging: ${this.getBooleanIcon(this.healthData.security.logging)}`);
      console.log(`Monitoring: ${this.getBooleanIcon(this.healthData.security.monitoring)}`);
      console.log();
    }
    
    // Performance Metrics
    if (Object.keys(this.metricsData).length > 0) {
      console.log('📊 PERFORMANCE METRICS');
      console.log('─'.repeat(60));
      
      if (this.metricsData['nodejs_memory_usage_rss_bytes']) {
        const rssMB = Math.round(this.metricsData['nodejs_memory_usage_rss_bytes'] / 1024 / 1024);
        console.log(`Memory RSS: ${rssMB}MB`);
      }
      
      if (this.metricsData['nodejs_process_uptime_seconds']) {
        const uptime = this.metricsData['nodejs_process_uptime_seconds'];
        console.log(`Process Uptime: ${this.formatUptime(uptime)}`);
      }
      
      console.log();
    }
    
    // Alerts
    if (this.alerts.length > 0) {
      console.log('🚨 ACTIVE ALERTS');
      console.log('─'.repeat(60));
      for (const alert of this.alerts) {
        const icon = this.getSeverityIcon(alert.severity);
        console.log(`${icon} [${alert.severity}] ${alert.message}`);
      }
      console.log();
    } else {
      console.log('✅ NO ACTIVE ALERTS');
      console.log();
    }
    
    console.log(`Last Updated: ${new Date().toLocaleString()}`);
    console.log('Press Ctrl+C to exit');
  }

  /**
   * Helper methods for display formatting
   */
  getStatusIcon(status = this.healthData.status) {
    switch (status) {
      case 'healthy':
      case 'connected': return '✅';
      case 'unhealthy': return '❌';
      default: return '⚠️';
    }
  }

  getBooleanIcon(value) {
    return value ? '✅ Enabled' : '❌ Disabled';
  }

  getSeverityIcon(severity) {
    switch (severity) {
      case 'CRITICAL': return '🔴';
      case 'HIGH': return '🟠';
      case 'MEDIUM': return '🟡';
      case 'LOW': return '🟢';
      default: return '⚪';
    }
  }

  formatUptime(seconds) {
    if (!seconds) return 'unknown';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Run monitoring check
   */
  async runCheck() {
    console.log('Fetching system data...');
    
    await Promise.all([
      this.fetchHealthData(),
      this.fetchMetricsData()
    ]);
    
    await this.checkThresholds();
    
    if (this.alerts.length > 0) {
      await this.sendAlerts();
    }
    
    this.displayDashboard();
  }

  /**
   * Start continuous monitoring
   */
  startContinuousMonitoring(intervalSeconds = 30) {
    console.log(`Starting continuous monitoring (${intervalSeconds}s intervals)...`);
    
    // Initial check
    this.runCheck();
    
    // Set up interval
    setInterval(() => {
      this.runCheck();
    }, intervalSeconds * 1000);
  }
}

// CLI Interface
if (require.main === module) {
  const dashboard = new MonitoringDashboard();
  
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  switch (command) {
    case 'check':
      dashboard.runCheck();
      break;
      
    case 'watch':
      const interval = parseInt(args[1]) || 30;
      dashboard.startContinuousMonitoring(interval);
      break;
      
    case 'test-alert':
      alertManager.testAlert()
        .then(() => console.log('Test alert sent'))
        .catch(err => console.error('Failed to send test alert:', err.message));
      break;
      
    default:
      console.log('Usage:');
      console.log('  node monitoring-dashboard.js check          # Run single check');
      console.log('  node monitoring-dashboard.js watch [30]     # Continuous monitoring');
      console.log('  node monitoring-dashboard.js test-alert     # Send test alert');
  }
}

module.exports = MonitoringDashboard;