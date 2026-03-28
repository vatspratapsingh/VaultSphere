const { redis, getRedisStatus } = require('../config/redis');
const { logger } = require('../config/logger');

// Tier configurations
const TIERS = {
  basic: { hour: 1000, minute: 100 },
  standard: { hour: 5000, minute: 500 },
  enterprise: { hour: 20000, minute: 2000 }
};

// Multipliers for granular limiting
const getMultiplier = (req) => {
  if (req.path.startsWith('/api/ml')) return 0.2; // ML: 20% of standard (5x cost)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) return 0.5; // Write: 50%
  return 1.0; // Read: 100%
};

const rateLimiter = async (req, res, next) => {
  // 1. Exclude public/internal endpoints
  const excludedPaths = ['/api/health', '/api/metrics'];
  if (excludedPaths.includes(req.path)) return next();

  // 2. Extract tenant context
  const tenantId = req.user?.tenant_id || req.user?.company || req.user?.role || 'anonymous';
  const tier = req.user?.tier || 'basic'; // Assumes tier is in JWT
  
  // 3. Fail-open if Redis is down
  const { isCircuitOpen, isConnected } = getRedisStatus();
  if (isCircuitOpen || !isConnected) {
    logger.warn('Rate limiting bypassed due to Redis issues', { tenantId });
    return next();
  }

  const multiplier = getMultiplier(req);
  const baseLimits = TIERS[tier];
  
  const limits = {
    hour: Math.floor(baseLimits.hour * multiplier),
    minute: Math.floor(baseLimits.minute * multiplier)
  };

  const now = Date.now();
  const windows = [
    { key: `ratelimit:${tenantId}:min:${req.path}`, duration: 60, limit: limits.minute },
    { key: `ratelimit:${tenantId}:hr:${req.path}`, duration: 3600, limit: limits.hour }
  ];

  try {
    for (const window of windows) {
      const { key, duration, limit } = window;
      const windowStart = now - (duration * 1000);

      // Sliding window using Sorted Sets
      const multi = redis.pipeline();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, now, `${now}:${Math.random()}`);
      multi.zcard(key);
      multi.expire(key, duration);
      
      const results = await multi.exec();
      const currentCount = results[2][1];

      // Allow 20% burst for 1 minute (only on minute window)
      const allowedLimit = (duration === 60) ? limit * 1.2 : limit;

      if (currentCount > allowedLimit) {
        const resetTime = Math.ceil((now + (duration * 1000)) / 1000);
        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', 0);
        res.set('X-RateLimit-Reset', resetTime);
        res.set('Retry-After', duration === 60 ? 60 : 3600);
        
        logger.warn('Rate limit exceeded', { tenantId, tier, path: req.path, count: currentCount });
        return res.status(429).json({
          error: 'Too Many Requests',
          message: `Rate limit exceeded for ${tier} tier.`,
          retry_after: res.get('Retry-After')
        });
      }

      // Set headers for the most restrictive window (usually minute)
      if (duration === 60) {
        res.set('X-RateLimit-Limit', limit);
        res.set('X-RateLimit-Remaining', Math.max(0, limit - currentCount));
        res.set('X-RateLimit-Reset', Math.ceil((now + 60000) / 1000));
      }
    }
    next();
  } catch (error) {
    logger.error('Rate limiting error', { error: error.message, tenantId });
    next(); // Fail open on error
  }
};

module.exports = rateLimiter;
