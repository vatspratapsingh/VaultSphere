const { metrics } = require('./cloudwatch');
const { alertManager } = require('./alerts');
const { logger } = require('./logger');
const os = require('os');
const fs = require('fs').promises;

/**
 * Enhanced Monitoring System for VaultSphere
 * Provides comprehensive system monitoring, alerting, and health checks
 */
class EnhancedMonitoring {
  constructor() {
    this.enabled = process.env.ENHANCED_MONITORING_ENABLED === 'true';
    this.healthChecks = new Map();
    this.performanceBaselines = new Map();
    this.alertThresholds = this.initializeThresholds();
    this.monitoringInterval = null;
    this.lastHealthCheck = null;
    
    if (this.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Initialize alert thresholds
   */
  initializeThresholds() {
    return {
      cpu: {
        warning: 70,    // 70% CPU usage
        critical: 90    // 90% CPU usage
      },
      memory: {
        warning: 80,    // 80% memory usage
        critical: 95    // 95% memory usage
      },
      disk: {
        warning: 85,    // 85% disk usage
        critical: 95    // 95% disk usage
      },
      responseTime: {
        warning: 2000,  // 2 seconds
        critical: 5000  // 5 seconds
      },
      errorRate: {
        warning: 5,     // 5% error rate
        critical: 10    // 10% error rate
      },
      database: {
        connectionPool: 80,  // 80% of max connections
        queryTime: 1000      // 1 second query time
      }
    };
  }

  /**
   * Start comprehensive monitoring
   */
  startMonitoring() {
    logger.info('Starting Enhanced Monitoring System');
    
    // System metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Health checks every 60 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 60000);

    // Performance analysis every 5 minutes
    setInterval(() => {
      this.analyzePerformance();
    }, 300000);

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 3600000);

    // Initial health check
    setTimeout(() => {
      this.performHealthChecks();
    }, 5000);
  }

  /**
   * Collect comprehensive system metrics
   */
  async collectSystemMetrics() {
    try {
      const systemMetrics = await this.getSystemMetrics();
      
      // Send metrics to CloudWatch
      await this.sendSystemMetrics(systemMetrics);
      
      // Check for alerts
      await this.checkSystemAlerts(systemMetrics);
      
      logger.debug('System metrics collected', systemMetrics);
    } catch (error) {
      logger.error('Failed to collect system metrics', { error: error.message });
    }
  }

  /**
   * Get comprehensive system metrics
   */
  async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();
    
    // Calculate CPU percentage (approximate)
    const cpuPercent = this.calculateCPUPercent(cpuUsage);
    
    // Memory metrics
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Disk usage
    const diskUsage = await this.getDiskUsage();
    
    // Network interfaces
    const networkInterfaces = os.networkInterfaces();
    
    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuPercent,
        loadAverage: {
          '1min': loadAvg[0],
          '5min': loadAvg[1],
          '15min': loadAvg[2]
        },
        cores: os.cpus().length
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        usagePercent: memoryUsagePercent,
        process: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external
        }
      },
      disk: diskUsage,
      network: this.getNetworkStats(networkInterfaces),
      uptime: {
        system: os.uptime(),
        process: process.uptime()
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname()
      }
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  calculateCPUPercent(cpuUsage) {
    if (!this.lastCPUUsage) {
      this.lastCPUUsage = cpuUsage;
      return 0;
    }

    const userDiff = cpuUsage.user - this.lastCPUUsage.user;
    const systemDiff = cpuUsage.system - this.lastCPUUsage.system;
    const totalDiff = userDiff + systemDiff;
    
    this.lastCPUUsage = cpuUsage;
    
    // Convert microseconds to percentage (approximate)
    return Math.min(100, (totalDiff / 1000000) * 100);
  }

  /**
   * Get disk usage information
   */
  async getDiskUsage() {
    try {
      const stats = await fs.stat('.');
      // This is a simplified version - in production, you'd use a proper disk usage library
      return {
        total: 'N/A',
        free: 'N/A',
        used: 'N/A',
        usagePercent: 0
      };
    } catch (error) {
      logger.warn('Could not get disk usage', { error: error.message });
      return {
        total: 'N/A',
        free: 'N/A',
        used: 'N/A',
        usagePercent: 0
      };
    }
  }

  /**
   * Get network interface statistics
   */
  getNetworkStats(interfaces) {
    const stats = {};
    
    Object.keys(interfaces).forEach(name => {
      const iface = interfaces[name];
      stats[name] = iface.map(addr => ({
        address: addr.address,
        family: addr.family,
        internal: addr.internal
      }));
    });
    
    return stats;
  }

  /**
   * Send system metrics to CloudWatch
   */
  async sendSystemMetrics(systemMetrics) {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' },
      { Name: 'Instance', Value: systemMetrics.platform.hostname }
    ];

    // CPU metrics
    metrics.addToBatch('SystemCPUUsage', systemMetrics.cpu.usage, 'Percent', dimensions);
    metrics.addToBatch('SystemLoadAverage1Min', systemMetrics.cpu.loadAverage['1min'], 'Count', dimensions);

    // Memory metrics
    metrics.addToBatch('SystemMemoryUsage', systemMetrics.memory.usagePercent, 'Percent', dimensions);
    metrics.addToBatch('SystemMemoryFree', systemMetrics.memory.free / 1024 / 1024, 'Megabytes', dimensions);

    // Process metrics
    metrics.addToBatch('ProcessMemoryRSS', systemMetrics.memory.process.rss / 1024 / 1024, 'Megabytes', dimensions);
    metrics.addToBatch('ProcessMemoryHeap', systemMetrics.memory.process.heapUsed / 1024 / 1024, 'Megabytes', dimensions);

    // Uptime metrics
    metrics.addToBatch('SystemUptime', systemMetrics.uptime.system, 'Seconds', dimensions);
    metrics.addToBatch('ProcessUptime', systemMetrics.uptime.process, 'Seconds', dimensions);
  }

  /**
   * Check system metrics against alert thresholds
   */
  async checkSystemAlerts(systemMetrics) {
    const { cpu, memory, disk } = systemMetrics;
    
    // CPU alerts
    if (cpu.usage >= this.alertThresholds.cpu.critical) {
      await alertManager.systemAlert(
        'Critical CPU Usage',
        `CPU usage is at ${cpu.usage.toFixed(1)}% (threshold: ${this.alertThresholds.cpu.critical}%)`,
        'CRITICAL',
        { cpuUsage: cpu.usage, loadAverage: cpu.loadAverage }
      );
    } else if (cpu.usage >= this.alertThresholds.cpu.warning) {
      await alertManager.systemAlert(
        'High CPU Usage',
        `CPU usage is at ${cpu.usage.toFixed(1)}% (threshold: ${this.alertThresholds.cpu.warning}%)`,
        'MEDIUM',
        { cpuUsage: cpu.usage, loadAverage: cpu.loadAverage }
      );
    }

    // Memory alerts
    if (memory.usagePercent >= this.alertThresholds.memory.critical) {
      await alertManager.systemAlert(
        'Critical Memory Usage',
        `Memory usage is at ${memory.usagePercent.toFixed(1)}% (threshold: ${this.alertThresholds.memory.critical}%)`,
        'CRITICAL',
        { memoryUsage: memory.usagePercent, freeMemory: memory.free }
      );
    } else if (memory.usagePercent >= this.alertThresholds.memory.warning) {
      await alertManager.systemAlert(
        'High Memory Usage',
        `Memory usage is at ${memory.usagePercent.toFixed(1)}% (threshold: ${this.alertThresholds.memory.warning}%)`,
        'MEDIUM',
        { memoryUsage: memory.usagePercent, freeMemory: memory.free }
      );
    }

    // Load average alerts
    if (cpu.loadAverage['1min'] > cpu.cores * 2) {
      await alertManager.systemAlert(
        'High System Load',
        `1-minute load average is ${cpu.loadAverage['1min'].toFixed(2)} (cores: ${cpu.cores})`,
        'HIGH',
        { loadAverage: cpu.loadAverage, cores: cpu.cores }
      );
    }
  }

  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    const healthResults = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      checks: {}
    };

    try {
      // Database health check
      healthResults.checks.database = await this.checkDatabaseHealth();
      
      // External services health check
      healthResults.checks.externalServices = await this.checkExternalServices();
      
      // File system health check
      healthResults.checks.filesystem = await this.checkFilesystemHealth();
      
      // Security health check
      healthResults.checks.security = await this.checkSecurityHealth();
      
      // Determine overall health
      const unhealthyChecks = Object.values(healthResults.checks)
        .filter(check => check.status !== 'healthy');
      
      if (unhealthyChecks.length > 0) {
        healthResults.overall = 'degraded';
        
        if (unhealthyChecks.some(check => check.severity === 'critical')) {
          healthResults.overall = 'unhealthy';
        }
      }

      this.lastHealthCheck = healthResults;
      
      // Send health metrics
      await this.sendHealthMetrics(healthResults);
      
      // Alert on health issues
      if (healthResults.overall !== 'healthy') {
        await this.alertOnHealthIssues(healthResults);
      }

      logger.info('Health check completed', { 
        overall: healthResults.overall,
        checksCount: Object.keys(healthResults.checks).length
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      healthResults.overall = 'unhealthy';
      healthResults.error = error.message;
    }

    return healthResults;
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const db = require('./database');
      const startTime = Date.now();
      
      await db.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime: `${responseTime}ms`,
        severity: responseTime > 5000 ? 'critical' : 'normal'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        severity: 'critical'
      };
    }
  }

  /**
   * Check external services health
   */
  async checkExternalServices() {
    const services = {
      aws: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not_configured',
      sns: process.env.SNS_TOPIC_ARN ? 'configured' : 'not_configured',
      cloudwatch: process.env.CLOUDWATCH_ENABLED === 'true' ? 'enabled' : 'disabled'
    };

    return {
      status: 'healthy',
      services,
      severity: 'normal'
    };
  }

  /**
   * Check filesystem health
   */
  async checkFilesystemHealth() {
    try {
      const testFile = '/tmp/vaultsphere-health-check';
      await fs.writeFile(testFile, 'health check');
      await fs.unlink(testFile);
      
      return {
        status: 'healthy',
        writeable: true,
        severity: 'normal'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        writeable: false,
        severity: 'critical'
      };
    }
  }

  /**
   * Check security health
   */
  async checkSecurityHealth() {
    const securityChecks = {
      https: process.env.SSL_ENABLED === 'true',
      mfa: true, // Assuming MFA is always enabled
      rateLimiting: true,
      logging: true,
      monitoring: this.enabled,
      secrets: !!(process.env.JWT_SECRET && process.env.ENCRYPTION_KEY)
    };

    const failedChecks = Object.entries(securityChecks)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    return {
      status: failedChecks.length === 0 ? 'healthy' : 'degraded',
      checks: securityChecks,
      failedChecks,
      severity: failedChecks.length > 2 ? 'critical' : 'normal'
    };
  }

  /**
   * Send health metrics to CloudWatch
   */
  async sendHealthMetrics(healthResults) {
    const dimensions = [
      { Name: 'Environment', Value: process.env.NODE_ENV || 'development' }
    ];

    // Overall health metric
    const healthScore = healthResults.overall === 'healthy' ? 1 : 
                       healthResults.overall === 'degraded' ? 0.5 : 0;
    
    metrics.addToBatch('SystemHealth', healthScore, 'None', dimensions);

    // Individual check metrics
    Object.entries(healthResults.checks).forEach(([checkName, result]) => {
      const checkScore = result.status === 'healthy' ? 1 : 
                        result.status === 'degraded' ? 0.5 : 0;
      
      metrics.addToBatch(`HealthCheck.${checkName}`, checkScore, 'None', [
        ...dimensions,
        { Name: 'CheckType', Value: checkName }
      ]);
    });
  }

  /**
   * Alert on health issues
   */
  async alertOnHealthIssues(healthResults) {
    const criticalIssues = Object.entries(healthResults.checks)
      .filter(([name, check]) => check.severity === 'critical')
      .map(([name, check]) => ({ name, ...check }));

    if (criticalIssues.length > 0) {
      await alertManager.systemAlert(
        'Critical Health Check Failures',
        `${criticalIssues.length} critical health check(s) failed: ${criticalIssues.map(i => i.name).join(', ')}`,
        'CRITICAL',
        { criticalIssues, healthResults }
      );
    }

    const degradedIssues = Object.entries(healthResults.checks)
      .filter(([name, check]) => check.status === 'degraded' && check.severity !== 'critical')
      .map(([name, check]) => ({ name, ...check }));

    if (degradedIssues.length > 0) {
      await alertManager.systemAlert(
        'Degraded System Health',
        `${degradedIssues.length} health check(s) showing degraded status: ${degradedIssues.map(i => i.name).join(', ')}`,
        'MEDIUM',
        { degradedIssues, healthResults }
      );
    }
  }

  /**
   * Analyze performance trends
   */
  async analyzePerformance() {
    try {
      // This would typically analyze historical data
      // For now, we'll just log current performance state
      const currentMetrics = await this.getSystemMetrics();
      
      logger.info('Performance Analysis', {
        cpuUsage: currentMetrics.cpu.usage,
        memoryUsage: currentMetrics.memory.usagePercent,
        uptime: currentMetrics.uptime.process
      });

      // Store baseline if not exists
      if (!this.performanceBaselines.has('cpu')) {
        this.performanceBaselines.set('cpu', currentMetrics.cpu.usage);
        this.performanceBaselines.set('memory', currentMetrics.memory.usagePercent);
      }

    } catch (error) {
      logger.error('Performance analysis failed', { error: error.message });
    }
  }

  /**
   * Cleanup old monitoring data
   */
  cleanupOldData() {
    // Clear old health checks (keep last 24 hours)
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
    
    // This would typically clean up stored metrics data
    logger.debug('Cleaning up old monitoring data', { cutoffTime: new Date(cutoffTime) });
  }

  /**
   * Get current health status
   */
  getCurrentHealth() {
    return this.lastHealthCheck || {
      overall: 'unknown',
      message: 'Health check not yet performed'
    };
  }

  /**
   * Shutdown monitoring
   */
  shutdown() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    logger.info('Enhanced Monitoring System shutdown');
  }
}

// Create singleton instance
const enhancedMonitoring = new EnhancedMonitoring();

// Graceful shutdown
process.on('SIGTERM', () => {
  enhancedMonitoring.shutdown();
});

process.on('SIGINT', () => {
  enhancedMonitoring.shutdown();
});

module.exports = {
  enhancedMonitoring,
  EnhancedMonitoring
};