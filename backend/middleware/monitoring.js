const { metrics } = require('../config/cloudwatch');
const { logger } = require('../config/logger');

/**
 * Monitoring middleware for tracking API performance and errors
 */
function monitoringMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to capture response
  res.send = function(data) {
    captureMetrics();
    return originalSend.call(this, data);
  };

  // Override res.json to capture response
  res.json = function(data) {
    captureMetrics();
    return originalJson.call(this, data);
  };

  function captureMetrics() {
    const duration = Date.now() - startTime;
    const endpoint = getEndpointName(req.path);
    
    // Record API call metrics
    metrics.recordAPICall(
      endpoint,
      req.method,
      res.statusCode,
      duration
    );

    // Log slow requests
    if (duration > 2000) { // Slower than 2 seconds
      logger.warn('Slow API Request', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }

    // Log errors
    if (res.statusCode >= 400) {
      logger.warn('API Error Response', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.userId || null
      });
    }
  }

  next();
}

/**
 * Normalize endpoint names for better metrics grouping
 */
function getEndpointName(path) {
  // Replace IDs with placeholders for better grouping
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
    .replace(/\/[a-f0-9]{24}/g, '/:objectId');
}

/**
 * Database monitoring wrapper
 */
function monitorDatabase(db) {
  const originalQuery = db.query;
  
  db.query = async function(text, params) {
    const startTime = Date.now();
    const operation = getQueryOperation(text);
    
    try {
      const result = await originalQuery.call(this, text, params);
      const duration = Date.now() - startTime;
      
      // Record successful query
      metrics.recordDatabaseQuery(operation, duration, true);
      
      // Log slow queries
      if (duration > 1000) { // Slower than 1 second
        logger.warn('Slow Database Query', {
          operation,
          duration: `${duration}ms`,
          query: text.substring(0, 100) + '...'
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record failed query
      metrics.recordDatabaseQuery(operation, duration, false);
      
      logger.error('Database Query Error', {
        operation,
        duration: `${duration}ms`,
        error: error.message,
        query: text.substring(0, 100) + '...'
      });
      
      throw error;
    }
  };
  
  return db;
}

/**
 * Extract operation type from SQL query
 */
function getQueryOperation(query) {
  const normalizedQuery = query.trim().toUpperCase();
  
  if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
  if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
  if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
  if (normalizedQuery.startsWith('DELETE')) return 'DELETE';
  if (normalizedQuery.startsWith('CREATE')) return 'CREATE';
  if (normalizedQuery.startsWith('ALTER')) return 'ALTER';
  if (normalizedQuery.startsWith('DROP')) return 'DROP';
  
  return 'OTHER';
}

/**
 * Health check endpoint with detailed system information
 */
function createHealthCheck() {
  return async (req, res) => {
    const startTime = Date.now();
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    };

    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      healthData.memory = {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      };

      // CPU usage (approximate)
      const cpuUsage = process.cpuUsage();
      healthData.cpu = {
        user: cpuUsage.user,
        system: cpuUsage.system
      };

      // Database health check
      const db = require('../config/database');
      const dbStart = Date.now();
      await db.query('SELECT 1');
      const dbDuration = Date.now() - dbStart;
      
      healthData.database = {
        status: 'connected',
        responseTime: `${dbDuration}ms`
      };

      // Security features status
      healthData.security = {
        https: process.env.SSL_ENABLED === 'true',
        mfa: true,
        rateLimiting: true,
        logging: true,
        monitoring: process.env.CLOUDWATCH_ENABLED === 'true'
      };

      const totalDuration = Date.now() - startTime;
      healthData.responseTime = `${totalDuration}ms`;

      // Record health check metric
      metrics.recordAPICall('/api/health', 'GET', 200, totalDuration);

      res.json(healthData);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      
      logger.error('Health Check Failed', {
        error: error.message,
        duration: `${totalDuration}ms`
      });

      metrics.recordAPICall('/api/health', 'GET', 503, totalDuration);

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: `${totalDuration}ms`
      });
    }
  };
}

/**
 * Metrics endpoint for Prometheus/monitoring systems
 */
function createMetricsEndpoint() {
  return (req, res) => {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Simple Prometheus-style metrics
    const prometheusMetrics = `
# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_rss_bytes ${memUsage.rss}
nodejs_memory_usage_heap_total_bytes ${memUsage.heapTotal}
nodejs_memory_usage_heap_used_bytes ${memUsage.heapUsed}
nodejs_memory_usage_external_bytes ${memUsage.external}

# HELP nodejs_process_uptime_seconds Process uptime in seconds
# TYPE nodejs_process_uptime_seconds counter
nodejs_process_uptime_seconds ${uptime}

# HELP vaultsphere_build_info Build information
# TYPE vaultsphere_build_info gauge
vaultsphere_build_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1
`;

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics.trim());
  };
}

/**
 * Error tracking middleware
 */
function errorTrackingMiddleware(err, req, res, next) {
  // Record error metrics
  const endpoint = getEndpointName(req.path);
  metrics.recordAPICall(endpoint, req.method, err.status || 500, 0);

  // Record security events for specific error types
  if (err.message.includes('CORS') || err.message.includes('rate limit')) {
    metrics.recordSecurityEvent('API_SECURITY_ERROR', 'High');
  } else if (err.status === 401 || err.status === 403) {
    metrics.recordSecurityEvent('UNAUTHORIZED_ACCESS', 'Medium');
  }

  next(err);
}

module.exports = {
  monitoringMiddleware,
  monitorDatabase,
  createHealthCheck,
  createMetricsEndpoint,
  errorTrackingMiddleware
};