const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const https = require('https');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Import security and configuration modules
const { setupSecurityMiddleware, rateLimiters } = require('./middleware/security');
const { setupSSL, httpsRedirect } = require('./config/ssl');
const { logger, logSecurityEvent, logAuthEvent } = require('./config/logger');
const { metrics } = require('./config/cloudwatch');
const { alertManager } = require('./config/alerts');
const { 
  monitoringMiddleware, 
  monitorDatabase, 
  createHealthCheck, 
  createMetricsEndpoint,
  errorTrackingMiddleware 
} = require('./middleware/monitoring');
const {
  compressionMiddleware,
  cacheMiddleware,
  timeoutMiddleware,
  gracefulShutdown,
  initializePerformanceMonitoring
} = require('./middleware/performance');

const app = express();
const PORT = process.env.PORT || 5001;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// HTTPS redirect middleware (if SSL is enabled)
if (process.env.SSL_ENABLED === 'true') {
  app.use(httpsRedirect);
}

// Performance middleware setup
app.use(compressionMiddleware);
app.use(timeoutMiddleware(30000)); // 30 second timeout

// Security middleware setup
setupSecurityMiddleware(app);

// Enhanced CORS with security considerations
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com',
      'https://vaultsphere-frontend-2024-vats.s3-website.eu-north-1.amazonaws.com'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logSecurityEvent('CORS_VIOLATION', { origin, ip: 'unknown' });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced logging and monitoring middleware
app.use(monitoringMiddleware);

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId || null
    });
  });
  
  next();
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tenantRoutes = require('./routes/tenants');
const taskRoutes = require('./routes/tasks');
const mfaRoutes = require('./routes/mfa');

// Health check route with security info (cached for 5 minutes)
app.get('/', cacheMiddleware(300), (req, res) => {
  res.json({
    message: 'VaultSphere Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    security: {
      https: process.env.SSL_ENABLED === 'true',
      mfa: true,
      rateLimiting: true,
      logging: true,
      monitoring: true
    }
  });
});

// Enhanced health check with comprehensive monitoring (no cache for real-time status)
app.get('/api/health', createHealthCheck());

// Metrics endpoint for monitoring systems (no cache for real-time metrics)
app.get('/api/metrics', createMetricsEndpoint());

// Test endpoint for auth rate limiting (for security testing)
app.post('/api/test/auth-rate-limit', rateLimiters.auth, (req, res) => {
  res.json({ message: 'Auth rate limit test endpoint', timestamp: new Date().toISOString() });
});

// Apply rate limiting to different route groups
app.use('/api/auth', rateLimiters.auth, authRoutes);
app.use('/api/mfa', rateLimiters.auth, mfaRoutes);
app.use('/api/users', rateLimiters.general, userRoutes);
app.use('/api/tenants', rateLimiters.general, tenantRoutes);
app.use('/api/tasks', rateLimiters.general, taskRoutes);

// Error tracking middleware
app.use(errorTrackingMiddleware);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log security-related errors
  if (err.message.includes('CORS') || err.message.includes('rate limit')) {
    logSecurityEvent('SECURITY_ERROR', {
      error: err.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
    
    // Send security alert for critical issues
    alertManager.securityAlert(
      'Security Error Detected',
      `Security error: ${err.message}`,
      {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.originalUrl
      }
    );
  } else {
    logger.error('Application Error', {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.userId || null
    });
    
    // Send critical error alert for 500 errors
    if (err.status >= 500) {
      alertManager.criticalError(
        'Application Error',
        `Critical error: ${err.message}`,
        {
          url: req.originalUrl,
          method: req.method,
          ip: req.ip,
          userId: req.user?.userId || null
        }
      );
    }
  }

  res.status(err.status || 500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Enhanced 404 handler
app.use((req, res) => {
  logSecurityEvent('ROUTE_NOT_FOUND', {
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Initialize monitoring and alerting
async function initializeMonitoring() {
  try {
    // Setup database monitoring
    const db = require('./config/database');
    monitorDatabase(db);
    
    // Initialize performance monitoring
    initializePerformanceMonitoring(db.pool);
    
    // Test database connection
    await db.query('SELECT 1');
    logger.info('Database connection verified');
    
    // Initialize SNS topic for alerts if needed
    if (process.env.ALERTS_ENABLED === 'true' && !process.env.SNS_TOPIC_ARN) {
      const topicArn = await alertManager.createSNSTopic();
      console.log(`📧 SNS Topic created: ${topicArn}`);
      console.log('💡 Set SNS_TOPIC_ARN environment variable to:', topicArn);
    }
    
    logger.info('Monitoring and performance systems initialized');
  } catch (error) {
    logger.error('Failed to initialize monitoring', { error: error.message });
    // Don't fail startup if monitoring fails
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await gracefulShutdown();
});



// Start server with SSL support
async function startServer() {
  try {
    // Initialize monitoring and alerting
    await initializeMonitoring();
    
    // Start HTTP server
    const httpServer = app.listen(PORT, () => {
      logger.info('Server Started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        ssl: process.env.SSL_ENABLED === 'true',
        monitoring: process.env.CLOUDWATCH_ENABLED === 'true',
        alerts: process.env.ALERTS_ENABLED === 'true'
      });
      
      console.log(`🚀 VaultSphere Backend Server running on port ${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Metrics: http://localhost:${PORT}/api/metrics`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
      console.log(`🔒 MFA routes: http://localhost:${PORT}/api/mfa`);
      console.log(`👥 User routes: http://localhost:${PORT}/api/users`);
      console.log(`🏢 Tenant routes: http://localhost:${PORT}/api/tenants`);
      console.log(`📋 Task routes: http://localhost:${PORT}/api/tasks`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🛡️  Security: Rate limiting, MFA, Enhanced logging enabled`);
      console.log(`📈 Monitoring: CloudWatch metrics, Alerting system enabled`);
      
      // Send startup alert
      alertManager.systemAlert(
        'Application Started',
        `VaultSphere backend server started successfully on port ${PORT}`,
        'LOW',
        {
          port: PORT,
          environment: process.env.NODE_ENV || 'development',
          nodeVersion: process.version,
          uptime: process.uptime()
        }
      );
    });

    // Start HTTPS server if SSL is enabled
    let httpsServer;
    if (process.env.SSL_ENABLED === 'true') {
      try {
        const sslOptions = await setupSSL();
        if (sslOptions) {
          httpsServer = https.createServer(sslOptions, app);
          httpsServer.listen(HTTPS_PORT, () => {
            logger.info('HTTPS Server Started', { port: HTTPS_PORT });
            console.log(`🔒 HTTPS Server running on port ${HTTPS_PORT}`);
            console.log(`🏥 HTTPS Health check: https://localhost:${HTTPS_PORT}/api/health`);
          });
        }
      } catch (sslError) {
        logger.warn('SSL Setup Failed', { error: sslError.message });
        console.warn('⚠️  SSL setup failed, running HTTP only:', sslError.message);
      }
    }

    // Setup graceful shutdown for both servers
    const db = require('./config/database');
    gracefulShutdown(httpServer, db.pool);
    if (httpsServer) {
      gracefulShutdown(httpsServer, db.pool);
    }

  } catch (error) {
    logger.error('Server Startup Failed', { error: error.message });
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;