const { apiLogger } = require('../config/cloudwatch');

const monitoringMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Extract tenant_id from request or auth context
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenant_id || 'unknown';

  // Listener to capture response status and execution time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      tenant_id: tenantId,
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      response_time_ms: duration,
      user_id: req.user?.id || 'anonymous',
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      apiLogger.error('API Error Detected', logData);
    } else {
      apiLogger.info('API Request Handled', logData);
    }
  });

  next();
};

const errorTrackingMiddleware = (err, req, res, next) => {
  const tenantId = req.user?.tenant_id || 'unknown';
  
  apiLogger.error('Unhandled Application Exception', {
    tenant_id: tenantId,
    error: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  next(err);
};

const createHealthCheck = () => (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
};

const createMetricsEndpoint = () => (req, res) => {
  res.send('# VaultSphere Metrics Stub');
};

const monitorDatabase = (db) => {
  // Database monitoring stub
};

module.exports = { 
  monitoringMiddleware, 
  errorTrackingMiddleware,
  createHealthCheck,
  createMetricsEndpoint,
  monitorDatabase
};
