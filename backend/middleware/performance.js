const compression = require('compression');
const { logger } = require('../config/logger');
const { metrics } = require('../config/cloudwatch');

// Response compression middleware
const compressionMiddleware = compression({
  // Only compress responses larger than 1kb
  threshold: 1024,
  // Compression level (1-9, 6 is default)
  level: 6,
  // Don't compress if client doesn't support it
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Response caching middleware
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Don't cache authenticated requests
    if (req.headers.authorization) {
      return next();
    }

    // Set cache headers
    res.set({
      'Cache-Control': `public, max-age=${duration}`,
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });

    next();
  };
};

// Request timeout middleware
const timeoutMiddleware = (timeout = 30000) => {
  return (req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          method: req.method,
          url: req.url,
          ip: req.ip,
          timeout: timeout
        });

        // Send custom metrics
        if (metrics) {
          metrics.recordCustomMetric('RequestTimeout', 1, 'Count');
        }

        res.status(408).json({
          error: 'Request timeout',
          message: 'The request took too long to process'
        });
      }
    }, timeout);

    // Clear timeout when response is finished
    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Connection pooling optimization
const optimizeConnectionPool = (pool) => {
  // Monitor pool statistics
  setInterval(() => {
    const stats = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };

    logger.debug('Database pool statistics', stats);

    // Send metrics to CloudWatch
    if (metrics) {
      metrics.recordCustomMetric('DatabasePool.TotalConnections', stats.totalCount, 'Count');
      metrics.recordCustomMetric('DatabasePool.IdleConnections', stats.idleCount, 'Count');
      metrics.recordCustomMetric('DatabasePool.WaitingConnections', stats.waitingCount, 'Count');
    }

    // Alert if pool is under pressure
    if (stats.waitingCount > 5) {
      logger.warn('Database connection pool under pressure', stats);
    }
  }, 60000); // Check every minute
};

// Memory usage monitoring
const memoryMonitoring = () => {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    logger.debug('Memory usage', memUsageMB);

    // Send metrics to CloudWatch
    if (metrics) {
      metrics.recordCustomMetric('Memory.RSS', memUsageMB.rss, 'Megabytes');
      metrics.recordCustomMetric('Memory.HeapTotal', memUsageMB.heapTotal, 'Megabytes');
      metrics.recordCustomMetric('Memory.HeapUsed', memUsageMB.heapUsed, 'Megabytes');
      metrics.recordCustomMetric('Memory.External', memUsageMB.external, 'Megabytes');
    }

    // Alert if memory usage is high
    if (memUsageMB.heapUsed > 512) {
      logger.warn('High memory usage detected', memUsageMB);
    }

    // Force garbage collection if memory usage is very high
    if (memUsageMB.heapUsed > 800 && global.gc) {
      logger.info('Forcing garbage collection due to high memory usage');
      global.gc();
    }
  }, 30000); // Check every 30 seconds
};

// CPU usage monitoring
const cpuMonitoring = () => {
  let lastCpuUsage = process.cpuUsage();
  
  setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
    
    logger.debug('CPU usage', { cpuPercent });

    // Send metrics to CloudWatch
    if (metrics) {
      metrics.recordCustomMetric('CPU.Usage', cpuPercent, 'Percent');
    }

    // Alert if CPU usage is high
    if (cpuPercent > 80) {
      logger.warn('High CPU usage detected', { cpuPercent });
    }

    lastCpuUsage = process.cpuUsage();
  }, 30000); // Check every 30 seconds
};

// Event loop lag monitoring
const eventLoopMonitoring = () => {
  setInterval(() => {
    const start = process.hrtime.bigint();
    
    setImmediate(() => {
      const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
      
      logger.debug('Event loop lag', { lag });

      // Send metrics to CloudWatch
      if (metrics) {
        metrics.recordCustomMetric('EventLoop.Lag', lag, 'Milliseconds');
      }

      // Alert if event loop lag is high
      if (lag > 100) {
        logger.warn('High event loop lag detected', { lag });
      }
    });
  }, 30000); // Check every 30 seconds
};

// Graceful shutdown handler
const gracefulShutdown = (server, pool) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}, starting graceful shutdown`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');

      // Close database connections
      if (pool) {
        pool.end(() => {
          logger.info('Database pool closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Initialize performance monitoring
const initializePerformanceMonitoring = (pool) => {
  logger.info('Initializing performance monitoring');
  
  if (pool) {
    optimizeConnectionPool(pool);
  }
  
  memoryMonitoring();
  cpuMonitoring();
  eventLoopMonitoring();
};

module.exports = {
  compressionMiddleware,
  cacheMiddleware,
  timeoutMiddleware,
  optimizeConnectionPool,
  memoryMonitoring,
  cpuMonitoring,
  eventLoopMonitoring,
  gracefulShutdown,
  initializePerformanceMonitoring
};